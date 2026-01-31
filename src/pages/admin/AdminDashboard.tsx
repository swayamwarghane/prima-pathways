import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, ClipboardList, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface Stats {
  totalInterns: number;
  completedRegistrations: number;
  pendingApprovals: number;
  totalApproved: number;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalInterns: 0,
    completedRegistrations: 0,
    pendingApprovals: 0,
    totalApproved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentInterns, setRecentInterns] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'admin') {
        navigate('/dashboard');
      } else {
        fetchStats();
      }
    }
  }, [user, authLoading, navigate]);

  const fetchStats = async () => {
    try {
      // Get total interns (users with intern role)
      const { count: internCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'intern');

      // Get completed registrations
      const { count: completedCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('registration_step', 4);

      // Get pending approvals
      const { count: pendingCount } = await supabase
        .from('intern_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');

      // Get approved tasks
      const { count: approvedCount } = await supabase
        .from('intern_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Get recent interns
      const { data: recent } = await supabase
        .from('profiles')
        .select('id, full_name, email, registration_step, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalInterns: internCount || 0,
        completedRegistrations: completedCount || 0,
        pendingApprovals: pendingCount || 0,
        totalApproved: approvedCount || 0,
      });
      setRecentInterns(recent || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage interns, review tasks, and track overall progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Interns
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInterns}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedRegistrations} completed registration
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approvals
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">
                Tasks awaiting review
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasks Approved
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.totalApproved}</div>
              <p className="text-xs text-muted-foreground">
                All time approvals
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Registration Rate
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">
                {stats.totalInterns > 0
                  ? Math.round((stats.completedRegistrations / stats.totalInterns) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Completion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions and Recent Interns */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
              <CardDescription>Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/tasks">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Review Pending Tasks
                  </span>
                  <span className="bg-warning/10 text-warning px-2 py-0.5 rounded-full text-xs font-medium">
                    {stats.pendingApprovals}
                  </span>
                </Button>
              </Link>
              <Link to="/admin/interns">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    View All Interns
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/export">
                <Button variant="outline" className="w-full justify-start gap-2">
                  Export Data
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Interns */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-display">Recent Interns</CardTitle>
              <CardDescription>Newly registered interns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInterns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No interns registered yet
                  </p>
                ) : (
                  recentInterns.map((intern) => (
                    <div
                      key={intern.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-sm">{intern.full_name}</p>
                        <p className="text-xs text-muted-foreground">{intern.email}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          intern.registration_step >= 4
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {intern.registration_step >= 4 ? 'Complete' : 'Pending'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
