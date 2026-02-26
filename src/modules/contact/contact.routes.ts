import { Router } from 'express';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactRepository } from './contact.repository';
import { validate } from '../../middleware/validate';
import { identifySchema } from './contact.schema';
import { prisma } from '../../config/database';

const contactRepository = new ContactRepository(prisma);
const contactService = new ContactService(contactRepository);
const contactController = new ContactController(contactService, contactRepository);

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

/**
 * @openapi
 * /contacts:
 *   get:
 *     summary: Get all contacts
 *     description: Returns a JSON array of all contact records stored in the database.
 *     tags:
 *       - Contact
 *     responses:
 *       200:
 *         description: List of all contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contacts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       phoneNumber:
 *                         type: string
 *                         nullable: true
 *                         example: "123456"
 *                       email:
 *                         type: string
 *                         nullable: true
 *                         example: "mcfly@hillvalley.edu"
 *                       linkedId:
 *                         type: integer
 *                         nullable: true
 *                         example: null
 *                       linkPrecedence:
 *                         type: string
 *                         enum: [primary, secondary]
 *                         example: "primary"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       deletedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 */
router.get('/contacts', contactController.getAllContacts);

export { router as contactRoutes };
