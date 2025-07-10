'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Target, 
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTasks } from '@/hooks/useTasks';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  deadline: Date;
  category: 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'completed' | 'paused';
}

const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Complete 5 tasks daily',
    description: 'Maintain consistent productivity by completing at least 5 tasks every day',
    targetCount: 5,
    currentCount: 3,
    deadline: new Date(Date.now() + 86400000),
    category: 'daily',
    status: 'active'
  },
  {
    id: '2',
    title: 'Finish 20 tasks this week',
    description: 'Weekly productivity goal to stay on track with projects',
    targetCount: 20,
    currentCount: 12,
    deadline: new Date(Date.now() + 604800000),
    category: 'weekly',
    status: 'active'
  },
  {
    id: '3',
    title: 'Complete 100 tasks this month',
    description: 'Monthly milestone for maximum productivity',
    targetCount: 100,
    currentCount: 45,
    deadline: new Date(Date.now() + 2592000000),
    category: 'monthly',
    status: 'active'
  }
];

export default function GoalsPage() {
  const { user, _hasHydrated } = useAuthStore();
  const { tasks } = useTasks();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [goals] = useState<Goal[]>(mockGoals);

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

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'daily': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'weekly': return 'bg-green-100 text-green-800 border-green-200';
      case 'monthly': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                Goals & Milestones
              </h1>
              <p className="text-muted-foreground">
                Track your progress and achieve your productivity targets
              </p>
            </div>

            {/* Overall Progress */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Overall Progress
                </CardTitle>
                <CardDescription>
                  Your productivity journey at a glance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{totalTasks}</div>
                    <div className="text-sm text-muted-foreground">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{completedTasks}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{overallProgress.toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Completion</span>
                    <span>{overallProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Goals Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {goals.map((goal) => {
                const progress = (goal.currentCount / goal.targetCount) * 100;
                const isCompleted = goal.currentCount >= goal.targetCount;
                
                return (
                  <Card key={goal.id} className="hover:shadow-lg transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{goal.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {goal.description}
                          </CardDescription>
                        </div>
                        {isCompleted && (
                          <Trophy className="h-6 w-6 text-yellow-500" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Badge variant="outline" className={getCategoryColor(goal.category)}>
                            {goal.category}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{goal.currentCount} / {goal.targetCount}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {goal.deadline.toLocaleDateString()}</span>
                        </div>
                        
                        {isCompleted && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Goal Completed!</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Create New Goal */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Goal</CardTitle>
                <CardDescription>
                  Set new productivity targets to challenge yourself
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready for a new challenge?</h3>
                  <p className="text-muted-foreground mb-4">
                    Create custom goals to track your progress and stay motivated
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Goal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}