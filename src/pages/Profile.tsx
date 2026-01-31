import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, Building2, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  date_of_birth: string | null;
  address: string | null;
  skills: string[] | null;
  internship_domain: string | null;
  created_at: string;
  college_details: {
    college_name: string;
    degree: string;
    branch: string;
    passing_year: number;
  } | null;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else {
        fetchProfile();
      }
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`*, college_details (college_name, degree, branch, passing_year)`)
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setProfile(data as unknown as ProfileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
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

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const collegeDetails = profile.college_details;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">View your profile information.</p>
        </div>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{profile.mobile || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Internship Domain</p>
                  <p className="font-medium">{profile.internship_domain || '—'}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.length ? profile.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary">{skill}</Badge>
                )) : <span className="text-muted-foreground">No skills added</span>}
              </div>
            </div>
          </CardContent>
        </Card>
        {collegeDetails && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-display">College Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div><p className="text-sm text-muted-foreground">College</p><p className="font-medium">{collegeDetails.college_name}</p></div>
                <div><p className="text-sm text-muted-foreground">Degree</p><p className="font-medium">{collegeDetails.degree}</p></div>
                <div><p className="text-sm text-muted-foreground">Branch</p><p className="font-medium">{collegeDetails.branch}</p></div>
                <div><p className="text-sm text-muted-foreground">Passing Year</p><p className="font-medium">{collegeDetails.passing_year}</p></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
