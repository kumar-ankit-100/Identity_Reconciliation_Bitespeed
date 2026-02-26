import { z } from 'zod';

export const identifySchema = z
  .object({
    email: z
      .string()
      .transform((val) => val?.trim().toLowerCase() || null)
      .pipe(z.string().email('Invalid email format').max(255).nullable())
      .nullable()
      .optional()
      .transform((val) => val ?? null),
    phoneNumber: z
      .union([z.string(), z.number()])
      .nullable()
      .optional()
      .transform((val) => {
        if (val === null || val === undefined) return null;
        return String(val).trim();
      }),
  })
  .refine((data) => data.email || data.phoneNumber, {
    message: 'At least one of email or phoneNumber must be provided',
  });

export type IdentifyInput = z.infer<typeof identifySchema>;
