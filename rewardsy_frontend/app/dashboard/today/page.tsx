'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Calendar, 
  Clock,
  CheckCircle2,
  Target,
  Sun,
  Moon
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import TaskCard from '@/components/tasks/TaskCard';
import NewTaskModal from '@/components/tasks/NewTaskModal';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/lib/tasks';
import { isToday, format } from 'date-fns';

export default function TodayPage() {
  const { user, _hasHydrated } = useAuthStore();
  const { tasks, isLoading, completeTask, deleteTask, refetch } = useTasks();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  if (!user) {
    return null;
  }

  const todayTasks = tasks.filter(task => 
    task.dueDate && isToday(new Date(task.dueDate))
  );

  const completedToday = todayTasks.filter(task => task.completed).length;
  const totalToday = todayTasks.length;
  const completionRate = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const timeIcon = currentHour < 18 ? Sun : Moon;

  const handleTaskComplete = async (id: string, completed: boolean) => {
    await completeTask(id, completed);
  };

  const handleTaskDelete = async (id: string) => {
    await deleteTask(id);
  };

  const handleTaskEdit = (task: Task) => {
    // In a real app, you'd open an edit modal here
    console.log('Edit task:', task);
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
              <div className="flex items-center gap-3 mb-2">
                {React.createElement(timeIcon, { className: "h-8 w-8 text-amber-500" })}
                <h1 className="text-3xl font-bold">
                  {greeting}, {user.name}!
                </h1>
              </div>
              <p className="text-muted-foreground">
                Today is {format(new Date(), 'EEEE, MMMM d, yyyy')}. You have {totalToday} tasks scheduled.
              </p>
            </div>

            {/* Today's Progress */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Progress
                </CardTitle>
                <CardDescription>
                  Track your daily productivity and stay focused
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tasks Completed</span>
                      <span>{completedToday} of {totalToday}</span>
                    </div>
                    <Progress value={completionRate} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{totalToday}</div>
                      <div className="text-sm text-muted-foreground">Scheduled</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{completedToday}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{totalToday - completedToday}</div>
                      <div className="text-sm text-muted-foreground">Remaining</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Today's Tasks</CardTitle>
                    <CardDescription>
                      Focus on what matters most today
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsNewTaskModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading today's tasks...</p>
                  </div>
                ) : todayTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tasks for today</h3>
                    <p className="text-muted-foreground mb-4">
                      You have a clear schedule today. Add some tasks to stay productive!
                    </p>
                    <Button onClick={() => setIsNewTaskModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Task
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayTasks.map(task => (
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