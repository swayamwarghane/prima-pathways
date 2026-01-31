import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge, TaskStatus } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, Eye, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TaskSubmission {
  id: string;
  intern_id: string;
  task_id: string;
  status: TaskStatus;
  submission_content: string | null;
  admin_remarks: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  profiles: {
    full_name: string;
    email: string;
  };
  tasks: {
    task_title: string;
    task_description: string;
    task_order: number;
  };
}

export default function AdminTasks() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'admin') {
        navigate('/dashboard');
      } else {
        fetchSubmissions();
      }
    }
  }, [user, authLoading, navigate]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('intern_tasks')
        .select(`
          *,
          profiles (
            full_name,
            email
          ),
          tasks (
            task_title,
            task_description,
            task_order
          )
        `)
        .in('status', ['submitted', 'approved', 'rejected'])
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions((data as unknown as TaskSubmission[]) || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedSubmission || !user) return;

    setActionLoading(true);
    try {
      // Update current task status
      const { error: updateError } = await supabase
        .from('intern_tasks')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_remarks: remarks || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', selectedSubmission.id);

      if (updateError) throw updateError;

      // If approved, unlock the next task
      if (action === 'approve') {
        const currentOrder = selectedSubmission.tasks.task_order;
        
        // Get next task
        const { data: nextTask } = await supabase
          .from('tasks')
          .select('id')
          .eq('task_order', currentOrder + 1)
          .maybeSingle();

        if (nextTask) {
          // Update next task to in_progress
          await supabase
            .from('intern_tasks')
            .update({ status: 'in_progress' })
            .eq('intern_id', selectedSubmission.intern_id)
            .eq('task_id', nextTask.id);
        }
      }

      toast.success(`Task ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setSelectedSubmission(null);
      setRemarks('');
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} task`);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted');
  const reviewedSubmissions = submissions.filter((s) => s.status !== 'submitted');

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const SubmissionCard = ({ submission }: { submission: TaskSubmission }) => (
    <Card className="shadow-card hover:shadow-elevated transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{submission.tasks.task_title}</CardTitle>
            <CardDescription className="mt-1">
              <span className="font-medium">{submission.profiles.full_name}</span>
              {' · '}
              {submission.profiles.email}
            </CardDescription>
          </div>
          <StatusBadge status={submission.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {submission.submitted_at
              ? format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')
              : '—'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedSubmission(submission)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Task Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage intern task submissions.
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              {pendingSubmissions.length > 0 && (
                <span className="bg-warning/20 text-warning text-xs px-2 py-0.5 rounded-full">
                  {pendingSubmissions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingSubmissions.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-muted-foreground">
                    No pending task submissions to review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingSubmissions.map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="space-y-4">
            {reviewedSubmissions.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No reviewed submissions yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {reviewedSubmissions.map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={!!selectedSubmission} onOpenChange={() => {
          setSelectedSubmission(null);
          setRemarks('');
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Review Submission</DialogTitle>
              <DialogDescription>
                {selectedSubmission?.tasks.task_title} by {selectedSubmission?.profiles.full_name}
              </DialogDescription>
            </DialogHeader>
            {selectedSubmission && (
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Task Description
                  </h4>
                  <p className="text-sm">{selectedSubmission.tasks.task_description}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Submission Content
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedSubmission.submission_content || 'No content submitted'}
                    </p>
                  </div>
                </div>
                {selectedSubmission.status === 'submitted' && (
                  <div>
                    <Label htmlFor="remarks">Admin Remarks (Optional)</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Add feedback or comments for the intern..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
                {selectedSubmission.admin_remarks && selectedSubmission.status !== 'submitted' && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Admin Remarks
                    </h4>
                    <p className="text-sm">{selectedSubmission.admin_remarks}</p>
                  </div>
                )}
              </div>
            )}
            {selectedSubmission?.status === 'submitted' && (
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAction('reject')}
                  disabled={actionLoading}
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading}
                  className="bg-success hover:bg-success/90"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
