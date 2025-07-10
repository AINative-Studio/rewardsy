'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Star,
  Trophy,
  Coffee,
  Music,
  Book,
  Gamepad2,
  Heart,
  Sparkles,
  Clock
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTasks } from '@/hooks/useTasks';

interface Reward {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: 'entertainment' | 'wellness' | 'food' | 'social' | 'learning';
  points: number;
  earned: boolean;
  earnedAt?: Date;
  difficulty: 'easy' | 'medium' | 'hard';
}

const mockRewards: Reward[] = [
  {
    id: '1',
    title: 'Coffee Break',
    description: 'Enjoy your favorite coffee or tea',
    icon: Coffee,
    category: 'food',
    points: 10,
    earned: true,
    earnedAt: new Date(Date.now() - 86400000),
    difficulty: 'easy'
  },
  {
    id: '2',
    title: 'Music Session',
    description: '30 minutes of your favorite music',
    icon: Music,
    category: 'entertainment',
    points: 15,
    earned: true,
    earnedAt: new Date(Date.now() - 172800000),
    difficulty: 'easy'
  },
  {
    id: '3',
    title: 'Gaming Time',
    description: '1 hour of gaming or entertainment',
    icon: Gamepad2,
    category: 'entertainment',
    points: 25,
    earned: false,
    difficulty: 'medium'
  },
  {
    id: '4',
    title: 'Reading Break',
    description: 'Read a chapter of your favorite book',
    icon: Book,
    category: 'learning',
    points: 20,
    earned: false,
    difficulty: 'medium'
  },
  {
    id: '5',
    title: 'Wellness Hour',
    description: 'Meditation, yoga, or relaxation time',
    icon: Heart,
    category: 'wellness',
    points: 30,
    earned: false,
    difficulty: 'hard'
  }
];

export default function RewardsPage() {
  const { user, _hasHydrated } = useAuthStore();
  const { tasks } = useTasks();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [rewards] = useState<Reward[]>(mockRewards);

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
  const earnedRewards = rewards.filter(reward => reward.earned);
  const availableRewards = rewards.filter(reward => !reward.earned);
  const totalPoints = earnedRewards.reduce((sum, reward) => sum + reward.points, 0);

  const getCategoryColor = (category: Reward['category']) => {
    switch (category) {
      case 'entertainment': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'wellness': return 'bg-green-100 text-green-800 border-green-200';
      case 'food': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'social': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'learning': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: Reward['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
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
                <Gift className="h-8 w-8 text-primary" />
                Rewards Center
              </h1>
              <p className="text-muted-foreground">
                Celebrate your achievements and unlock new rewards
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{totalPoints}</div>
                  <p className="text-xs text-muted-foreground">
                    From {completedTasks} completed tasks
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Earned Rewards</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{earnedRewards.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Out of {rewards.length} total
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available</CardTitle>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{availableRewards.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Ready to unlock
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Streak</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">7</div>
                  <p className="text-xs text-muted-foreground">
                    Days active
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Earned Rewards */}
            {earnedRewards.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Your Earned Rewards
                  </CardTitle>
                  <CardDescription>
                    Congratulations! You've unlocked these rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {earnedRewards.map((reward) => (
                      <Card key={reward.id} className="border-green-200 bg-green-50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <reward.icon className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <CardTitle className="text-sm">{reward.title}</CardTitle>
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                  <Star className="h-3 w-3" />
                                  {reward.points} points
                                </div>
                              </div>
                            </div>
                            <Trophy className="h-5 w-5 text-yellow-500" />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground mb-3">
                            {reward.description}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={getCategoryColor(reward.category)}>
                              {reward.category}
                            </Badge>
                            {reward.earnedAt && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {reward.earnedAt.toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Rewards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Available Rewards
                </CardTitle>
                <CardDescription>
                  Complete more tasks to unlock these rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableRewards.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">All rewards unlocked!</h3>
                    <p className="text-muted-foreground">
                      You've earned all available rewards. Keep up the great work!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {availableRewards.map((reward) => (
                      <Card key={reward.id} className="hover:shadow-md transition-all duration-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <reward.icon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <CardTitle className="text-sm">{reward.title}</CardTitle>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3 w-3" />
                                {reward.points} points
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground mb-3">
                            {reward.description}
                          </p>
                          <div className="flex gap-2 mb-3">
                            <Badge variant="outline" className={getCategoryColor(reward.category)}>
                              {reward.category}
                            </Badge>
                            <Badge variant="outline" className={getDifficultyColor(reward.difficulty)}>
                              {reward.difficulty}
                            </Badge>
                          </div>
                          <Button size="sm" className="w-full" disabled>
                            Complete more tasks to unlock
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}