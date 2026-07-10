const test = require('node:test');
const assert = require('node:assert/strict');
const { makeRes } = require('./testUtils');
const { requireAuth } = require('../src/middleware/authMiddleware');
const { errorHandler } = require('../src/middleware/errorHandler');
const jwtUtils = require('../src/utils/jwt');

test('auth middleware attaches user to request for valid token', async () => {
  const token = jwtUtils.generateAuthTokens({ userId: 'user-123' }).accessToken;
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = makeRes();
  let nextCalled = false;

  await requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { id: 'user-123' });
});

test('auth middleware rejects missing authorization header', async () => {
  const req = { headers: {} };
  const res = makeRes();
  let nextCalled = false;

  await requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Unauthorized');
});

test('error handler sends JSON response from error object', () => {
  const err = { status: 422, message: 'Invalid data', errors: ['invalid email'] };
  const req = {};
  const res = makeRes();

  errorHandler(err, req, res, () => {});

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Invalid data');
  assert.deepEqual(res.body.errors, ['invalid email']);
});
