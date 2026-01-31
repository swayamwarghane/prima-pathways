-- Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'intern');

-- Create profiles table for intern personal details (Step 1 & 2 data)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  mobile TEXT,
  date_of_birth DATE,
  address TEXT,
  skills TEXT[],
  internship_domain TEXT,
  registration_step INTEGER DEFAULT 1 CHECK (registration_step >= 1 AND registration_step <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create college_details table (Step 3 data)
CREATE TABLE public.college_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  college_name TEXT NOT NULL,
  degree TEXT NOT NULL,
  branch TEXT NOT NULL,
  passing_year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Create user_roles table for RBAC (separate from profiles as per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'intern',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create tasks table for task definitions
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_title TEXT NOT NULL,
  task_description TEXT NOT NULL,
  task_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_status enum
CREATE TYPE public.task_status AS ENUM ('locked', 'in_progress', 'submitted', 'approved', 'rejected');

-- Create intern_tasks table for tracking task progress
CREATE TABLE public.intern_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  status public.task_status NOT NULL DEFAULT 'locked',
  submission_content TEXT,
  admin_remarks TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(intern_id, task_id)
);

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_college_details_updated_at
  BEFORE UPDATE ON public.college_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_intern_tasks_updated_at
  BEFORE UPDATE ON public.intern_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_tasks ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- College Details RLS Policies
CREATE POLICY "Users can view their own college details"
  ON public.college_details FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own college details"
  ON public.college_details FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own college details"
  ON public.college_details FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

-- User Roles RLS Policies
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Tasks RLS Policies (all authenticated users can view tasks)
CREATE POLICY "All authenticated users can view tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Intern Tasks RLS Policies
CREATE POLICY "Users can view their own task progress"
  ON public.intern_tasks FOR SELECT
  TO authenticated
  USING (intern_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own task progress"
  ON public.intern_tasks FOR INSERT
  TO authenticated
  WITH CHECK (intern_id = auth.uid());

CREATE POLICY "Users can update their own task progress"
  ON public.intern_tasks FOR UPDATE
  TO authenticated
  USING (intern_id = auth.uid() OR public.is_admin(auth.uid()));

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, registration_step)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 1);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'intern');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to assign tasks to new intern
CREATE OR REPLACE FUNCTION public.assign_tasks_to_intern(_intern_id UUID)
RETURNS VOID AS $$
DECLARE
  _task RECORD;
  _first_task BOOLEAN := true;
BEGIN
  FOR _task IN SELECT id FROM public.tasks ORDER BY task_order ASC
  LOOP
    INSERT INTO public.intern_tasks (intern_id, task_id, status)
    VALUES (
      _intern_id, 
      _task.id, 
      CASE WHEN _first_task THEN 'in_progress'::public.task_status ELSE 'locked'::public.task_status END
    );
    _first_task := false;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert default tasks
INSERT INTO public.tasks (task_title, task_description, task_order) VALUES
  ('Introduction Task', 'Write a brief introduction about yourself including your background, interests, and what you hope to learn during this internship. Include your career goals and how this internship aligns with them.', 1),
  ('Research Assignment', 'Research and summarize the key aspects of our company''s products/services. Prepare a 500-word summary highlighting the main features, target audience, and competitive advantages.', 2),
  ('Skills Assessment', 'Complete the technical skills assessment relevant to your internship domain. Document your proficiency levels and areas where you would like to improve during the internship.', 3),
  ('Project Proposal', 'Propose a small project that you would like to work on during your internship. Include objectives, methodology, timeline, and expected outcomes. This should align with your internship domain.', 4),
  ('Final Presentation', 'Prepare and deliver a final presentation summarizing your internship experience, key learnings, projects completed, and recommendations for future interns.', 5);