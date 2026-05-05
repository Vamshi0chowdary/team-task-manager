const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const buildTaskInclude = {
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
};

const getProjectMembership = async (projectId, userId) => {
  return prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
};

const getProject = async (projectId) => {
  return prisma.project.findUnique({
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
};

const ensureProjectMembership = async (projectId, userId) => {
  const membership = await getProjectMembership(projectId, userId);
  return membership;
};

const createTask = async (req, res) => {
  const projectId = Number(req.params.projectId);
  const title = req.body.title?.trim();
  const description = req.body.description?.trim();
  const dueDate = req.body.dueDate;
  const priority = req.body.priority;
  const assignedToId = req.body.assignedToId;

  if (Number.isNaN(projectId)) {
    return res.status(400).json({ message: 'Invalid project id.' });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  try {
    const project = await getProject(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const membership = await getProjectMembership(projectId, req.user.id);

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ message: 'You must be an ADMIN to do this' });
    }

    let assigneeId = null;

    if (assignedToId !== undefined && assignedToId !== null && assignedToId !== '') {
      const parsedAssigneeId = Number(assignedToId);

      if (Number.isNaN(parsedAssigneeId)) {
        return res.status(400).json({ message: 'Assigned user is not a member of this project' });
      }

      const assigneeMembership = await getProjectMembership(projectId, parsedAssigneeId);

      if (!assigneeMembership) {
        return res.status(400).json({ message: 'Assigned user is not a member of this project' });
      }

      assigneeId = parsedAssigneeId;
    }

    if (dueDate) {
      const parsedDueDate = new Date(dueDate);

      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ message: 'Invalid due date.' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority) ? priority : 'MEDIUM',
        projectId,
        assignedToId: assigneeId,
        createdById: req.user.id,
      },
      include: buildTaskInclude,
    });

    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create task.' });
  }
};

const listTasks = async (req, res) => {
  const projectId = Number(req.params.projectId);

  if (Number.isNaN(projectId)) {
    return res.status(400).json({ message: 'Invalid project id.' });
  }

  try {
    const project = await getProject(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
      },
      include: buildTaskInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch tasks.' });
  }
};

const getTaskById = async (req, res) => {
  const projectId = Number(req.params.projectId);
  const taskId = Number(req.params.taskId);

  if (Number.isNaN(projectId) || Number.isNaN(taskId)) {
    return res.status(400).json({ message: 'Invalid project or task id.' });
  }

  try {
    const project = await getProject(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const membership = await getProjectMembership(projectId, req.user.id);

    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      include: buildTaskInclude,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch task.' });
  }
};

const updateTask = async (req, res) => {
  const projectId = Number(req.params.projectId);
  const taskId = Number(req.params.taskId);

  if (Number.isNaN(projectId) || Number.isNaN(taskId)) {
    return res.status(400).json({ message: 'Invalid project or task id.' });
  }

  try {
    const project = await getProject(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const membership = await getProjectMembership(projectId, req.user.id);

    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (membership.role === 'ADMIN') {
      const updates = {};

      if (req.body.title !== undefined) {
        const nextTitle = req.body.title?.trim();

        if (!nextTitle) {
          return res.status(400).json({ message: 'Title is required.' });
        }
        updates.title = nextTitle;
      }

      if (req.body.description !== undefined) {
        const nextDescription = req.body.description?.trim();
        updates.description = nextDescription || null;
      }

      if (req.body.dueDate !== undefined) {
        if (req.body.dueDate) {
          const parsedDueDate = new Date(req.body.dueDate);

          if (Number.isNaN(parsedDueDate.getTime())) {
            return res.status(400).json({ message: 'Invalid due date.' });
          }

          updates.dueDate = parsedDueDate;
        } else {
          updates.dueDate = null;
        }
      }

      if (req.body.priority !== undefined) {
        if (!['LOW', 'MEDIUM', 'HIGH'].includes(req.body.priority)) {
          return res.status(400).json({ message: 'Invalid priority.' });
        }
        updates.priority = req.body.priority;
      }

      if (req.body.status !== undefined) {
        if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(req.body.status)) {
          return res.status(400).json({ message: 'Invalid status.' });
        }
        updates.status = req.body.status;
      }

      if (req.body.assignedToId !== undefined) {
        if (req.body.assignedToId === null || req.body.assignedToId === '') {
          updates.assignedToId = null;
        } else {
          const parsedAssigneeId = Number(req.body.assignedToId);

          if (Number.isNaN(parsedAssigneeId)) {
            return res.status(400).json({ message: 'Assigned user is not a member of this project' });
          }

          const assigneeMembership = await getProjectMembership(projectId, parsedAssigneeId);

          if (!assigneeMembership) {
            return res.status(400).json({ message: 'Assigned user is not a member of this project' });
          }

          updates.assignedToId = parsedAssigneeId;
        }
      }

      const updatedTask = await prisma.task.update({
        where: {
          id: task.id,
        },
        data: updates,
        include: buildTaskInclude,
      });

      return res.status(200).json(updatedTask);
    }

    if (task.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'You can only update tasks assigned to you' });
    }

    if (req.body.status === undefined) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        status: req.body.status,
      },
      include: buildTaskInclude,
    });

    return res.status(200).json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update task.' });
  }
};

const deleteTask = async (req, res) => {
  const projectId = Number(req.params.projectId);
  const taskId = Number(req.params.taskId);

  if (Number.isNaN(projectId) || Number.isNaN(taskId)) {
    return res.status(400).json({ message: 'Invalid project or task id.' });
  }

  try {
    const membership = await getProjectMembership(projectId, req.user.id);

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ message: 'You must be an ADMIN to do this' });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await prisma.task.delete({
      where: {
        id: task.id,
      },
    });

    return res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete task.' });
  }
};

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
