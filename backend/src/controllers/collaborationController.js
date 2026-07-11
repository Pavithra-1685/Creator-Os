const collab = require('../services/collaborationService');
const scriptService = require('../services/scriptService');

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); } catch (err) { next(err); }
};

// ──── NOTIFICATIONS ────
const getNotifications = wrap(async (req, res) => {
  const data = await collab.getNotifications(req.user.id, req.query);
  res.json({ success: true, message: 'Notifications fetched', data });
});

const markAsRead = wrap(async (req, res) => {
  await collab.markAsRead(req.params.id, req.user.id);
  res.json({ success: true, message: 'Marked as read', data: {} });
});

const markAllAsRead = wrap(async (req, res) => {
  await collab.markAllAsRead(req.user.id);
  res.json({ success: true, message: 'All marked as read', data: {} });
});

const deleteNotification = wrap(async (req, res) => {
  await collab.deleteNotification(req.params.id, req.user.id);
  res.json({ success: true, message: 'Notification deleted', data: {} });
});

const clearNotifications = wrap(async (req, res) => {
  await collab.clearAllNotifications(req.user.id);
  res.json({ success: true, message: 'All notifications cleared', data: {} });
});

// ──── TASKS ────
const getTasks = wrap(async (req, res) => {
  const data = await collab.getTasks(req.user.id, req.query);
  res.json({ success: true, message: 'Tasks fetched', data });
});

const createTask = wrap(async (req, res) => {
  const task = await collab.createTask(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Task created', data: { task } });
});

const updateTask = wrap(async (req, res) => {
  await collab.updateTask(req.params.id, req.user.id, req.body);
  res.json({ success: true, message: 'Task updated', data: {} });
});

const deleteTask = wrap(async (req, res) => {
  await collab.deleteTask(req.params.id, req.user.id);
  res.json({ success: true, message: 'Task deleted', data: {} });
});

const addComment = wrap(async (req, res) => {
  const comment = await collab.addComment(req.params.id, req.user.id, req.body.content);
  res.status(201).json({ success: true, message: 'Comment added', data: { comment } });
});

// ──── TEAMS ────
const getTeams = wrap(async (req, res) => {
  const teams = await collab.getTeams(req.user.id);
  res.json({ success: true, message: 'Teams fetched', data: { teams } });
});

const createTeam = wrap(async (req, res) => {
  const team = await collab.createTeam(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Team created', data: { team } });
});

const inviteMember = wrap(async (req, res) => {
  const member = await collab.inviteToTeam(req.params.id, req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Member invited', data: { member } });
});

const removeMember = wrap(async (req, res) => {
  await collab.removeMember(req.params.id, req.user.id, req.params.memberId);
  res.json({ success: true, message: 'Member removed', data: {} });
});

// ──── SCRIPTS ────
const getScripts = wrap(async (req, res) => {
  const data = await scriptService.getScripts(req.user.id, req.query);
  res.json({ success: true, message: 'Scripts fetched', data });
});

const getScript = wrap(async (req, res) => {
  const script = await scriptService.getScriptById(req.params.id, req.user.id);
  if (!script) return res.status(404).json({ success: false, message: 'Script not found', data: {} });
  res.json({ success: true, message: 'Script fetched', data: { script } });
});

const createScript = wrap(async (req, res) => {
  const script = await scriptService.createScript(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Script created', data: { script } });
});

const updateScript = wrap(async (req, res) => {
  const script = await scriptService.updateScript(req.params.id, req.user.id, req.body);
  res.json({ success: true, message: 'Script updated', data: { script } });
});

const deleteScript = wrap(async (req, res) => {
  await scriptService.deleteScript(req.params.id, req.user.id);
  res.json({ success: true, message: 'Script deleted', data: {} });
});

const restoreVersion = wrap(async (req, res) => {
  const script = await scriptService.restoreVersion(req.params.id, req.user.id, req.params.versionId);
  res.json({ success: true, message: 'Version restored', data: { script } });
});

module.exports = {
  getNotifications, markAsRead, markAllAsRead, deleteNotification, clearNotifications,
  getTasks, createTask, updateTask, deleteTask, addComment,
  getTeams, createTeam, inviteMember, removeMember,
  getScripts, getScript, createScript, updateScript, deleteScript, restoreVersion,
};
