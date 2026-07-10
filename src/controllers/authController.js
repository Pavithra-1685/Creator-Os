const authService = require('../services/authService');
const { registerSchema, loginSchema, refreshSchema, verifySchema, forgotSchema, resetSchema, googleSchema } = require('../validators/authValidator');

const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    next(err);
  }
};

const register = wrap(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const { user, tokens } = await authService.register(data);
  res.json({ success: true, message: 'Registered', data: { user, tokens } });
});

const login = wrap(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const { user, tokens } = await authService.login(data);
  res.json({ success: true, message: 'Logged in', data: { user, tokens } });
});

const logout = wrap(async (req, res) => {
  const data = refreshSchema.parse(req.body);
  await authService.logout(data);
  res.json({ success: true, message: 'Logged out', data: {} });
});

const getProfile = wrap(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json({ success: true, message: 'Profile fetched', data: { user } });
});

const updateProfile = wrap(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json({ success: true, message: 'Profile updated', data: { user } });
});

const refresh = wrap(async (req, res) => {
  const data = refreshSchema.parse(req.body);
  const tokens = await authService.refresh(data);
  res.json({ success: true, message: 'Token refreshed', data: { tokens } });
});

const verifyEmail = wrap(async (req, res) => {
  const data = verifySchema.parse(req.query);
  await authService.verifyEmail(data);
  res.json({ success: true, message: 'Email verified', data: {} });
});

const forgotPassword = wrap(async (req, res) => {
  const data = forgotSchema.parse(req.body);
  await authService.requestPasswordReset(data);
  res.json({ success: true, message: 'If the email exists, a reset link has been sent', data: {} });
});

const resetPassword = wrap(async (req, res) => {
  const data = resetSchema.parse(req.body);
  await authService.resetPassword(data);
  res.json({ success: true, message: 'Password reset successful', data: {} });
});

const googleLogin = wrap(async (req, res) => {
  const data = googleSchema.parse(req.body);
  const result = await authService.googleOAuth(data);
  res.json({ success: true, message: 'Logged in with Google', data: result });
});

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  refresh,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleLogin,
};
