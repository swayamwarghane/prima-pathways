import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, UserPlus, ClipboardList, Trash2 } from 'lucide-react';

interface Intern {
  id: string;
  full_name: string;
  email: string;
}

interface Task {
  id: string;
  task_title: string;
  task_description: string;
  task_order: number;
}

interface InternTask {
  id: string;
  intern_id: string;
  task_id: string;
  status: string;
}

export default function AdminAssignTasks() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [internTasks, setInternTasks] = useState<InternTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntern, setSelectedIntern] = useState<string>('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  
  // New task dialog
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'admin') {
        navigate('/dashboard');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      // Fetch interns (users with intern role)
      const { data: internsData, error: internsError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (internsError) throw internsError;

      // Filter to only interns
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'intern');

      const internIds = new Set(rolesData?.map(r => r.user_id) || []);
      const filteredInterns = internsData?.filter(p => internIds.has(p.id)) || [];
      setInterns(filteredInterns);

      // Fetch all tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('task_order');

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch all intern-task assignments
      const { data: internTasksData, error: internTasksError } = await supabase
        .from('intern_tasks')
        .select('id, intern_id, task_id, status');

      if (internTasksError) throw internTasksError;
      setInternTasks(internTasksData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInternChange = (internId: string) => {
    setSelectedIntern(internId);
    // Get already assigned tasks for this intern
    const assignedTaskIds = internTasks
      .filter(it => it.intern_id === internId)
      .map(it => it.task_id);
    setSelectedTasks(assignedTaskIds);
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleAssignTasks = async () => {
    if (!selectedIntern) {
      toast.error('Please select an intern');
      return;
    }

    setAssigning(true);
    try {
      // Get current assignments for this intern
      const currentAssignments = internTasks.filter(it => it.intern_id === selectedIntern);
      const currentTaskIds = currentAssignments.map(it => it.task_id);

      // Tasks to add
      const tasksToAdd = selectedTasks.filter(id => !currentTaskIds.includes(id));
      
      // Tasks to remove
      const tasksToRemove = currentTaskIds.filter(id => !selectedTasks.includes(id));

      // Remove unselected tasks
      if (tasksToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('intern_tasks')
          .delete()
          .eq('intern_id', selectedIntern)
          .in('task_id', tasksToRemove);

        if (deleteError) throw deleteError;
      }

      // Add new tasks
      if (tasksToAdd.length > 0) {
        // Sort tasks by order to determine which should be in_progress
        const sortedTasksToAdd = tasks
          .filter(t => tasksToAdd.includes(t.id))
          .sort((a, b) => a.task_order - b.task_order);

        // Check if intern has any tasks currently in_progress
        const hasInProgressTask = internTasks.some(
          it => it.intern_id === selectedIntern && 
                it.status === 'in_progress' && 
                selectedTasks.includes(it.task_id)
        );

        const newAssignments = sortedTasksToAdd.map((task, index) => ({
          intern_id: selectedIntern,
          task_id: task.id,
          status: ((!hasInProgressTask && index === 0) ? 'in_progress' : 'locked') as 'in_progress' | 'locked',
        }));

        const { error: insertError } = await supabase
          .from('intern_tasks')
          .insert(newAssignments);

        if (insertError) throw insertError;
      }

      toast.success('Tasks updated successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update tasks');
    } finally {
      setAssigning(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setCreatingTask(true);
    try {
      // Get the highest task order
      const maxOrder = Math.max(...tasks.map(t => t.task_order), 0);

      const { error } = await supabase
        .from('tasks')
        .insert({
          task_title: newTaskTitle,
          task_description: newTaskDescription,
          task_order: maxOrder + 1,
        });

      if (error) throw error;

      toast.success('Task created successfully');
      setShowNewTaskDialog(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This will also remove it from all intern assignments.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task');
    }
  };

  const getAssignedInternCount = (taskId: string) => {
    return internTasks.filter(it => it.task_id === taskId).length;
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Assign Tasks
            </h1>
            <p className="text-muted-foreground mt-1">
              Create tasks and assign them to specific interns.
            </p>
          </div>
          <Button onClick={() => setShowNewTaskDialog(true)} className="gradient-primary gap-2">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Task Assignment Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Assign Tasks to Intern
              </CardTitle>
              <CardDescription>
                Select an intern and choose which tasks to assign them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Intern</Label>
                <Select value={selectedIntern} onValueChange={handleInternChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an intern..." />
                  </SelectTrigger>
                  <SelectContent>
                    {interns.map((intern) => (
                      <SelectItem key={intern.id} value={intern.id}>
                        {intern.full_name} ({intern.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedIntern && (
                <>
                  <div className="space-y-2">
                    <Label>Select Tasks</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                      {tasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No tasks available. Create a task first.
                        </p>
                      ) : (
                        tasks.map((task) => (
                          <div key={task.id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded">
                            <Checkbox
                              id={task.id}
                              checked={selectedTasks.includes(task.id)}
                              onCheckedChange={() => handleTaskToggle(task.id)}
                            />
                            <div className="flex-1">
                              <label htmlFor={task.id} className="text-sm font-medium cursor-pointer">
                                {task.task_order}. {task.task_title}
                              </label>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {task.task_description}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={handleAssignTasks} 
                    disabled={assigning}
                    className="w-full"
                  >
                    {assigning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Task Assignments'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tasks List Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                All Tasks
              </CardTitle>
              <CardDescription>
                Manage all available tasks in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No tasks created yet.
                  </p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {task.task_order}. {task.task_title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Assigned to {getAssignedInternCount(task.id)} intern(s)
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Task Dialog */}
        <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task that can be assigned to interns.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="taskTitle">Task Title</Label>
                <Input
                  id="taskTitle"
                  placeholder="e.g., Complete Python Basics"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskDescription">Task Description</Label>
                <Textarea
                  id="taskDescription"
                  placeholder="Describe what the intern needs to do..."
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={creatingTask} className="gradient-primary">
                {creatingTask ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
