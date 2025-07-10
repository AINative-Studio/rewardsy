/**
 * Unit tests for useTasks hook
 * Tests task management functionality and API integration
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTasks } from '@/hooks/useTasks'
import { tasksAPI } from '@/lib/tasks'

// Mock the tasks API
jest.mock('@/lib/tasks')
const mockTasksAPI = tasksAPI as jest.Mocked<typeof tasksAPI>

// Sample task data
const mockTasks = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'First test task',
    priority: 'high' as const,
    completed: false,
    dueDate: '2024-12-31',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Second test task',
    priority: 'medium' as const,
    completed: true,
    dueDate: '2024-12-25',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
]

describe('useTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state and data fetching', () => {
    it('should have correct initial state', () => {
      mockTasksAPI.getTasks.mockResolvedValueOnce([])
      
      const { result } = renderHook(() => useTasks())
      
      expect(result.current.tasks).toEqual([])
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('should fetch tasks on mount', async () => {
      mockTasksAPI.getTasks.mockResolvedValueOnce(mockTasks)
      
      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.tasks).toEqual(mockTasks)
      expect(result.current.error).toBeNull()
      expect(mockTasksAPI.getTasks).toHaveBeenCalledTimes(1)
    })

    it('should handle fetch error', async () => {
      const errorMessage = 'Failed to fetch tasks'
      mockTasksAPI.getTasks.mockRejectedValueOnce(new Error(errorMessage))
      
      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.tasks).toEqual([])
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('createTask', () => {
    it('should create a new task successfully', async () => {
      const newTask = {
        id: '3',
        title: 'New Task',
        description: 'A new test task',
        priority: 'low' as const,
        completed: false,
        dueDate: '2024-12-20',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z'
      }

      mockTasksAPI.getTasks.mockResolvedValueOnce(mockTasks)
      mockTasksAPI.createTask.mockResolvedValueOnce(newTask)

      const { result } = renderHook(() => useTasks())
      
      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let createdTask: any
      await act(async () => {
        createdTask = await result.current.createTask({
          title: 'New Task',
          description: 'A new test task',
          priority: 'low',
          dueDate: '2024-12-20'
        })
      })

      expect(createdTask).toEqual(newTask)
      expect(result.current.tasks).toHaveLength(3)
      expect(result.current.tasks[2]).toEqual(newTask)
      expect(result.current.error).toBeNull()
    })

    it('should handle create task error', async () => {
      const errorMessage = 'Failed to create task'
      mockTasksAPI.getTasks.mockResolvedValueOnce(mockTasks)
      mockTasksAPI.createTask.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        try {
          await result.current.createTask({
            title: 'New Task',
            description: 'A new test task',
            priority: 'low'
          })
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.tasks).toHaveLength(2) // No new task added
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const updatedTask = { ...mockTasks[0], title: 'Updated Task', completed: true }
      
      mockTasksAPI.getTasks.mockResolvedValueOnce(mockTasks)
      mockTasksAPI.updateTask.mockResolvedValueOnce(updatedTask)

      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let resultTask: any
      await act(async () => {
        resultTask = await result.current.updateTask('1', { title: 'Updated Task', completed: true })
      })

      expect(resultTask).toEqual(updatedTask)
      expect(result.current.tasks[0]).toEqual(updatedTask)
      expect(result.current.error).toBeNull()
    })

    it('should handle update task error', async () => {
      const errorMessage = 'Failed to update task'
      mockTasksAPI.getTasks.mockResolvedValueOnce(mockTasks)
      mockTasksAPI.updateTask.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        try {
          await result.current.updateTask('1', { title: 'Updated Task' })
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.tasks[0].title).toBe('Test Task 1') // Not updated
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      mockTasksAPI.getTasks.mockResolvedValueOnce(mockTasks)
      mockTasksAPI.deleteTask.mockResolvedValueOnce()

      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deleteTask('1')
      })

      expect(result.current.tasks).toHaveLength(1)
      expect(result.current.tasks[0].id).toBe('2')
      expect(result.current.error).toBeNull()
    })

    it('should handle delete task error', async () => {
      const errorMessage = 'Failed to delete task'
      mockTasksAPI.getTasks.mockResolvedValueOnce(mockTasks)
      mockTasksAPI.deleteTask.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        try {
          await result.current.deleteTask('1')
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.tasks).toHaveLength(2) // Task not deleted
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('completeTask', () => {
    it('should complete a task successfully', async () => {
      const completedTask = { ...mockTasks[0], completed: true }
      
      mockTasksAPI.getTasks.mockResolvedValueOnce(mockTasks)
      mockTasksAPI.updateTask.mockResolvedValueOnce(completedTask)

      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let resultTask: any
      await act(async () => {
        resultTask = await result.current.completeTask('1', true)
      })

      expect(resultTask).toEqual(completedTask)
      expect(result.current.tasks[0].completed).toBe(true)
      expect(mockTasksAPI.updateTask).toHaveBeenCalledWith('1', { completed: true })
    })

    it('should uncomplete a task successfully', async () => {
      const uncompletedTask = { ...mockTasks[1], completed: false }
      
      mockTasksAPI.getTasks.mockResolvedValueOnce(mockTasks)
      mockTasksAPI.updateTask.mockResolvedValueOnce(uncompletedTask)

      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.completeTask('2', false)
      })

      expect(result.current.tasks[1].completed).toBe(false)
      expect(mockTasksAPI.updateTask).toHaveBeenCalledWith('2', { completed: false })
    })
  })

  describe('refetch', () => {
    it('should refetch tasks', async () => {
      const newTasks = [{ ...mockTasks[0], title: 'Refreshed Task' }]
      
      mockTasksAPI.getTasks
        .mockResolvedValueOnce(mockTasks)
        .mockResolvedValueOnce(newTasks)

      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.tasks).toEqual(mockTasks)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.tasks).toEqual(newTasks)
      expect(mockTasksAPI.getTasks).toHaveBeenCalledTimes(2)
    })

    it('should handle refetch error', async () => {
      const errorMessage = 'Failed to refresh tasks'
      
      mockTasksAPI.getTasks
        .mockResolvedValueOnce(mockTasks)
        .mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('concurrent operations', () => {
    it('should handle concurrent task operations', async () => {
      mockTasksAPI.getTasks.mockResolvedValueOnce(mockTasks)
      mockTasksAPI.updateTask
        .mockResolvedValueOnce({ ...mockTasks[0], completed: true })
        .mockResolvedValueOnce({ ...mockTasks[1], completed: false })

      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Start concurrent operations
      const complete1 = act(async () => {
        await result.current.completeTask('1', true)
      })

      const complete2 = act(async () => {
        await result.current.completeTask('2', false)
      })

      await Promise.all([complete1, complete2])

      expect(result.current.tasks[0].completed).toBe(true)
      expect(result.current.tasks[1].completed).toBe(false)
    })
  })

  describe('error recovery', () => {
    it('should clear error on successful operation after error', async () => {
      const errorMessage = 'Initial error'
      const newTask = {
        id: '3',
        title: 'Recovery Task',
        description: 'Task after error',
        priority: 'medium' as const,
        completed: false,
        dueDate: '2024-12-30',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z'
      }

      mockTasksAPI.getTasks.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useTasks())
      
      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage)
      })

      // Now make a successful operation
      mockTasksAPI.createTask.mockResolvedValueOnce(newTask)

      await act(async () => {
        await result.current.createTask({
          title: 'Recovery Task',
          description: 'Task after error',
          priority: 'medium'
        })
      })

      expect(result.current.error).toBeNull()
      expect(result.current.tasks).toContain(newTask)
    })
  })
})