import { ContactService } from '../src/modules/contact/contact.service';
import { ContactRepository } from '../src/modules/contact/contact.repository';
import { LinkPrecedence, Contact } from '@prisma/client';

// Mock the logger to avoid noisy output during tests
jest.mock('../src/common/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
  },
}));

function makeContact(overrides: Partial<Contact> & { id: number }): Contact {
  return {
    phoneNumber: null,
    email: null,
    linkedId: null,
    linkPrecedence: LinkPrecedence.primary,
    createdAt: new Date('2023-04-01'),
    updatedAt: new Date('2023-04-01'),
    deletedAt: null,
    ...overrides,
  };
}

describe('ContactService', () => {
  let service: ContactService;
  let repo: jest.Mocked<ContactRepository>;

  beforeEach(() => {
    repo = {
      findByEmailOrPhone: jest.fn(),
      findPrimaryWithSecondaries: jest.fn(),
      create: jest.fn(),
      demoteToPrimary: jest.fn(),
    } as any;

    service = new ContactService(repo);
  });

  describe('identify', () => {
    it('should create a new primary contact when no matches exist', async () => {
      const newContact = makeContact({
        id: 1,
        email: 'doc@hillvalley.edu',
        phoneNumber: '123456',
        linkPrecedence: LinkPrecedence.primary,
      });

      repo.findByEmailOrPhone.mockResolvedValue([]);
      repo.create.mockResolvedValue(newContact);

      const result = await service.identify('doc@hillvalley.edu', '123456');

      expect(repo.create).toHaveBeenCalledWith({
        email: 'doc@hillvalley.edu',
        phoneNumber: '123456',
        linkedId: null,
        linkPrecedence: LinkPrecedence.primary,
      });
      expect(result.primaryContatctId).toBe(1);
      expect(result.emails).toEqual(['doc@hillvalley.edu']);
      expect(result.phoneNumbers).toEqual(['123456']);
      expect(result.secondaryContactIds).toEqual([]);
    });

    it('should return existing contact when exact match found', async () => {
      const existing = makeContact({
        id: 1,
        email: 'lorraine@hillvalley.edu',
        phoneNumber: '123456',
        linkPrecedence: LinkPrecedence.primary,
      });

      repo.findByEmailOrPhone.mockResolvedValue([existing]);
      repo.findPrimaryWithSecondaries.mockResolvedValue([existing]);

      const result = await service.identify('lorraine@hillvalley.edu', '123456');

      expect(repo.create).not.toHaveBeenCalled();
      expect(result.primaryContatctId).toBe(1);
      expect(result.emails).toEqual(['lorraine@hillvalley.edu']);
      expect(result.phoneNumbers).toEqual(['123456']);
    });

    it('should create a secondary contact when new info is linked to existing contact', async () => {
      const primary = makeContact({
        id: 1,
        email: 'lorraine@hillvalley.edu',
        phoneNumber: '123456',
        linkPrecedence: LinkPrecedence.primary,
      });

      const newSecondary = makeContact({
        id: 23,
        email: 'mcfly@hillvalley.edu',
        phoneNumber: '123456',
        linkedId: 1,
        linkPrecedence: LinkPrecedence.secondary,
        createdAt: new Date('2023-04-20'),
      });

      repo.findByEmailOrPhone.mockResolvedValue([primary]);
      repo.create.mockResolvedValue(newSecondary);
      repo.findPrimaryWithSecondaries.mockResolvedValue([primary, newSecondary]);

      const result = await service.identify('mcfly@hillvalley.edu', '123456');

      expect(repo.create).toHaveBeenCalledWith({
        email: 'mcfly@hillvalley.edu',
        phoneNumber: '123456',
        linkedId: 1,
        linkPrecedence: LinkPrecedence.secondary,
      });
      expect(result.primaryContatctId).toBe(1);
      expect(result.emails).toContain('lorraine@hillvalley.edu');
      expect(result.emails).toContain('mcfly@hillvalley.edu');
      expect(result.secondaryContactIds).toContain(23);
    });

    it('should merge two primaries when request bridges them', async () => {
      const primaryA = makeContact({
        id: 11,
        email: 'george@hillvalley.edu',
        phoneNumber: '919191',
        linkPrecedence: LinkPrecedence.primary,
        createdAt: new Date('2023-04-11'),
      });

      const primaryB = makeContact({
        id: 27,
        email: 'biffsucks@hillvalley.edu',
        phoneNumber: '717171',
        linkPrecedence: LinkPrecedence.primary,
        createdAt: new Date('2023-04-21'),
      });

      repo.findByEmailOrPhone.mockResolvedValue([primaryA, primaryB]);
      repo.demoteToPrimary.mockResolvedValue(undefined);
      repo.findPrimaryWithSecondaries.mockResolvedValue([
        primaryA,
        { ...primaryB, linkedId: 11, linkPrecedence: LinkPrecedence.secondary },
      ]);

      const result = await service.identify('george@hillvalley.edu', '717171');

      expect(repo.demoteToPrimary).toHaveBeenCalledWith(27, 11);
      expect(result.primaryContatctId).toBe(11);
      expect(result.emails).toContain('george@hillvalley.edu');
      expect(result.emails).toContain('biffsucks@hillvalley.edu');
      expect(result.phoneNumbers).toContain('919191');
      expect(result.phoneNumbers).toContain('717171');
    });

    it('should handle email-only request', async () => {
      const existing = makeContact({
        id: 1,
        email: 'lorraine@hillvalley.edu',
        phoneNumber: '123456',
        linkPrecedence: LinkPrecedence.primary,
      });

      repo.findByEmailOrPhone.mockResolvedValue([existing]);
      repo.findPrimaryWithSecondaries.mockResolvedValue([existing]);

      const result = await service.identify('lorraine@hillvalley.edu', null);

      expect(result.primaryContatctId).toBe(1);
      expect(result.emails).toEqual(['lorraine@hillvalley.edu']);
      expect(result.phoneNumbers).toEqual(['123456']);
    });

    it('should handle phone-only request', async () => {
      const existing = makeContact({
        id: 1,
        email: 'lorraine@hillvalley.edu',
        phoneNumber: '123456',
        linkPrecedence: LinkPrecedence.primary,
      });

      repo.findByEmailOrPhone.mockResolvedValue([existing]);
      repo.findPrimaryWithSecondaries.mockResolvedValue([existing]);

      const result = await service.identify(null, '123456');

      expect(result.primaryContatctId).toBe(1);
      expect(result.phoneNumbers).toEqual(['123456']);
    });

    it('should not create duplicate secondary when both values already exist', async () => {
      const primary = makeContact({
        id: 1,
        email: 'lorraine@hillvalley.edu',
        phoneNumber: '123456',
        linkPrecedence: LinkPrecedence.primary,
      });

      const secondary = makeContact({
        id: 23,
        email: 'mcfly@hillvalley.edu',
        phoneNumber: '123456',
        linkedId: 1,
        linkPrecedence: LinkPrecedence.secondary,
      });

      repo.findByEmailOrPhone.mockResolvedValue([primary, secondary]);
      repo.findPrimaryWithSecondaries.mockResolvedValue([primary, secondary]);

      const result = await service.identify('mcfly@hillvalley.edu', '123456');

      expect(repo.create).not.toHaveBeenCalled();
      expect(result.primaryContatctId).toBe(1);
    });

    it('should resolve primary ID from secondary contacts linkedId', async () => {
      const secondary = makeContact({
        id: 23,
        email: 'mcfly@hillvalley.edu',
        phoneNumber: '123456',
        linkedId: 1,
        linkPrecedence: LinkPrecedence.secondary,
      });

      const primary = makeContact({
        id: 1,
        email: 'lorraine@hillvalley.edu',
        phoneNumber: '123456',
        linkPrecedence: LinkPrecedence.primary,
      });

      repo.findByEmailOrPhone.mockResolvedValue([secondary]);
      repo.findPrimaryWithSecondaries.mockResolvedValue([primary, secondary]);

      const result = await service.identify('mcfly@hillvalley.edu', null);

      expect(result.primaryContatctId).toBe(1);
      expect(result.secondaryContactIds).toEqual([23]);
    });
  });
});
