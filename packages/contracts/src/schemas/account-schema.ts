import { z } from 'zod';
export const usernameSchema = z
  .string()
  .regex(/^[A-Za-z0-9_]{3,24}$/, 'Use 3–24 letters, numbers or underscores')
  .transform((value) => value.toLowerCase());
export const nameSchema = z.string().trim().min(1, 'Enter your name').max(80);
export const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters')
  .max(128);
export const registerSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    firstName: nameSchema,
    lastName: nameSchema,
  })
  .strict();
export const loginSchema = registerSchema.pick({
  username: true,
  password: true,
});
export const updateProfileSchema = registerSchema
  .pick({ firstName: true, lastName: true })
  .extend({ profileImageAssetId: z.uuid().nullable().optional() })
  .strict();
export const uploadIntentSchema = z
  .object({
    mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    byteSize: z
      .number()
      .int()
      .positive()
      .max(10 * 1024 * 1024),
  })
  .strict();
export const assetIdSchema = z.uuid();
export const profileSchema = z.object({
  id: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  profileImageAssetId: z.uuid().nullable(),
});
export const assetAccessSchema = z.object({
  url: z.url(),
  expiresAt: z.string(),
});
export const uploadIntentResponseSchema = z.object({
  assetId: z.uuid(),
  uploadUrl: z.url(),
  expiresAt: z.string(),
  requiredHeaders: z.record(z.string(), z.string()),
});
export type Profile = z.infer<typeof profileSchema>;
