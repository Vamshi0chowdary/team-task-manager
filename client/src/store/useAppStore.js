import { create } from 'zustand';

const useAppStore = create((set) => ({
  currentUser: null,
  projects: [],
  tasks: [],
  dashboardData: null,
  setUser: (user) => set({ currentUser: user }),
  setProjects: (projects) => set({ projects }),
  setTasks: (tasks) => set({ tasks }),
  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects.filter((item) => item.id !== project.id)],
    })),
  removeProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
    })),
  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks.filter((item) => item.id !== task.id)],
    })),
  updateTask: (taskId, updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? updatedTask : task)),
    })),
  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),
  setDashboardData: (dataOrUpdater) =>
    set((state) => ({
      dashboardData:
        typeof dataOrUpdater === 'function' ? dataOrUpdater(state.dashboardData) : dataOrUpdater,
    })),
}));

export default useAppStore;