
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'author');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'author',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles RLS: everyone can read profiles (needed for user list), only self or admin can update
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR id = auth.uid());

-- User roles RLS: only admins can manage roles
CREATE POLICY "Roles viewable by authenticated users"
  ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'author');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();

-- Update blog_posts RLS to be role-aware
-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow delete blog posts" ON public.blog_posts;

-- Add user_id column to blog_posts for author ownership
ALTER TABLE public.blog_posts ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- New role-aware policies for blog_posts
CREATE POLICY "Authenticated users can insert posts"
  ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authors can update own posts, editors/admins can update all"
  ON public.blog_posts FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'editor')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Authors can delete own posts, editors/admins can delete all"
  ON public.blog_posts FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'editor')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Update media RLS to be role-aware
DROP POLICY IF EXISTS "Allow insert media files" ON public.media_files;
DROP POLICY IF EXISTS "Allow update media files" ON public.media_files;
DROP POLICY IF EXISTS "Allow delete media files" ON public.media_files;

CREATE POLICY "Editors and admins can insert media"
  ON public.media_files FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'editor')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Editors and admins can update media"
  ON public.media_files FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'editor')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Editors and admins can delete media"
  ON public.media_files FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'editor')
    OR public.has_role(auth.uid(), 'admin')
  );
