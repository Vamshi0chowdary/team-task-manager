const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getDashboard = async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: {
        userId: req.user.id,
      },
      select: {
        projectId: true,
      },
    });

    const projectIds = memberships.map((membership) => membership.projectId);

    if (projectIds.length === 0) {
      return res.status(200).json({
        totalTasks: 0,
        byStatus: [],
        byAssignee: [],
        overdueTasks: [],
      });
    }

    const [totalTasks, byStatusRaw, byAssigneeRaw, overdueTasks] = await Promise.all([
      prisma.task.count({
        where: {
          projectId: {
            in: projectIds,
          },
        },
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: {
          projectId: {
            in: projectIds,
          },
        },
        _count: {
          status: true,
        },
      }),
      prisma.task.groupBy({
        by: ['assignedToId'],
        where: {
          projectId: {
            in: projectIds,
          },
          assignedToId: {
            not: null,
          },
        },
        _count: {
          assignedToId: true,
        },
      }),
      prisma.task.findMany({
        where: {
          projectId: {
            in: projectIds,
          },
          dueDate: {
            lt: new Date(),
          },
          status: {
            not: 'DONE',
          },
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      }),
    ]);

    const byStatus = byStatusRaw.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    const assignedUserIds = byAssigneeRaw.map((item) => item.assignedToId).filter((value) => value !== null);
    const users = assignedUserIds.length
      ? await prisma.user.findMany({
          where: {
            id: {
              in: assignedUserIds,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : [];

    const userLookup = new Map(users.map((user) => [user.id, user]));

    const byAssignee = byAssigneeRaw
      .map((item) => {
        const user = userLookup.get(item.assignedToId);

        if (!user) {
          return null;
        }

        return {
          user,
          count: item._count.assignedToId,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      totalTasks,
      byStatus,
      byAssignee,
      overdueTasks,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard.' });
  }
};

module.exports = {
  getDashboard,
};
