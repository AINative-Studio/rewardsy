'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  Gift, 
  MoreHorizontal, 
  Trash2, 
  Edit3,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Task } from '@/lib/tasks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200',
};

export default function TaskCard({ task, onComplete, onDelete, onEdit }: TaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async (checked: boolean) => {
    setIsCompleting(true);
    try {
      await onComplete(task.id, checked);
    } finally {
      setIsCompleting(false);
    }
  };

  const isOverdue = task.dueDate && !task.completed && new Date() > task.dueDate;

  return (
    <Card className={cn(
      "group hover:shadow-md transition-all duration-200",
      task.completed && "opacity-75 bg-muted/50",
      isOverdue && "border-red-200 bg-red-50/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={task.completed}
              onCheckedChange={handleComplete}
              disabled={isCompleting}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-medium text-sm leading-5",
                task.completed && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(task.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="outline" 
            className={cn("text-xs", priorityColors[task.priority])}
          >
            {task.priority}
          </Badge>
          
          {task.dueDate && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="mr-1 h-3 w-3" />
              {format(task.dueDate, 'MMM d')}
            </Badge>
          )}
          
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              <Clock className="mr-1 h-3 w-3" />
              Overdue
            </Badge>
          )}
        </div>
        
        {task.reward && (
          <div className="mt-3 p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-md border border-amber-200">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                Reward: {task.reward}
              </span>
            </div>
          </div>
        )}
        
        {task.completed && task.completedAt && (
          <div className="mt-2 text-xs text-muted-foreground">
            Completed {format(task.completedAt, 'MMM d, yyyy')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}