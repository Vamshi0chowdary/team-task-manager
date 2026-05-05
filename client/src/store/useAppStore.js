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
  setDashboardData: (data) => set({ dashboardData: data }),
}));

export default useAppStore;