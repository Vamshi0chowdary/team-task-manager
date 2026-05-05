const express = require('express');
const requireRole = require('../middleware/requireRole');
const {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');

const router = express.Router({ mergeParams: true });

router.use('/:projectId/tasks', requireRole('MEMBER'));
router.post('/:projectId/tasks', createTask);
router.get('/:projectId/tasks', listTasks);
router.get('/:projectId/tasks/:taskId', getTaskById);
router.patch('/:projectId/tasks/:taskId', updateTask);
router.delete('/:projectId/tasks/:taskId', deleteTask);

module.exports = router;
