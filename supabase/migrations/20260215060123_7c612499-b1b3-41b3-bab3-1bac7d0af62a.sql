
-- When a user is deleted, reassign their blog posts to a system/anonymous author instead of orphaning
CREATE OR REPLACE FUNCTION public.reassign_posts_on_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.blog_posts
  SET user_id = NULL, author = 'Anonymous'
  WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to profiles table (which cascades from auth.users deletion)
CREATE TRIGGER reassign_posts_before_profile_delete
BEFORE DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.reassign_posts_on_user_delete();
