-- Create trigger to filter profanity on arena messages
DROP TRIGGER IF EXISTS filter_arena_message_profanity ON public.arena_messages;
CREATE TRIGGER filter_arena_message_profanity
BEFORE INSERT OR UPDATE ON public.arena_messages
FOR EACH ROW
EXECUTE FUNCTION public.filter_message_profanity();

-- Create trigger to filter profanity on crew messages
DROP TRIGGER IF EXISTS filter_crew_message_profanity ON public.crew_messages;
CREATE TRIGGER filter_crew_message_profanity
BEFORE INSERT OR UPDATE ON public.crew_messages
FOR EACH ROW
EXECUTE FUNCTION public.filter_message_profanity();

-- Add RLS policy for dev/admin to delete arena messages
DROP POLICY IF EXISTS "Authority can delete arena messages" ON public.arena_messages;
CREATE POLICY "Authority can delete arena messages"
ON public.arena_messages
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'judge') OR 
  public.has_role(auth.uid(), 'dev')
);

-- Add RLS policy for dev/admin to delete crew messages
DROP POLICY IF EXISTS "Authority can delete crew messages" ON public.crew_messages;
CREATE POLICY "Authority can delete crew messages"
ON public.crew_messages
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'judge') OR 
  public.has_role(auth.uid(), 'dev')
);

-- Add RLS policy for dev/admin to update profiles (for banning)
DROP POLICY IF EXISTS "Authority can update any profile" ON public.profiles;
CREATE POLICY "Authority can update any profile"
ON public.profiles
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'dev')
);