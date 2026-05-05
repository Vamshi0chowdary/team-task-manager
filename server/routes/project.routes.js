const express = require('express');
const requireRole = require('../middleware/requireRole');
const {
  createProject,
  listProjects,
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
} = require('../controllers/project.controller');

const router = express.Router();

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id/members', requireRole(['ADMIN', 'MEMBER']), getProjectMembers);
router.post('/:id/members', requireRole('ADMIN'), addProjectMember);
router.delete('/:id/members/:userId', requireRole('ADMIN'), removeProjectMember);

module.exports = router;