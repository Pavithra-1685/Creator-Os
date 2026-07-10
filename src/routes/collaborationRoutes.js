const router = require('express').Router();
const c = require('../controllers/collaborationController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

// Notifications
router.get('/notifications', c.getNotifications);
router.patch('/notifications/read-all', c.markAllAsRead);
router.patch('/notifications/:id/read', c.markAsRead);
router.delete('/notifications/:id', c.deleteNotification);

// Tasks
router.get('/tasks', c.getTasks);
router.post('/tasks', c.createTask);
router.patch('/tasks/:id', c.updateTask);
router.delete('/tasks/:id', c.deleteTask);
router.post('/tasks/:id/comments', c.addComment);

// Teams
router.get('/teams', c.getTeams);
router.post('/teams', c.createTeam);
router.post('/teams/:id/invite', c.inviteMember);
router.delete('/teams/:id/members/:memberId', c.removeMember);

// Scripts
router.get('/scripts', c.getScripts);
router.post('/scripts', c.createScript);
router.get('/scripts/:id', c.getScript);
router.patch('/scripts/:id', c.updateScript);
router.delete('/scripts/:id', c.deleteScript);
router.post('/scripts/:id/restore/:versionId', c.restoreVersion);

module.exports = router;
