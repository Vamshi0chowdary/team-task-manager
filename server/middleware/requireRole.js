const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const requireRole = (requiredRoles) => {
  const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return async (req, res, next) => {
    const projectId = Number(req.params.id || req.params.projectId);

    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: 'Invalid project id.' });
    }

    try {
      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
      });

      if (!membership) {
        return res.status(403).json({ message: 'You are not a member of this project' });
      }

      if (allowedRoles.includes('MEMBER')) {
        req.projectMembership = membership;
        return next();
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({ message: 'You must be an ADMIN to do this' });
      }

      req.projectMembership = membership;
      return next();
    } catch (error) {
      return res.status(500).json({ message: 'Failed to verify project role.' });
    }
  };
};

module.exports = requireRole;