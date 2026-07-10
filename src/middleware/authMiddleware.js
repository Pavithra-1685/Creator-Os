const jwt = require('../utils/jwt');

const requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ success: false, message: 'Unauthorized', errors: [] });
    const token = auth.split(' ')[1];
    const payload = await jwt.verifyAccessToken(token);
    req.user = { id: payload.userId };
    next();
  } catch (err) {
    next({ status: 401, message: 'Invalid or expired token' });
  }
};

module.exports = { requireAuth };
