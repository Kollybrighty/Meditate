-- Fix profile auto-create trigger (signup was failing with "Database error saving new user")
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, church)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'username', ''),
      split_part(COALESCE(NEW.email, 'user'), '@', 1)
    ),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'User'),
    NEW.raw_user_meta_data->>'church'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
