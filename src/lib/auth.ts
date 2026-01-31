import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'intern';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  registrationStep: number;
}

export async function signUp(email: string, password: string, fullName: string, mobile: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: fullName,
        mobile: mobile,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, registration_step')
    .eq('id', user.id)
    .maybeSingle();

  // Get user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email || '',
    role: (roleData?.role as UserRole) || 'intern',
    fullName: profile?.full_name || 'User',
    registrationStep: profile?.registration_step || 1,
  };
}

export async function updateRegistrationStep(userId: string, step: number) {
  const { error } = await supabase
    .from('profiles')
    .update({ registration_step: step })
    .eq('id', userId);

  if (error) throw error;
}

export async function updateProfile(userId: string, data: {
  mobile?: string;
  date_of_birth?: string;
  address?: string;
  skills?: string[];
  internship_domain?: string;
}) {
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId);

  if (error) throw error;
}

export async function saveCollegeDetails(profileId: string, data: {
  college_name: string;
  degree: string;
  branch: string;
  passing_year: number;
}) {
  const { error } = await supabase
    .from('college_details')
    .upsert({
      profile_id: profileId,
      ...data,
    });

  if (error) throw error;
}

export async function assignTasksToIntern(internId: string) {
  const { error } = await supabase.rpc('assign_tasks_to_intern', {
    _intern_id: internId,
  });

  if (error) throw error;
}
