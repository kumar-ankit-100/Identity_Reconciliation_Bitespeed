import { Contact, LinkPrecedence } from '@prisma/client';

export type ContactRecord = Contact;

export interface CreateContactInput {
  email: string | null;
  phoneNumber: string | null;
  linkedId: number | null;
  linkPrecedence: LinkPrecedence;
}
