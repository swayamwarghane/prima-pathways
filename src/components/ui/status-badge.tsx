import { cn } from "@/lib/utils";

export type TaskStatus = 'locked' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  locked: {
    label: 'Locked',
    className: 'bg-muted text-muted-foreground',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-info/10 text-info border-info/20',
  },
  submitted: {
    label: 'Pending Approval',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  approved: {
    label: 'Approved',
    className: 'bg-success/10 text-success border-success/20',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
