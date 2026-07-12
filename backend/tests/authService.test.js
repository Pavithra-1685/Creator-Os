const test = require('node:test');
const assert = require('node:assert/strict');
const authService = require('../src/services/authService');

test('auth service exposes email verification and password reset flows', () => {
  assert.equal(typeof authService., 'function');
  assert.equal(typeof authService.requestPasswordReset, 'function');
  assert.equal(typeof authService.resetPassword, 'function');
  assert.equal(typeof authService.googleOAuth, 'function');
});
