const test = require('node:test');
const assert = require('node:assert/strict');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifySchema,
  forgotSchema,
  resetSchema,
  googleSchema,
} = require('../src/validators/authValidator');

test('auth validator accepts valid payloads', () => {
  assert.doesNotThrow(() => registerSchema.parse({
    email: 'creator@example.com',
    password: 'password123',
    name: 'Creator',
    role: 'CREATOR',
  }));

  assert.doesNotThrow(() => loginSchema.parse({
    email: 'creator@example.com',
    password: 'password123',
  }));

  assert.doesNotThrow(() => refreshSchema.parse({
    refreshToken: 'refresh-token',
  }));

  assert.doesNotThrow(() => verifySchema.parse({
    token: 'verification-token',
  }));

  assert.doesNotThrow(() => forgotSchema.parse({
    email: 'creator@example.com',
  }));

  assert.doesNotThrow(() => resetSchema.parse({
    token: 'reset-token',
    newPassword: 'newPassword1',
  }));

  assert.doesNotThrow(() => googleSchema.parse({
    idToken: 'google-id-token',
  }));
});

test('auth validator rejects invalid register payload', () => {
  assert.throws(
    () => registerSchema.parse({ email: 'bad-email', password: 'short' }),
    /Invalid email|password/i,
  );
});

test('auth validator rejects invalid google payload', () => {
  assert.throws(
    () => googleSchema.parse({ idToken: '' }),
    /String must contain at least 1 character/i,
  );
});
