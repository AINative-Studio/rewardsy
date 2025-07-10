'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Calendar, 
  Target, 
  Gift, 
  TrendingUp,
  Clock,
  CheckCircle2,
  Filter
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import TaskCard from '@/components/tasks/TaskCard';
import NewTaskModal from '@/components/tasks/NewTaskModal';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/lib/tasks';
import { cn } from '@/lib/utils';
import { format, isToday, isThisWeek } from 'date-fns';

type FilterType = 'all' | 'today' | 'week' | 'completed' | 'pending';

export default function DashboardPage() {
  const { user, _hasHydrated } = useAuthStore();
  const { tasks, isLoading, completeTask, deleteTask, refetch } = useTasks();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Redirect if not authenticated - must be called unconditionally
  useEffect(() => {
    if (!_hasHydrated) return; // Wait for hydration before checking auth
    
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('auth-token');
        
        if (!user && (!storedUser || !token)) {
          window.location.href = '/login';
        }
      }
    };
    
    checkAuth();
  }, [user, _hasHydrated]);

  // Wait for hydration before rendering
  if (!_hasHydrated) {
    return null;
  }

  // Redirect if not authenticated after hydration
  if (!user) {
    return null;
  }

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'today':
        return task.dueDate && isToday(new Date(task.dueDate));
      case 'week':
        return task.dueDate && isThisWeek(new Date(task.dueDate));
      case 'completed':
        return task.completed;
      case 'pending':
        return !task.completed;
      default:
        return true;
    }
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    today: tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate))).length,
  };

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  const filterButtons = [
    { key: 'all', label: 'All Tasks', icon: Target },
    { key: 'today', label: 'Today', icon: Calendar },
    { key: 'week', label: 'This Week', icon: Clock },
    { key: 'pending', label: 'Pending', icon: Circle },
    { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  ];

  const handleTaskComplete = async (id: string, completed: boolean) => {
    await completeTask(id, completed);
  };

  const handleTaskDelete = async (id: string) => {
    await deleteTask(id);
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    // In a real app, you'd open an edit modal here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        showMenuToggle={true}
      />
      
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar isCollapsed={isSidebarCollapsed} />
        </div>
        
        <main className="flex-1 overflow-hidden">
          <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Good morning, {user.name}! 👋
              </h1>
              <p className="text-muted-foreground">
                You have {stats.pending} pending tasks and {stats.today} due today.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pending} pending
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">
                    {completionRate.toFixed(0)}% completion rate
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Due Today</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.today}</div>
                  <p className="text-xs text-muted-foreground">
                    Focus on today's goals
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">
                    Keep up the great work!
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress Overview
                </CardTitle>
                <CardDescription>
                  Your productivity metrics for this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Completion</span>
                      <span>{completionRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Tasks</CardTitle>
                    <CardDescription>
                      Manage your tasks and earn rewards for completing them
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsNewTaskModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {filterButtons.map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      variant={filter === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(key as FilterType)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>

                {/* Tasks List */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading tasks...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                    <p className="text-muted-foreground mb-4">
                      {filter === 'all' 
                        ? "You haven't created any tasks yet. Create your first task to get started!"
                        : `No tasks match the "${filter}" filter.`
                      }
                    </p>
                    {filter === 'all' && (
                      <Button onClick={() => setIsNewTaskModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Task
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleTaskComplete}
                        onDelete={handleTaskDelete}
                        onEdit={handleTaskEdit}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <NewTaskModal
        open={isNewTaskModalOpen}
        onOpenChange={setIsNewTaskModalOpen}
        onTaskCreated={refetch}
      />
    </div>
  );
}

// Circle icon for pending tasks
function Circle({ className }: { className?: string }) {
  return (
    <div className={cn("w-4 h-4 rounded-full border-2 border-current", className)} />
  );
}