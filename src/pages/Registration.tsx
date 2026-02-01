import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RegistrationProgress } from '@/components/registration/RegistrationProgress';
import { PersonalDetailsForm } from '@/components/registration/PersonalDetailsForm';
import { CollegeDetailsForm } from '@/components/registration/CollegeDetailsForm';
import { GraduationCap, Loader2 } from 'lucide-react';

export default function Registration() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    // Already completed registration
    if (!loading && user && user.registrationStep >= 4) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-surface">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.registrationStep >= 4) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-surface">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleStepComplete = () => {
    // Refresh will happen in the form components
  };

  // Determine which step to show - step 1 means account created, show personal details (step 2 form)
  // We treat step 1 as needing to complete personal details
  const currentFormStep = user.registrationStep <= 1 ? 2 : user.registrationStep;

  return (
    <div className="min-h-screen gradient-surface py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-hero rounded-xl flex items-center justify-center shadow-elevated">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Prima Interns</h1>
              <p className="text-sm text-muted-foreground">Complete Your Registration</p>
            </div>
          </div>
        </div>

        <RegistrationProgress currentStep={currentFormStep} totalSteps={3} />

        <div className="mt-6">
          {currentFormStep === 2 && (
            <PersonalDetailsForm onComplete={handleStepComplete} />
          )}
          {currentFormStep === 3 && (
            <CollegeDetailsForm onComplete={handleStepComplete} />
          )}
        </div>
      </div>
    </div>
  );
}
