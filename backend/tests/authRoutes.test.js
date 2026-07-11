const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer, jsonRequest, createStub } = require('./testUtils');
const authService = require('../src/services/authService');

const bodyData = { email: 'creator@example.com', password: 'password123', name: 'Creator' };

test('auth router register endpoint returns created user and tokens', async () => {
  const restore = createStub(authService, 'register', async (payload) => {
    assert.equal(payload.email, bodyData.email);
    return { user: { id: 'u1', email: payload.email }, tokens: { accessToken: 'a1', refreshToken: 'r1' } };
  });

  const { server, port } = await startServer();
  const res = await jsonRequest({ port, path: '/api/v1/auth/register', body: bodyData });
  server.close();
  restore();

  assert.equal(res.status, 200);
  assert.equal(res.json.success, true);
  assert.equal(res.json.data.user.email, bodyData.email);
  assert.equal(res.json.data.tokens.accessToken, 'a1');
});

test('auth router login endpoint returns tokens', async () => {
  const restore = createStub(authService, 'login', async (payload) => {
    assert.equal(payload.email, bodyData.email);
    return { user: { id: 'u2', email: payload.email }, tokens: { accessToken: 'a2', refreshToken: 'r2' } };
  });

  const { server, port } = await startServer();
  const res = await jsonRequest({ port, path: '/api/v1/auth/login', body: { email: bodyData.email, password: bodyData.password } });
  server.close();
  restore();

  assert.equal(res.status, 200);
  assert.equal(res.json.message, 'Logged in');
  assert.equal(res.json.data.tokens.refreshToken, 'r2');
});

test('auth router verify-email endpoint returns success', async () => {
  const restore = createStub(authService, 'verifyEmail', async ({ token }) => {
    assert.equal(token, 'verify-token');
    return true;
  });

  const { server, port } = await startServer();
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/auth/verify-email?token=verify-token`);
  const json = await response.json();
  server.close();
  restore();

  assert.equal(response.status, 200);
  assert.equal(json.message, 'Email verified');
});

test('auth router forgot-password endpoint returns generic response', async () => {
  const restore = createStub(authService, 'requestPasswordReset', async ({ email }) => {
    assert.equal(email, bodyData.email);
    return true;
  });

  const { server, port } = await startServer();
  const res = await jsonRequest({ port, path: '/api/v1/auth/forgot-password', body: { email: bodyData.email } });
  server.close();
  restore();

  assert.equal(res.status, 200);
  assert.equal(res.json.message, 'If the email exists, a reset link has been sent');
});

test('auth router reset-password endpoint returns success', async () => {
  const restore = createStub(authService, 'resetPassword', async ({ token, newPassword }) => {
    assert.equal(token, 'reset-token');
    assert.equal(newPassword, 'newPassword1');
    return true;
  });

  const { server, port } = await startServer();
  const res = await jsonRequest({ port, path: '/api/v1/auth/reset-password', body: { token: 'reset-token', newPassword: 'newPassword1' } });
  server.close();
  restore();

  assert.equal(res.status, 200);
  assert.equal(res.json.message, 'Password reset successful');
});

test('auth router google endpoint returns google tokens', async () => {
  const restore = createStub(authService, 'googleOAuth', async ({ idToken }) => {
    assert.equal(idToken, 'google-id-token');
    return { user: { id: 'u3' }, tokens: { accessToken: 'ga', refreshToken: 'gr' } };
  });

  const { server, port } = await startServer();
  const res = await jsonRequest({ port, path: '/api/v1/auth/google', body: { idToken: 'google-id-token' } });
  server.close();
  restore();

  assert.equal(res.status, 200);
  assert.equal(res.json.message, 'Logged in with Google');
  assert.equal(res.json.data.tokens.accessToken, 'ga');
});
