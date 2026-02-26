import { Request, Response, NextFunction } from 'express';
import { ContactService } from './contact.service';
import { ContactRepository } from './contact.repository';
import { IdentifyResponse } from '../../common/types';

export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly contactRepository: ContactRepository,
  ) {}

  identify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, phoneNumber } = req.body;

      const result = await this.contactService.identify(
        email ?? null,
        phoneNumber ? String(phoneNumber) : null,
      );

      const response: IdentifyResponse = { contact: result };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAllContacts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contacts = await this.contactRepository.findAll();
      res.status(200).json({ contacts });
    } catch (error) {
      next(error);
    }
  };
}
