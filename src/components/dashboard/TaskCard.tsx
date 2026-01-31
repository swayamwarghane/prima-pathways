import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, TaskStatus } from '@/components/ui/status-badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, Send, CheckCircle2, XCircle, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  taskId: string;
  internTaskId: string;
  title: string;
  description: string;
  status: TaskStatus;
  taskOrder: number;
  adminRemarks?: string | null;
  onUpdate: () => void;
}

export function TaskCard({
  taskId,
  internTaskId,
  title,
  description,
  status,
  taskOrder,
  adminRemarks,
  onUpdate,
}: TaskCardProps) {
  const [submissionContent, setSubmissionContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const isLocked = status === 'locked';
  const canSubmit = status === 'in_progress' || status === 'rejected';

  const handleSubmit = async () => {
    if (!submissionContent.trim()) {
      toast.error('Please enter your submission');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('intern_tasks')
        .update({
          status: 'submitted',
          submission_content: submissionContent,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', internTaskId);

      if (error) throw error;
      
      toast.success('Task submitted successfully!');
      setSubmissionContent('');
      setShowSubmitForm(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit task');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'locked':
        return <Lock className="h-5 w-5 text-muted-foreground" />;
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'submitted':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return null;
    }
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300",
        isLocked 
          ? "opacity-60 bg-muted/30" 
          : "shadow-card hover:shadow-elevated",
        status === 'in_progress' && "ring-2 ring-primary/20"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                isLocked 
                  ? "bg-muted text-muted-foreground" 
                  : "gradient-primary text-primary-foreground"
              )}
            >
              {taskOrder}
            </div>
            <div>
              <CardTitle className={cn("text-lg", isLocked && "text-muted-foreground")}>
                {title}
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <StatusBadge status={status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <CardDescription className={cn("text-sm", isLocked && "text-muted-foreground/70")}>
          {description}
        </CardDescription>
        
        {adminRemarks && (status === 'rejected' || status === 'approved') && (
          <div className={cn(
            "mt-4 p-3 rounded-lg border",
            status === 'rejected' 
              ? "bg-destructive/5 border-destructive/20" 
              : "bg-success/5 border-success/20"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Admin Feedback</span>
            </div>
            <p className="text-sm">{adminRemarks}</p>
          </div>
        )}

        {showSubmitForm && canSubmit && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <Textarea
              placeholder="Describe your work, provide links, or explain your approach..."
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        )}
      </CardContent>
      {canSubmit && (
        <CardFooter className="pt-0">
          {showSubmitForm ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setShowSubmitForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 gradient-primary hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Task
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowSubmitForm(true)}
              className="w-full gradient-primary hover:opacity-90"
            >
              {status === 'rejected' ? 'Resubmit Task' : 'Start Working'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
