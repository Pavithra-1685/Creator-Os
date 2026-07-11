const test = require('node:test');
const assert = require('node:assert/strict');
const { makeRes } = require('./testUtils');
const authController = require('../src/controllers/authController');
const authService = require('../src/services/authService');

const restore = (originals) => {
  Object.entries(originals).forEach(([key, fn]) => {
    authService[key] = fn;
  });
};

test('auth controller register returns created user and tokens', async () => {
  const originalRegister = authService.register;
  authService.register = async ({ email, password, name, role }) => ({
    user: { id: 'user-1', email, name, role },
    tokens: { accessToken: 'access', refreshToken: 'refresh' },
  });

  const req = { body: { email: 'creator@example.com', password: 'password123', name: 'Creator' } };
  const res = makeRes();
  const next = (err) => { throw err; };

  await authController.register(req, res, next);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.user.email, 'creator@example.com');
  assert.equal(res.body.data.tokens.accessToken, 'access');

  authService.register = originalRegister;
});

test('auth controller login returns user and tokens', async () => {
  const originalLogin = authService.login;
  authService.login = async ({ email, password }) => ({
    user: { id: 'user-2', email },
    tokens: { accessToken: 'access2', refreshToken: 'refresh2' },
  });

  const req = { body: { email: 'creator@example.com', password: 'password123' } };
  const res = makeRes();
  const next = (err) => { throw err; };

  await authController.login(req, res, next);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'Logged in');
  assert.equal(res.body.data.tokens.refreshToken, 'refresh2');

  authService.login = originalLogin;
});

test('auth controller verifyEmail calls verifyEmail service and returns success', async () => {
  const originalVerify = authService.verifyEmail;
  authService.verifyEmail = async ({ token }) => {
    assert.equal(token, 'verification-token');
    return true;
  };

  const req = { query: { token: 'verification-token' } };
  const res = makeRes();
  const next = (err) => { throw err; };

  await authController.verifyEmail(req, res, next);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'Email verified');

  authService.verifyEmail = originalVerify;
});

test('auth controller forgotPassword returns generic success when service resolves', async () => {
  const originalForgot = authService.requestPasswordReset;
  authService.requestPasswordReset = async ({ email }) => {
    assert.equal(email, 'creator@example.com');
    return true;
  };

  const req = { body: { email: 'creator@example.com' } };
  const res = makeRes();
  const next = (err) => { throw err; };

  await authController.forgotPassword(req, res, next);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'If the email exists, a reset link has been sent');

  authService.requestPasswordReset = originalForgot;
});

test('auth controller resetPassword returns success after reset', async () => {
  const originalReset = authService.resetPassword;
  authService.resetPassword = async ({ token, newPassword }) => {
    assert.equal(token, 'reset-token');
    assert.equal(newPassword, 'newPassword1');
    return true;
  };

  const req = { body: { token: 'reset-token', newPassword: 'newPassword1' } };
  const res = makeRes();
  const next = (err) => { throw err; };

  await authController.resetPassword(req, res, next);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'Password reset successful');

  authService.resetPassword = originalReset;
});

test('auth controller googleLogin returns tokens from googleOAuth service', async () => {
  const originalGoogle = authService.googleOAuth;
  authService.googleOAuth = async ({ idToken }) => ({
    user: { id: 'user-3', email: 'creator@example.com' },
    tokens: { accessToken: 'google-access', refreshToken: 'google-refresh' },
  });

  const req = { body: { idToken: 'google-id-token' } };
  const res = makeRes();
  const next = (err) => { throw err; };

  await authController.googleLogin(req, res, next);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'Logged in with Google');
  assert.equal(res.body.data.tokens.accessToken, 'google-access');

  authService.googleOAuth = originalGoogle;
});
