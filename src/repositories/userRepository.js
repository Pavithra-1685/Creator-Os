const prisma = require('../prisma/client');

const createUser = async (data) => {
  return prisma.user.create({ data });
};

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

const findUserById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};

const saveRefreshToken = async ({ token, userId, expiresAt }) => {
  return prisma.refreshToken.create({ data: { token, userId, expiresAt } });
};

const revokeRefreshToken = async (token) => {
  return prisma.refreshToken.deleteMany({ where: { token } });
};

const findRefreshToken = async (token) => {
  return prisma.refreshToken.findFirst({
    where: {
      token,
      expiresAt: { gte: new Date() },
    },
  });
};

const revokeAllRefreshTokensForUser = async (userId) => {
  return prisma.refreshToken.deleteMany({ where: { userId } });
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
};
