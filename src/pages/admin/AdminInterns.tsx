import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Intern {
  id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  date_of_birth: string | null;
  address: string | null;
  skills: string[] | null;
  internship_domain: string | null;
  registration_step: number;
  created_at: string;
  college_details: { college_name: string; degree: string; branch: string; passing_year: number } | null;
}

export default function AdminInterns() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/login');
      else if (user.role !== 'admin') navigate('/dashboard');
      else fetchInterns();
    }
  }, [user, authLoading, navigate]);

  const fetchInterns = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select(`*, college_details (college_name, degree, branch, passing_year)`).order('created_at', { ascending: false });
      if (error) throw error;
      setInterns((data as unknown as Intern[]) || []);
    } catch (error) {
      console.error('Error fetching interns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInterns = interns.filter((intern) =>
    intern.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-3xl font-display font-bold text-foreground">Intern Management</h1></div>
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle className="text-lg font-display">All Interns</CardTitle>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterns.map((intern) => (
                  <TableRow key={intern.id}>
                    <TableCell className="font-medium">{intern.full_name}</TableCell>
                    <TableCell>{intern.email}</TableCell>
                    <TableCell>{intern.internship_domain ? <Badge variant="secondary">{intern.internship_domain}</Badge> : '—'}</TableCell>
                    <TableCell>{intern.registration_step >= 4 ? <span className="text-success flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />Complete</span> : <span className="text-warning">Step {intern.registration_step}/3</span>}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => setSelectedIntern(intern)}><Eye className="h-4 w-4 mr-1" />View</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Dialog open={!!selectedIntern} onOpenChange={() => setSelectedIntern(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Intern Profile</DialogTitle>
              <DialogDescription>{selectedIntern?.full_name}</DialogDescription>
            </DialogHeader>
            {selectedIntern && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Email</p><p>{selectedIntern.email}</p></div>
                  <div><p className="text-sm text-muted-foreground">Mobile</p><p>{selectedIntern.mobile || '—'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Domain</p><p>{selectedIntern.internship_domain || '—'}</p></div>
                </div>
                {selectedIntern.skills && <div><p className="text-sm text-muted-foreground">Skills</p><div className="flex flex-wrap gap-2 mt-1">{selectedIntern.skills.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}</div></div>}
                {selectedIntern.college_details && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">College Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-sm text-muted-foreground">College</p><p>{selectedIntern.college_details.college_name}</p></div>
                      <div><p className="text-sm text-muted-foreground">Degree</p><p>{selectedIntern.college_details.degree}</p></div>
                      <div><p className="text-sm text-muted-foreground">Branch</p><p>{selectedIntern.college_details.branch}</p></div>
                      <div><p className="text-sm text-muted-foreground">Year</p><p>{selectedIntern.college_details.passing_year}</p></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
