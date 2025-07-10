/**
 * Unit tests for TaskCard component
 * Tests task display, interactions, and state management
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskCard } from '@/components/tasks/TaskCard'
import { Task } from '@/lib/tasks'

// Mock date-fns to have consistent dates in tests
jest.mock('date-fns', () => ({
  format: (date: Date | string, formatStr: string) => {
    if (formatStr === 'MMM d') return 'Dec 25'
    if (formatStr === 'MMM d, yyyy') return 'Dec 25, 2024'
    return 'Dec 25, 2024'
  }
}))

// Sample task data
const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'This is a test task description',
  priority: 'medium',
  completed: false,
  dueDate: new Date('2024-12-25'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
}

const mockCompletedTask: Task = {
  ...mockTask,
  id: '2',
  title: 'Completed Task',
  completed: true,
  completedAt: new Date('2024-12-20')
}

const mockOverdueTask: Task = {
  ...mockTask,
  id: '3',
  title: 'Overdue Task',
  dueDate: new Date('2024-01-01'), // Past date
  completed: false
}

const mockTaskWithReward: Task = {
  ...mockTask,
  id: '4',
  title: 'Task with Reward',
  reward: 'Coffee break'
}

describe('TaskCard', () => {
  const mockOnComplete = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnEdit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock current date to be after the overdue date
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-12-01'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('rendering', () => {
    it('should render task title and description', () => {
      render(
        <TaskCard
          task={mockTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.getByText('Test Task')).toBeInTheDocument()
      expect(screen.getByText('This is a test task description')).toBeInTheDocument()
    })

    it('should render priority badge', () => {
      render(
        <TaskCard
          task={mockTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.getByText('medium')).toBeInTheDocument()
    })

    it('should render due date when present', () => {
      render(
        <TaskCard
          task={mockTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.getByText('Dec 25')).toBeInTheDocument()
    })

    it('should render reward when present', () => {
      render(
        <TaskCard
          task={mockTaskWithReward}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.getByText('Reward: Coffee break')).toBeInTheDocument()
    })

    it('should render completion date for completed tasks', () => {
      render(
        <TaskCard
          task={mockCompletedTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.getByText(/Completed Dec 25, 2024/)).toBeInTheDocument()
    })
  })

  describe('priority styling', () => {
    it('should apply correct styling for high priority', () => {
      const highPriorityTask = { ...mockTask, priority: 'high' as const }
      render(
        <TaskCard
          task={highPriorityTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const priorityBadge = screen.getByText('high')
      expect(priorityBadge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200')
    })

    it('should apply correct styling for medium priority', () => {
      render(
        <TaskCard
          task={mockTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const priorityBadge = screen.getByText('medium')
      expect(priorityBadge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200')
    })

    it('should apply correct styling for low priority', () => {
      const lowPriorityTask = { ...mockTask, priority: 'low' as const }
      render(
        <TaskCard
          task={lowPriorityTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const priorityBadge = screen.getByText('low')
      expect(priorityBadge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200')
    })
  })

  describe('completion state', () => {
    it('should show checkbox as unchecked for incomplete tasks', () => {
      render(
        <TaskCard
          task={mockTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
    })

    it('should show checkbox as checked for completed tasks', () => {
      render(
        <TaskCard
          task={mockCompletedTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('should apply strikethrough styling to completed task title', () => {
      render(
        <TaskCard
          task={mockCompletedTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const title = screen.getByText('Completed Task')
      expect(title).toHaveClass('line-through', 'text-muted-foreground')
    })

    it('should apply opacity styling to completed task card', () => {
      const { container } = render(
        <TaskCard
          task={mockCompletedTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('opacity-75', 'bg-muted/50')
    })
  })

  describe('overdue state', () => {
    it('should show overdue badge for overdue tasks', () => {
      render(
        <TaskCard
          task={mockOverdueTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.getByText('Overdue')).toBeInTheDocument()
    })

    it('should apply warning styling to overdue task card', () => {
      const { container } = render(
        <TaskCard
          task={mockOverdueTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('border-red-200', 'bg-red-50/50')
    })

    it('should not show overdue badge for completed overdue tasks', () => {
      const completedOverdueTask = { ...mockOverdueTask, completed: true }
      render(
        <TaskCard
          task={completedOverdueTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onComplete when checkbox is clicked', async () => {
      render(
        <TaskCard
          task={mockTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      expect(mockOnComplete).toHaveBeenCalledWith('1', true)
    })

    it('should call onComplete with false when unchecking completed task', async () => {
      render(
        <TaskCard
          task={mockCompletedTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      expect(mockOnComplete).toHaveBeenCalledWith('2', false)
    })

    it('should disable checkbox while completing', async () => {
      let resolveComplete: (value: any) => void
      const slowComplete = jest.fn(() => new Promise(resolve => {
        resolveComplete = resolve
      }))

      render(
        <TaskCard
          task={mockTask}
          onComplete={slowComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      expect(checkbox).toBeDisabled()

      // Resolve the promise
      resolveComplete!()
      await waitFor(() => {
        expect(checkbox).not.toBeDisabled()
      })
    })

    it('should call onEdit when edit menu item is clicked', async () => {
      render(
        <TaskCard
          task={mockTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      // Open dropdown menu
      const menuButton = screen.getByRole('button', { name: /more options/i })
      fireEvent.click(menuButton)

      // Click edit option
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith(mockTask)
    })

    it('should call onDelete when delete menu item is clicked', async () => {
      render(
        <TaskCard
          task={mockTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      // Open dropdown menu
      const menuButton = screen.getByRole('button', { name: /more options/i })
      fireEvent.click(menuButton)

      // Click delete option
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith('1')
    })
  })

  describe('menu visibility', () => {
    it('should show menu button on hover', () => {
      const { container } = render(
        <TaskCard
          task={mockTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const card = container.firstChild as HTMLElement
      const menuButton = screen.getByRole('button', { name: /more options/i })

      // Initially hidden
      expect(menuButton).toHaveClass('opacity-0')

      // Visible on hover
      fireEvent.mouseEnter(card)
      expect(menuButton).toHaveClass('group-hover:opacity-100')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TaskCard
          task={mockTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()

      const menuButton = screen.getByRole('button', { name: /more options/i })
      expect(menuButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      render(
        <TaskCard
          task={mockTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()
      expect(checkbox).toHaveFocus()

      // Test keyboard activation
      fireEvent.keyDown(checkbox, { key: ' ', code: 'Space' })
      expect(mockOnComplete).toHaveBeenCalledWith('1', true)
    })
  })

  describe('edge cases', () => {
    it('should handle task without description', () => {
      const taskWithoutDescription = { ...mockTask, description: undefined }
      render(
        <TaskCard
          task={taskWithoutDescription}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.getByText('Test Task')).toBeInTheDocument()
      expect(screen.queryByText('This is a test task description')).not.toBeInTheDocument()
    })

    it('should handle task without due date', () => {
      const taskWithoutDueDate = { ...mockTask, dueDate: undefined }
      render(
        <TaskCard
          task={taskWithoutDueDate}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.queryByText('Dec 25')).not.toBeInTheDocument()
    })

    it('should handle task without reward', () => {
      render(
        <TaskCard
          task={mockTask}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.queryByText(/Reward:/)).not.toBeInTheDocument()
    })

    it('should handle completion errors gracefully', async () => {
      const errorComplete = jest.fn().mockRejectedValue(new Error('Network error'))

      render(
        <TaskCard
          task={mockTask}
          onComplete={errorComplete}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      // Should still re-enable checkbox after error
      await waitFor(() => {
        expect(checkbox).not.toBeDisabled()
      })
    })
  })
})