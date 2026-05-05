const express = require('express');
const requireRole = require('../middleware/requireRole');
const {
  createProject,
  listProjects,
  getProjectById,
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  deleteProject,
} = require('../controllers/project.controller');

const router = express.Router();

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', requireRole(['ADMIN', 'MEMBER']), getProjectById);
router.get('/:id/members', requireRole(['ADMIN', 'MEMBER']), getProjectMembers);
router.post('/:id/members', requireRole('ADMIN'), addProjectMember);
router.delete('/:id/members/:userId', requireRole('ADMIN'), removeProjectMember);
router.delete('/:id', requireRole('ADMIN'), deleteProject);

module.exports = router;