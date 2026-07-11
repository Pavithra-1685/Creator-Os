const jwt = require('jsonwebtoken');

const accessSecret = process.env.JWT_ACCESS_TOKEN_SECRET || 'access_secret';
const refreshSecret = process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret';
const accessExpiry = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

const generateAuthTokens = ({ userId }) => {
  const accessToken = jwt.sign({ userId }, accessSecret, { expiresIn: accessExpiry });
  const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: refreshExpiry });
  const refreshExpiresAt = new Date(Date.now() + msToMs(refreshExpiry));
  return { accessToken, refreshToken, refreshExpiresAt };
};

const verifyAccessToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, accessSecret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

const verifyRefreshToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, refreshSecret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

function msToMs(exp) {
  // expect formats like '15m' or '7d'
  const num = parseInt(exp.slice(0, -1), 10);
  const unit = exp.slice(-1);
  switch (unit) {
    case 'm':
      return num * 60 * 1000;
    case 'h':
      return num * 60 * 60 * 1000;
    case 'd':
      return num * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

module.exports = { generateAuthTokens, verifyAccessToken, verifyRefreshToken };
