const prisma = require('../prisma/client');

const createToken = async ({ token, type, userId, expiresAt }) => {
  return prisma.verificationToken.create({ data: { token, type, userId, expiresAt } });
};

const findByTokenAndType = async ({ token, type }) => {
  return prisma.verificationToken.findFirst({
    where: {
      token,
      type,
      expiresAt: { gte: new Date() },
    },
  });
};

const deleteToken = async (id) => {
  return prisma.verificationToken.deleteMany({ where: { id } });
};

const deleteByUserAndType = async ({ userId, type }) => {
  return prisma.verificationToken.deleteMany({ where: { userId, type } });
};

module.exports = { createToken, findByTokenAndType, deleteToken, deleteByUserAndType };
