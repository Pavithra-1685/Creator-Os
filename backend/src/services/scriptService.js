const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ──── SCRIPTS ────

const getScripts = async (userId, { page = 1, limit = 20, status, search }) => {
  const skip = (page - 1) * limit;
  const where = {
    authorId: userId,
    ...(status && { status }),
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
  };
  const [items, total] = await Promise.all([
    prisma.script.findMany({
      where, skip, take: limit, orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { versions: true, contentItems: true } } },
    }),
    prisma.script.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
};

const getScriptById = async (id, userId) => {
  return prisma.script.findFirst({
    where: { id, authorId: userId },
    include: { versions: { orderBy: { version: 'desc' }, take: 10 }, contentItems: { select: { id: true, title: true } } },
  });
};

const createScript = async (userId, data) => {
  const script = await prisma.script.create({ data: { ...data, authorId: userId } });
  const { triggerRealtimeNotification } = require('../utils/realtime');
  await triggerRealtimeNotification(
    userId,
    'Script Draft Created',
    `Created draft script: "${script.title}"`,
    'EDITING_DEADLINE'
  );
  return script;
};

const updateScript = async (id, userId, data) => {
  // Save old version before updating
  const existing = await prisma.script.findFirst({ where: { id, authorId: userId } });
  if (!existing) throw Object.assign(new Error('Script not found'), { status: 404 });

  let savedVersion = false;
  if (data.content && data.content !== existing.content) {
    await prisma.scriptVersion.create({
      data: { scriptId: id, content: existing.content, version: existing.version },
    });
    data.version = existing.version + 1;
    savedVersion = true;
  }

  const updated = await prisma.script.update({ where: { id }, data });

  const { triggerRealtimeNotification } = require('../utils/realtime');
  if (savedVersion) {
    await triggerRealtimeNotification(
      userId,
      'Script Updated',
      `Saved version ${updated.version} of "${updated.title}"`,
      'EDITING_DEADLINE'
    );
  }

  return updated;
};

const deleteScript = async (id, userId) => {
  return prisma.script.deleteMany({ where: { id, authorId: userId } });
};

const restoreVersion = async (scriptId, userId, versionId) => {
  const [script, version] = await Promise.all([
    prisma.script.findFirst({ where: { id: scriptId, authorId: userId } }),
    prisma.scriptVersion.findFirst({ where: { id: versionId, scriptId } }),
  ]);
  if (!script || !version) throw Object.assign(new Error('Not found'), { status: 404 });

  // Save current as version first
  await prisma.scriptVersion.create({
    data: { scriptId, content: script.content, version: script.version },
  });

  return prisma.script.update({
    where: { id: scriptId },
    data: { content: version.content, version: script.version + 1 },
  });
};

module.exports = { getScripts, getScriptById, createScript, updateScript, deleteScript, restoreVersion };
