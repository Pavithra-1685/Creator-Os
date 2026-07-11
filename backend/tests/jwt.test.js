const test = require('node:test');
const assert = require('node:assert/strict');
const jwtUtils = require('../src/utils/jwt');

test('jwt utility generates and verifies access token payload', async () => {
  const tokens = jwtUtils.generateAuthTokens({ userId: 'user-123' });
  assert.equal(typeof tokens.accessToken, 'string');
  assert.equal(typeof tokens.refreshToken, 'string');
  const payload = await jwtUtils.verifyAccessToken(tokens.accessToken);
  assert.equal(payload.userId, 'user-123');
});

test('jwt utility verifies refresh token payload and rejects invalid token', async () => {
  const tokens = jwtUtils.generateAuthTokens({ userId: 'user-999' });
  const payload = await jwtUtils.verifyRefreshToken(tokens.refreshToken);
  assert.equal(payload.userId, 'user-999');
  await assert.rejects(
    () => jwtUtils.verifyRefreshToken('invalid-token'),
    /jwt malformed|invalid token/i,
  );
});
