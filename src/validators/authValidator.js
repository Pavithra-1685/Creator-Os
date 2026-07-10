const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  role: z.enum(['CREATOR','EDITOR','MANAGER','FINANCE_MANAGER','ADMIN']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const verifySchema = z.object({
  token: z.string().min(1),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const googleSchema = z.object({
  idToken: z.string().min(1),
});

module.exports = { registerSchema, loginSchema, refreshSchema, verifySchema, forgotSchema, resetSchema, googleSchema };
