const prisma = require('../prisma/client');

/**
 * Resolves the primary workspace owner's user ID.
 * If the user is a team member (e.g. editor, designer, manager), returns the team owner's ID.
 * Otherwise, returns the user's own ID.
 */
const getTargetUserId = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return userId;
  
  if (user.role !== 'CREATOR' && user.role !== 'ADMIN') {
    const memberTeam = await prisma.teamMember.findFirst({
      where: { userId },
      include: { team: true }
    });
    if (memberTeam && memberTeam.team) {
      return memberTeam.team.ownerId;
    }
  }
  return userId;
};

module.exports = { getTargetUserId };
