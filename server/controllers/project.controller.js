const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const createProject = async (req, res) => {
  const title = req.body.title?.trim();
  const description = req.body.description?.trim();

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  try {
    const project = await prisma.$transaction(async (transaction) => {
      const createdProject = await transaction.project.create({
        data: {
          title: title.trim(),
          description: description || null,
          createdById: req.user.id,
        },
      });

      await transaction.projectMember.create({
        data: {
          projectId: createdProject.id,
          userId: req.user.id,
          role: 'ADMIN',
        },
      });

      return createdProject;
    });

    return res.status(201).json({
      id: project.id,
      title: project.title,
      description: project.description,
      createdAt: project.createdAt,
      createdById: project.createdById,
      role: 'ADMIN',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create project.' });
  }
};

const listProjects = async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        project: true,
      },
      orderBy: {
        project: {
          createdAt: 'desc',
        },
      },
    });

    return res.status(200).json(
      memberships.map((membership) => ({
        id: membership.project.id,
        title: membership.project.title,
        description: membership.project.description,
        createdAt: membership.project.createdAt,
        createdById: membership.project.createdById,
        role: membership.role,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch projects.' });
  }
};

const addProjectMember = async (req, res) => {
  const projectId = Number(req.params.id);
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  if (Number.isNaN(projectId)) {
    return res.status(400).json({ message: 'Invalid project id.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      return res.status(409).json({ message: 'User is already a member of this project.' });
    }

    const membership = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json(membership);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add member.' });
  }
};

const removeProjectMember = async (req, res) => {
  const projectId = Number(req.params.id);
  const userId = Number(req.params.userId);

  if (Number.isNaN(projectId) || Number.isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid project or user id.' });
  }

  if (userId === req.user.id) {
    return res.status(400).json({ message: 'You cannot remove yourself from the project.' });
  }

  try {
    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return res.status(200).json({ message: 'Member removed' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Member not found.' });
    }

    return res.status(500).json({ message: 'Failed to remove member.' });
  }
};

const getProjectMembers = async (req, res) => {
  const projectId = Number(req.params.id);

  if (Number.isNaN(projectId)) {
    return res.status(400).json({ message: 'Invalid project id.' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const memberships = await prisma.projectMember.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    return res.status(200).json({
      project,
      members: memberships.map((membership) => ({
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        role: membership.role,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch project members.' });
  }
};

module.exports = {
  createProject,
  listProjects,
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
};