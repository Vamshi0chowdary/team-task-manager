const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const priorityRank = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const buildTaskActivityItem = (task) => {
  const isCompleted = task.status === 'DONE' && new Date(task.updatedAt).getTime() > new Date(task.createdAt).getTime();

  if (isCompleted) {
    return {
      type: 'TASK_COMPLETED',
      message: `${task.assignedTo?.name || task.createdBy?.name || 'A member'} marked ${task.title} as Done`,
      projectName: task.project.title,
      createdAt: task.updatedAt,
    };
  }

  return {
    type: 'TASK_CREATED',
    message: `${task.createdBy?.name || 'You'} created ${task.title} in ${task.project.title}`,
    projectName: task.project.title,
    createdAt: task.createdAt,
  };
};

const buildRecentActivity = ({ tasks, members, projects, currentUserId }) => {
  const activity = [];

  tasks.forEach((task) => {
    activity.push(buildTaskActivityItem(task));
  });

  members.forEach((membership) => {
    const actorPrefix = membership.addedByCurrentUser ? 'You added' : `${membership.addedByName || 'A member'} added`;
    activity.push({
      type: 'MEMBER_ADDED',
      message: `${actorPrefix} ${membership.user.name} to ${membership.project.title}`,
      projectName: membership.project.title,
      createdAt: membership.createdAt,
    });
  });

  projects.forEach((project) => {
    const actorPrefix = project.createdById === currentUserId ? 'You created project' : `${project.createdBy.name} created project`;
    activity.push({
      type: 'PROJECT_CREATED',
      message: `${actorPrefix} ${project.title}`,
      projectName: project.title,
      createdAt: project.createdAt,
    });
  });

  return activity
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
};

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
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          completionRate: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          addedThisWeek: 0,
        },
        byStatus: [
          { status: 'TODO', count: 0 },
          { status: 'IN_PROGRESS', count: 0 },
          { status: 'DONE', count: 0 },
        ],
        tasksByProject: [],
        dueSoon: [],
        myTasks: [],
        recentActivity: [],
      });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAhead = new Date(now);
    sevenDaysAhead.setDate(now.getDate() + 7);

    const [
      totalTasks,
      byStatusRaw,
      completedTasks,
      inProgressTasks,
      overdueTasksCount,
      addedThisWeek,
      tasksByProjectRaw,
      dueSoonRaw,
      myTasksRaw,
      taskActivityRaw,
      memberActivityRaw,
      projectActivityRaw,
    ] = await Promise.all([
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
        },
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: {
          projectId: { in: projectIds },
        },
        _count: {
          status: true,
        },
      }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          status: 'DONE',
        },
      }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          status: 'IN_PROGRESS',
        },
      }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          dueDate: { lt: now },
          status: { not: 'DONE' },
        },
      }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.project.findMany({
        where: {
          id: { in: projectIds },
        },
        select: {
          id: true,
          title: true,
          tasks: {
            include: {
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
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          title: 'asc',
        },
      }),
      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          dueDate: {
            gte: now,
            lte: sevenDaysAhead,
          },
          status: {
            not: 'DONE',
          },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      }),
      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          assignedToId: req.user.id,
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: {
              title: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 24,
      }),
      prisma.projectMember.findMany({
        where: {
          projectId: { in: projectIds },
          userId: { not: req.user.id },
        },
        select: {
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          project: {
            select: {
              title: true,
            },
          },
          projectId: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      }),
      prisma.project.findMany({
        where: {
          id: { in: projectIds },
        },
        select: {
          title: true,
          createdAt: true,
          createdById: true,
          createdBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      }),
    ]);

    const statusLookup = new Map(byStatusRaw.map((item) => [item.status, item._count.status]));
    const byStatus = [
      { status: 'TODO', count: statusLookup.get('TODO') || 0 },
      { status: 'IN_PROGRESS', count: statusLookup.get('IN_PROGRESS') || 0 },
      { status: 'DONE', count: statusLookup.get('DONE') || 0 },
    ];

    const tasksByProject = tasksByProjectRaw.map((project) => ({
      projectId: project.id,
      title: project.title,
      tasks: project.tasks,
    }));

    const dueSoon = dueSoonRaw.map((task) => ({
      id: task.id,
      title: task.title,
      projectName: task.project.title,
      dueDate: task.dueDate,
      projectId: task.project.id,
    }));

    const myTasks = myTasksRaw
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        projectName: task.project.title,
        projectId: task.project.id,
      }))
      .sort((left, right) => {
        const leftOverdue = left.dueDate && new Date(left.dueDate) < now && left.status !== 'DONE' ? 0 : 1;
        const rightOverdue = right.dueDate && new Date(right.dueDate) < now && right.status !== 'DONE' ? 0 : 1;

        if (leftOverdue !== rightOverdue) {
          return leftOverdue - rightOverdue;
        }

        const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

        if (leftDue !== rightDue) {
          return leftDue - rightDue;
        }

        return (priorityRank[left.priority] || 99) - (priorityRank[right.priority] || 99);
      });

    const memberActivityWithActor = memberActivityRaw.map((item) => ({
      ...item,
      addedByCurrentUser: true,
      addedByName: 'You',
    }));

    const recentActivity = buildRecentActivity({
      tasks: taskActivityRaw,
      members: memberActivityWithActor,
      projects: projectActivityRaw,
      currentUserId: req.user.id,
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return res.status(200).json({
      stats: {
        totalTasks,
        completedTasks,
        completionRate,
        inProgressTasks,
        overdueTasks: overdueTasksCount,
        addedThisWeek,
      },
      byStatus,
      tasksByProject,
      dueSoon,
      myTasks,
      recentActivity,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard.' });
  }
};

const getDashboardActivity = async (req, res) => {
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
      return res.status(200).json([]);
    }

    const activities = await prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            title: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 8,
    });

    return res.status(200).json(
      activities.map((task) => {
        const isCompleted = task.status === 'DONE' && new Date(task.updatedAt).getTime() > new Date(task.createdAt).getTime();

        if (isCompleted) {
          return {
            type: 'TASK_COMPLETED',
            message: `${task.createdBy?.name || 'A member'} marked ${task.title} as Done`,
            projectName: task.project.title,
            createdAt: task.updatedAt,
          };
        }

        return {
          type: 'TASK_CREATED',
          message: `${task.createdBy?.name || 'A member'} created ${task.title} in ${task.project.title}`,
          projectName: task.project.title,
          createdAt: task.createdAt,
        };
      })
    );
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard activity.' });
  }
};

module.exports = {
  getDashboard,
  getDashboardActivity,
};
