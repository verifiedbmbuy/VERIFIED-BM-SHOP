-- Add provider column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'email';

-- Update the handle_new_user trigger to capture auth provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'author');
  
  RETURN NEW;
END;
$$;