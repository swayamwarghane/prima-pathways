import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { saveCollegeDetails, updateRegistrationStep, assignTasksToIntern } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Building2, GraduationCap, BookOpen, CalendarDays } from 'lucide-react';

const degrees = [
  'B.Tech',
  'B.E.',
  'B.Sc',
  'BCA',
  'BBA',
  'B.Com',
  'M.Tech',
  'M.E.',
  'M.Sc',
  'MCA',
  'MBA',
  'Other',
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear + i - 4);

interface CollegeDetailsFormProps {
  onComplete: () => void;
}

export function CollegeDetailsForm({ onComplete }: CollegeDetailsFormProps) {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    collegeName: '',
    degree: '',
    branch: '',
    passingYear: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      await saveCollegeDetails(user.id, {
        college_name: formData.collegeName,
        degree: formData.degree,
        branch: formData.branch,
        passing_year: parseInt(formData.passingYear),
      });
      
      await updateRegistrationStep(user.id, 4);
      await assignTasksToIntern(user.id);
      await refreshUser();
      toast.success('Registration complete! Welcome to Prima Interns.');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save college details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 animate-fade-in">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-display">College Details</CardTitle>
        <CardDescription>
          Provide your educational background information
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collegeName">College/University Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="collegeName"
                name="collegeName"
                type="text"
                placeholder="Enter your college name"
                value={formData.collegeName}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="degree">Degree</Label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select
                value={formData.degree}
                onValueChange={(value) => setFormData(prev => ({ ...prev, degree: value }))}
                required
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select your degree" />
                </SelectTrigger>
                <SelectContent>
                  {degrees.map(degree => (
                    <SelectItem key={degree} value={degree}>
                      {degree}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch">Branch/Specialization</Label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="branch"
                name="branch"
                type="text"
                placeholder="Computer Science, Electronics, etc."
                value={formData.branch}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="passingYear">Year of Passing</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select
                value={formData.passingYear}
                onValueChange={(value) => setFormData(prev => ({ ...prev, passingYear: value }))}
                required
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select year of passing" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full gradient-primary hover:opacity-90 transition-opacity" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing Registration...
              </>
            ) : (
              'Complete Registration'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
