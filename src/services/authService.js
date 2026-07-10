const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const userRepo = require('../repositories/userRepository');
const jwt = require('../utils/jwt');
const prisma = require('../prisma/client');
const tokenRepo = require('../repositories/tokenRepository');
const mailer = require('../utils/mailer');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const SALT_ROUNDS = 10;

const register = async ({ email, password, name, role }) => {
  const existing = await userRepo.findUserByEmail(email);
  if (existing) throw { status: 400, message: 'Email already in use' };
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const isEmailVerified = process.env.NODE_ENV !== 'production';
  const user = await userRepo.createUser({ email, password: hashed, name, role, isEmailVerified });
  const tokens = await jwt.generateAuthTokens({ userId: user.id });
  await userRepo.saveRefreshToken({ token: tokens.refreshToken, userId: user.id, expiresAt: tokens.refreshExpiresAt });
  if (!isEmailVerified) {
    await sendVerificationEmail({ user });
  }
  return { user, tokens };
};

const login = async ({ email, password }) => {
  const user = await userRepo.findUserByEmail(email);
  if (!user) throw { status: 400, message: 'Invalid credentials' };
  if (!user.isEmailVerified) throw { status: 403, message: 'Email not verified' };
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw { status: 400, message: 'Invalid credentials' };
  const tokens = await jwt.generateAuthTokens({ userId: user.id });
  await userRepo.saveRefreshToken({ token: tokens.refreshToken, userId: user.id, expiresAt: tokens.refreshExpiresAt });
  return { user, tokens };
};

const logout = async ({ refreshToken }) => {
  await userRepo.revokeRefreshToken(refreshToken);
  return true;
};

const refresh = async ({ refreshToken }) => {
  const payload = await jwt.verifyRefreshToken(refreshToken);
  const tokenRecord = await userRepo.findRefreshToken(refreshToken);
  if (!tokenRecord || tokenRecord.userId !== payload.userId) {
    throw { status: 400, message: 'Invalid or expired refresh token' };
  }
  const tokens = await jwt.generateAuthTokens({ userId: payload.userId });
  await userRepo.saveRefreshToken({ token: tokens.refreshToken, userId: payload.userId, expiresAt: tokens.refreshExpiresAt });
  await userRepo.revokeRefreshToken(refreshToken);
  return tokens;
};

// Email verification
const sendVerificationEmail = async ({ user }) => {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await tokenRepo.createToken({ token, type: 'EMAIL_VERIFICATION', userId: user.id, expiresAt });
  const url = `${process.env.APP_URL || 'http://localhost:4000'}/api/v1/auth/verify-email?token=${token}`;
  await mailer.sendMail({ to: user.email, subject: 'Verify your email', html: `<p>Please verify email by clicking <a href="${url}">here</a></p>` });
  return true;
};

const verifyEmail = async ({ token }) => {
  const rec = await tokenRepo.findByTokenAndType({ token, type: 'EMAIL_VERIFICATION' });
  if (!rec) throw { status: 400, message: 'Invalid or expired token' };
  const user = await userRepo.findUserById(rec.userId);
  if (!user) throw { status: 404, message: 'User not found' };
  await prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: true } });
  await tokenRepo.deleteByUserAndType({ userId: user.id, type: 'EMAIL_VERIFICATION' });
  return true;
};

// Password reset
const requestPasswordReset = async ({ email }) => {
  const user = await userRepo.findUserByEmail(email);
  if (!user) return true; // don't reveal existence
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await tokenRepo.deleteByUserAndType({ userId: user.id, type: 'PASSWORD_RESET' });
  await tokenRepo.createToken({ token, type: 'PASSWORD_RESET', userId: user.id, expiresAt });
  const url = `${process.env.APP_URL || 'http://localhost:4000'}/reset-password?token=${token}`;
  await mailer.sendMail({ to: user.email, subject: 'Password reset', html: `<p>Reset your password <a href="${url}">here</a></p>` });
  return true;
};

const resetPassword = async ({ token, newPassword }) => {
  const rec = await tokenRepo.findByTokenAndType({ token, type: 'PASSWORD_RESET' });
  if (!rec) throw { status: 400, message: 'Invalid or expired token' };
  const user = await userRepo.findUserById(rec.userId);
  if (!user) throw { status: 404, message: 'User not found' };
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  await userRepo.revokeAllRefreshTokensForUser(user.id);
  await tokenRepo.deleteByUserAndType({ userId: user.id, type: 'PASSWORD_RESET' });
  return true;
};

// Google OAuth
const googleOAuth = async ({ idToken }) => {
  if (!GOOGLE_CLIENT_ID) throw { status: 500, message: 'Google client not configured' };
  const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  const email = payload.email;
  let user = await userRepo.findUserByEmail(email);
  if (!user) {
    user = await userRepo.createUser({ email, name: payload.name || '', password: uuidv4(), isEmailVerified: true });
  }
  const tokens = await jwt.generateAuthTokens({ userId: user.id });
  await userRepo.saveRefreshToken({ token: tokens.refreshToken, userId: user.id, expiresAt: tokens.refreshExpiresAt });
  return { user, tokens };
};

const getProfile = async (userId) => {
  const user = await userRepo.findUserById(userId);
  if (!user) throw { status: 404, message: 'User not found' };
  return user;
};

const updateProfile = async (userId, data) => {
  const user = await userRepo.findUserById(userId);
  if (!user) throw { status: 404, message: 'User not found' };
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name ?? user.name,
      profileImage: data.profileImage ?? user.profileImage,
    },
  });
  return updated;
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  googleOAuth,
  sendVerificationEmail,
  getProfile,
  updateProfile,
};
