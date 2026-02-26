import { Contact, LinkPrecedence } from '@prisma/client';
import { ContactRepository } from './contact.repository';
import { ConsolidatedContact } from '../../common/types';
import { logger } from '../../common/logger';

export class ContactService {
  constructor(private readonly contactRepo: ContactRepository) {}

  async identify(
    email: string | null,
    phoneNumber: string | null,
  ): Promise<ConsolidatedContact> {
    const matchedContacts = await this.contactRepo.findByEmailOrPhone(email, phoneNumber);

    // No existing contacts — create a new primary
    if (matchedContacts.length === 0) {
      const newContact = await this.contactRepo.create({
        email,
        phoneNumber,
        linkedId: null,
        linkPrecedence: LinkPrecedence.primary,
      });

      logger.info({ contactId: newContact.id }, 'Created new primary contact');
      return this.buildResponse([newContact]);
    }

    // Resolve all distinct primary IDs from matched contacts
    const primaryIds = this.resolvePrimaryIds(matchedContacts);

    // If two different primaries are found, merge them
    if (primaryIds.size > 1) {
      await this.mergePrimaries(primaryIds, matchedContacts);
    }

    // After potential merge, determine the single primary
    const primaryId = this.getOldestPrimaryId(primaryIds, matchedContacts);

    // Check if we need to create a secondary for new information
    const needsNewSecondary = this.shouldCreateSecondary(matchedContacts, email, phoneNumber);
    if (needsNewSecondary) {
      const newSecondary = await this.contactRepo.create({
        email,
        phoneNumber,
        linkedId: primaryId,
        linkPrecedence: LinkPrecedence.secondary,
      });
      logger.info(
        { contactId: newSecondary.id, primaryId },
        'Created new secondary contact',
      );
    }

    // Fetch the consolidated view
    const allContacts = await this.contactRepo.findPrimaryWithSecondaries(primaryId);
    return this.buildResponse(allContacts);
  }

  private resolvePrimaryIds(contacts: Contact[]): Set<number> {
    const ids = new Set<number>();
    for (const c of contacts) {
      if (c.linkPrecedence === LinkPrecedence.primary) {
        ids.add(c.id);
      } else if (c.linkedId) {
        ids.add(c.linkedId);
      }
    }
    return ids;
  }

  private getOldestPrimaryId(primaryIds: Set<number>, contacts: Contact[]): number {
    const primaries = contacts
      .filter((c) => primaryIds.has(c.id) && c.linkPrecedence === LinkPrecedence.primary)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (primaries.length > 0) return primaries[0].id;

    // Fallback: use the smallest primary ID (oldest by auto-increment)
    return Math.min(...Array.from(primaryIds));
  }

  private async mergePrimaries(
    primaryIds: Set<number>,
    contacts: Contact[],
  ): Promise<void> {
    const sortedPrimaryIds = Array.from(primaryIds).sort((a, b) => {
      const contactA = contacts.find((c) => c.id === a);
      const contactB = contacts.find((c) => c.id === b);
      if (contactA && contactB) {
        return contactA.createdAt.getTime() - contactB.createdAt.getTime();
      }
      return a - b;
    });

    const winningPrimaryId = sortedPrimaryIds[0];
    const losingPrimaryIds = sortedPrimaryIds.slice(1);

    for (const losingId of losingPrimaryIds) {
      logger.info(
        { winningPrimaryId, losingPrimaryId: losingId },
        'Merging primary contacts',
      );
      await this.contactRepo.demoteToPrimary(losingId, winningPrimaryId);
    }
  }

  private shouldCreateSecondary(
    existingContacts: Contact[],
    email: string | null,
    phoneNumber: string | null,
  ): boolean {
    if (!email && !phoneNumber) return false;

    // Check if the exact combination already exists
    const exactMatch = existingContacts.some(
      (c) =>
        (email ? c.email === email : c.email === null) &&
        (phoneNumber ? c.phoneNumber === phoneNumber : c.phoneNumber === null),
    );
    if (exactMatch) return false;

    // Both values provided — check if this combination of info is new
    if (email && phoneNumber) {
      const hasEmail = existingContacts.some((c) => c.email === email);
      const hasPhone = existingContacts.some((c) => c.phoneNumber === phoneNumber);

      // If both already exist in the dataset (possibly linking two groups), no new row needed
      if (hasEmail && hasPhone) return false;

      // New info exists that should be linked
      return true;
    }

    // Only one value provided — no new info to create a secondary for
    return false;
  }

  private buildResponse(contacts: Contact[]): ConsolidatedContact {
    const primary = contacts.find((c) => c.linkPrecedence === LinkPrecedence.primary);
    const secondaries = contacts.filter((c) => c.linkPrecedence === LinkPrecedence.secondary);

    const emails = new Set<string>();
    const phoneNumbers = new Set<string>();
    const secondaryIds: number[] = [];

    // Primary contact info first
    if (primary?.email) emails.add(primary.email);
    if (primary?.phoneNumber) phoneNumbers.add(primary.phoneNumber);

    // Then secondary contacts
    for (const sec of secondaries) {
      if (sec.email) emails.add(sec.email);
      if (sec.phoneNumber) phoneNumbers.add(sec.phoneNumber);
      secondaryIds.push(sec.id);
    }

    return {
      primaryContatctId: primary?.id ?? contacts[0].id,
      emails: Array.from(emails),
      phoneNumbers: Array.from(phoneNumbers),
      secondaryContactIds: secondaryIds,
    };
  }
}
