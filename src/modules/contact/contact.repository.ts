import { PrismaClient, Contact, LinkPrecedence, Prisma } from '@prisma/client';

export class ContactRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmailOrPhone(email: string | null, phoneNumber: string | null): Promise<Contact[]> {
    const conditions: Prisma.ContactWhereInput[] = [];

    if (email) {
      conditions.push({ email, deletedAt: null });
    }
    if (phoneNumber) {
      conditions.push({ phoneNumber, deletedAt: null });
    }

    if (conditions.length === 0) return [];

    return this.db.contact.findMany({
      where: { OR: conditions },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findPrimaryWithSecondaries(primaryId: number): Promise<Contact[]> {
    return this.db.contact.findMany({
      where: {
        OR: [{ id: primaryId }, { linkedId: primaryId }],
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: {
    email: string | null;
    phoneNumber: string | null;
    linkedId: number | null;
    linkPrecedence: LinkPrecedence;
  }): Promise<Contact> {
    return this.db.contact.create({ data });
  }

  async demoteToPrimary(
    contactId: number,
    newPrimaryId: number,
  ): Promise<void> {
    await this.db.$transaction([
      // Demote the old primary to secondary
      this.db.contact.update({
        where: { id: contactId },
        data: {
          linkedId: newPrimaryId,
          linkPrecedence: LinkPrecedence.secondary,
          updatedAt: new Date(),
        },
      }),
      // Re-link all secondaries of the demoted primary to the new primary
      this.db.contact.updateMany({
        where: { linkedId: contactId, deletedAt: null },
        data: {
          linkedId: newPrimaryId,
          updatedAt: new Date(),
        },
      }),
    ]);
  }
}
