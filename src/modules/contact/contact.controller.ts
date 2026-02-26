import { Request, Response, NextFunction } from 'express';
import { ContactService } from './contact.service';
import { IdentifyResponse } from '../../common/types';

export class ContactController {
  constructor(private readonly contactService: ContactService) {}

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
}
