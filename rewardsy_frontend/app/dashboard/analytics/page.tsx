'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Calendar,
  Target,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Award
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTasks } from '@/hooks/useTasks';
import { format, subDays, isAfter, isBefore, startOfWeek, endOfWeek } from 'date-fns';

export default function AnalyticsPage() {
  const { user, _hasHydrated } = useAuthStore();
  const { tasks } = useTasks();
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

  // Calculate analytics data
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Priority distribution
  const highPriorityTasks = tasks.filter(task => task.priority === 'high').length;
  const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium').length;
  const lowPriorityTasks = tasks.filter(task => task.priority === 'low').length;

  // Weekly data
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const thisWeekTasks = tasks.filter(task => {
    const taskDate = task.createdAt;
    return isAfter(taskDate, weekStart) && isBefore(taskDate, weekEnd);
  });

  // Last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    const dayTasks = tasks.filter(task => 
      format(task.createdAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return {
      date: format(date, 'MMM dd'),
      tasks: dayTasks.length,
      completed: dayTasks.filter(task => task.completed).length
    };
  }).reverse();

  const averageTasksPerDay = last7Days.reduce((sum, day) => sum + day.tasks, 0) / 7;
  const averageCompletionPerDay = last7Days.reduce((sum, day) => sum + day.completed, 0) / 7;

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
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">
                Insights into your productivity patterns and performance
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    All time
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {completedTasks} of {totalTasks} completed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageTasksPerDay.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    Tasks per day (7-day avg)
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{thisWeekTasks.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Tasks created
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Priority Distribution
                  </CardTitle>
                  <CardDescription>
                    Breakdown of tasks by priority level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">High Priority</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{highPriorityTasks}</span>
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                          {totalTasks > 0 ? ((highPriorityTasks / totalTasks) * 100).toFixed(0) : 0}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={totalTasks > 0 ? (highPriorityTasks / totalTasks) * 100 : 0} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Medium Priority</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{mediumPriorityTasks}</span>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          {totalTasks > 0 ? ((mediumPriorityTasks / totalTasks) * 100).toFixed(0) : 0}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={totalTasks > 0 ? (mediumPriorityTasks / totalTasks) * 100 : 0} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Low Priority</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{lowPriorityTasks}</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          {totalTasks > 0 ? ((lowPriorityTasks / totalTasks) * 100).toFixed(0) : 0}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={totalTasks > 0 ? (lowPriorityTasks / totalTasks) * 100 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Completion Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Completion Status
                  </CardTitle>
                  <CardDescription>
                    Overview of completed vs pending tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">{completionRate.toFixed(0)}%</div>
                      <p className="text-sm text-muted-foreground">Overall Completion Rate</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Completed</span>
                        </div>
                        <span className="text-sm font-medium">{completedTasks} tasks</span>
                      </div>
                      <Progress value={completionRate} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">Pending</span>
                        </div>
                        <span className="text-sm font-medium">{pendingTasks} tasks</span>
                      </div>
                      <Progress value={100 - completionRate} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 7-Day Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  7-Day Activity
                </CardTitle>
                <CardDescription>
                  Your task creation and completion patterns over the last week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {last7Days.map((day, index) => (
                      <div key={index} className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">{day.date}</div>
                        <div className="space-y-1">
                          <div className="h-8 bg-blue-100 rounded flex items-end justify-center">
                            <div 
                              className="bg-blue-500 rounded-b w-full"
                              style={{ height: `${Math.max((day.tasks / Math.max(...last7Days.map(d => d.tasks))) * 100, 10)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs">{day.tasks}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-6 bg-green-100 rounded flex items-end justify-center">
                            <div 
                              className="bg-green-500 rounded-b w-full"
                              style={{ height: `${Math.max((day.completed / Math.max(...last7Days.map(d => d.completed))) * 100, 10)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-green-600">{day.completed}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center gap-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm">Tasks Created</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">Tasks Completed</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}