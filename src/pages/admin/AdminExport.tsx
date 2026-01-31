import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Download, FileSpreadsheet, FileText, Users, ClipboardList } from 'lucide-react';
import { useEffect } from 'react';

export default function AdminExport() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'admin') {
        navigate('/dashboard');
      }
    }
  }, [user, authLoading, navigate]);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportInternsCSV = async () => {
    setExporting('interns-csv');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          college_details (
            college_name,
            degree,
            branch,
            passing_year
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const headers = [
        'Name',
        'Email',
        'Mobile',
        'Date of Birth',
        'Address',
        'Skills',
        'Internship Domain',
        'Registration Status',
        'College Name',
        'Degree',
        'Branch',
        'Passing Year',
        'Joined Date',
      ];

      const rows = (data || []).map((intern) => [
        intern.full_name,
        intern.email,
        intern.mobile || '',
        intern.date_of_birth || '',
        (intern.address || '').replace(/,/g, ';'),
        (intern.skills || []).join('; '),
        intern.internship_domain || '',
        intern.registration_step >= 4 ? 'Complete' : `Step ${intern.registration_step}/3`,
        intern.college_details?.[0]?.college_name || '',
        intern.college_details?.[0]?.degree || '',
        intern.college_details?.[0]?.branch || '',
        intern.college_details?.[0]?.passing_year || '',
        new Date(intern.created_at).toLocaleDateString(),
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      downloadFile(csv, `interns_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
      toast.success('Interns data exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    } finally {
      setExporting(null);
    }
  };

  const exportTasksCSV = async () => {
    setExporting('tasks-csv');
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
            task_order
          )
        `)
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const headers = [
        'Intern Name',
        'Intern Email',
        'Task Number',
        'Task Title',
        'Status',
        'Submitted At',
        'Reviewed At',
        'Admin Remarks',
      ];

      const rows = (data || []).map((item: any) => [
        item.profiles?.full_name || '',
        item.profiles?.email || '',
        item.tasks?.task_order || '',
        item.tasks?.task_title || '',
        item.status,
        item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '',
        item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : '',
        (item.admin_remarks || '').replace(/,/g, ';'),
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      downloadFile(csv, `tasks_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
      toast.success('Tasks data exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    } finally {
      setExporting(null);
    }
  };

  const exportInternsExcel = async () => {
    setExporting('interns-excel');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          college_details (
            college_name,
            degree,
            branch,
            passing_year
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Create a simple HTML table that Excel can open
      let html = `<html><head><meta charset="UTF-8"></head><body>
        <table border="1">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Date of Birth</th>
            <th>Address</th>
            <th>Skills</th>
            <th>Internship Domain</th>
            <th>Registration Status</th>
            <th>College Name</th>
            <th>Degree</th>
            <th>Branch</th>
            <th>Passing Year</th>
            <th>Joined Date</th>
          </tr>`;

      (data || []).forEach((intern) => {
        html += `<tr>
          <td>${intern.full_name}</td>
          <td>${intern.email}</td>
          <td>${intern.mobile || ''}</td>
          <td>${intern.date_of_birth || ''}</td>
          <td>${intern.address || ''}</td>
          <td>${(intern.skills || []).join(', ')}</td>
          <td>${intern.internship_domain || ''}</td>
          <td>${intern.registration_step >= 4 ? 'Complete' : `Step ${intern.registration_step}/3`}</td>
          <td>${intern.college_details?.[0]?.college_name || ''}</td>
          <td>${intern.college_details?.[0]?.degree || ''}</td>
          <td>${intern.college_details?.[0]?.branch || ''}</td>
          <td>${intern.college_details?.[0]?.passing_year || ''}</td>
          <td>${new Date(intern.created_at).toLocaleDateString()}</td>
        </tr>`;
      });

      html += '</table></body></html>';

      downloadFile(html, `interns_${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel');
      toast.success('Interns data exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    } finally {
      setExporting(null);
    }
  };

  const exportTasksExcel = async () => {
    setExporting('tasks-excel');
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
            task_order
          )
        `)
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      let html = `<html><head><meta charset="UTF-8"></head><body>
        <table border="1">
          <tr>
            <th>Intern Name</th>
            <th>Intern Email</th>
            <th>Task Number</th>
            <th>Task Title</th>
            <th>Status</th>
            <th>Submitted At</th>
            <th>Reviewed At</th>
            <th>Admin Remarks</th>
          </tr>`;

      (data || []).forEach((item: any) => {
        html += `<tr>
          <td>${item.profiles?.full_name || ''}</td>
          <td>${item.profiles?.email || ''}</td>
          <td>${item.tasks?.task_order || ''}</td>
          <td>${item.tasks?.task_title || ''}</td>
          <td>${item.status}</td>
          <td>${item.submitted_at ? new Date(item.submitted_at).toLocaleString() : ''}</td>
          <td>${item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : ''}</td>
          <td>${item.admin_remarks || ''}</td>
        </tr>`;
      });

      html += '</table></body></html>';

      downloadFile(html, `tasks_${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel');
      toast.success('Tasks data exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    } finally {
      setExporting(null);
    }
  };

  if (authLoading) {
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
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Export Data
          </h1>
          <p className="text-muted-foreground mt-1">
            Download intern and task data in various formats.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Export Interns */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Intern Data</CardTitle>
                  <CardDescription>Export all intern profiles and details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={exportInternsCSV}
                disabled={exporting !== null}
              >
                {exporting === 'interns-csv' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Export as CSV
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={exportInternsExcel}
                disabled={exporting !== null}
              >
                {exporting === 'interns-excel' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Export as Excel
              </Button>
            </CardContent>
          </Card>

          {/* Export Tasks */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Task Data</CardTitle>
                  <CardDescription>Export all task submissions and statuses</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={exportTasksCSV}
                disabled={exporting !== null}
              >
                {exporting === 'tasks-csv' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Export as CSV
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={exportTasksExcel}
                disabled={exporting !== null}
              >
                {exporting === 'tasks-excel' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Export as Excel
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Exported files include all available data up to the current moment. 
                For large datasets, CSV format is recommended for faster processing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
