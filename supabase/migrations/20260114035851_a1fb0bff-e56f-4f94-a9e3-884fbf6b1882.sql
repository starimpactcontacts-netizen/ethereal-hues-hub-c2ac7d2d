-- Allow admins and devs to delete event participations (for removing invalid/stolen submissions)
CREATE POLICY "Admins can delete participations" 
ON public.event_participations 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));