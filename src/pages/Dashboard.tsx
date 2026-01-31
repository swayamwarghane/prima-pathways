import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TaskCard } from '@/components/dashboard/TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';
import { TaskStatus } from '@/components/ui/status-badge';

interface InternTask {
  id: string;
  task_id: string;
  status: TaskStatus;
  admin_remarks: string | null;
  tasks: {
    id: string;
    task_title: string;
    task_description: string;
    task_order: number;
  };
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<InternTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('intern_tasks')
        .select(`
          id,
          task_id,
          status,
          admin_remarks,
          tasks (
            id,
            task_title,
            task_description,
            task_order
          )
        `)
        .eq('intern_id', user.id)
        .order('tasks(task_order)', { ascending: true });

      if (error) throw error;
      setTasks((data as unknown as InternTask[]) || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.registrationStep < 4) {
        navigate('/registration');
      } else {
        fetchTasks();
      }
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const approvedCount = tasks.filter(t => t.status === 'approved').length;
  const pendingCount = tasks.filter(t => t.status === 'submitted').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? (approvedCount / totalTasks) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Welcome back, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your internship progress and complete your assigned tasks.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tasks
              </CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{inProgressCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progressPercent} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {approvedCount} of {totalTasks} tasks completed ({Math.round(progressPercent)}%)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div>
          <h2 className="text-xl font-display font-semibold mb-4">Your Tasks</h2>
          <div className="grid gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                taskId={task.task_id}
                internTaskId={task.id}
                title={task.tasks.task_title}
                description={task.tasks.task_description}
                status={task.status}
                taskOrder={task.tasks.task_order}
                adminRemarks={task.admin_remarks}
                onUpdate={fetchTasks}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
