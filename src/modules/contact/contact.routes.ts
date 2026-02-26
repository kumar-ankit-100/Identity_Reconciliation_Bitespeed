import { Router } from 'express';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactRepository } from './contact.repository';
import { validate } from '../../middleware/validate';
import { identifySchema } from './contact.schema';
import { prisma } from '../../config/database';

const contactRepository = new ContactRepository(prisma);
const contactService = new ContactService(contactRepository);
const contactController = new ContactController(contactService);

const router = Router();

/**
 * @openapi
 * /identify:
 *   post:
 *     summary: Identify and reconcile a customer contact
 *     description: >
 *       Receives an email and/or phone number and returns a consolidated contact
 *       linking all known identities for the customer. Creates new primary or
 *       secondary contacts as needed, and merges separate contact groups when
 *       a request bridges two previously unlinked primaries.
 *     tags:
 *       - Contact
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 example: "mcfly@hillvalley.edu"
 *               phoneNumber:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                 nullable: true
 *                 example: "123456"
 *           examples:
 *             both:
 *               summary: Both email and phone
 *               value:
 *                 email: "mcfly@hillvalley.edu"
 *                 phoneNumber: "123456"
 *             emailOnly:
 *               summary: Email only
 *               value:
 *                 email: "lorraine@hillvalley.edu"
 *             phoneOnly:
 *               summary: Phone only
 *               value:
 *                 phoneNumber: "123456"
 *     responses:
 *       200:
 *         description: Consolidated contact returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contact:
 *                   type: object
 *                   properties:
 *                     primaryContatctId:
 *                       type: integer
 *                       example: 1
 *                     emails:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"]
 *                     phoneNumbers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["123456"]
 *                     secondaryContactIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [23]
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "At least one of email or phoneNumber must be provided"
 */
router.post('/identify', validate(identifySchema), contactController.identify);

export { router as contactRoutes };
