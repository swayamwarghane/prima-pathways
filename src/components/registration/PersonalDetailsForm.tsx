import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { updateProfile, updateRegistrationStep } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Calendar, MapPin, Briefcase, Sparkles } from 'lucide-react';

const internshipDomains = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'UI/UX Design',
  'Cloud Computing',
  'Cybersecurity',
  'DevOps',
  'Marketing',
  'Content Writing',
  'Business Analysis',
  'Project Management',
];

interface PersonalDetailsFormProps {
  onComplete: () => void;
}

export function PersonalDetailsForm({ onComplete }: PersonalDetailsFormProps) {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    address: '',
    skills: '',
    internshipDomain: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      await updateProfile(user.id, {
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        internship_domain: formData.internshipDomain,
      });
      
      await updateRegistrationStep(user.id, 3);
      await refreshUser();
      toast.success('Personal details saved!');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 animate-fade-in">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-display">Personal Details</CardTitle>
        <CardDescription>
          Tell us more about yourself and your interests
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="address"
                name="address"
                placeholder="Enter your full address"
                value={formData.address}
                onChange={handleChange}
                className="pl-10 min-h-[80px]"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma separated)</Label>
            <div className="relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="skills"
                name="skills"
                type="text"
                placeholder="JavaScript, Python, React, etc."
                value={formData.skills}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="internshipDomain">Internship Domain</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select
                value={formData.internshipDomain}
                onValueChange={(value) => setFormData(prev => ({ ...prev, internshipDomain: value }))}
                required
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select your internship domain" />
                </SelectTrigger>
                <SelectContent>
                  {internshipDomains.map(domain => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
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
                Saving...
              </>
            ) : (
              'Continue to College Details'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
