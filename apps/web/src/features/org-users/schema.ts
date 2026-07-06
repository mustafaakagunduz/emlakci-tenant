import { z } from 'zod';

export const createOrgUserSchema = z.object({
  fullName: z.string().min(1, 'errors.fullNameRequired'),
  email: z.string().email('errors.emailInvalid'),
  password: z.string().min(8, 'errors.passwordTooShort'),
  role: z.enum(['ORG_ADMIN', 'AGENT']),
});
export type CreateOrgUserFormValues = z.infer<typeof createOrgUserSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'errors.passwordTooShort'),
});
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
