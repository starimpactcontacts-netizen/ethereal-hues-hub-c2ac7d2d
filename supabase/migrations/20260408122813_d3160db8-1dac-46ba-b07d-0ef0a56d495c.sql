DROP POLICY IF EXISTS "Users can view own applications" ON public.cash_battle_applications;

CREATE POLICY "Users can view own or open cash battle applications"
ON public.cash_battle_applications
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR status = 'pending'
);

DROP POLICY IF EXISTS "Admins can view all applications" ON public.cash_battle_applications;

CREATE POLICY "Admins can view all applications"
ON public.cash_battle_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create own applications" ON public.cash_battle_applications;

CREATE POLICY "Users can create own applications"
ON public.cash_battle_applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND agreed_to_terms = true);

DROP POLICY IF EXISTS "Admins can update applications" ON public.cash_battle_applications;

CREATE POLICY "Admins can update applications"
ON public.cash_battle_applications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own cash battle application"
ON public.cash_battle_applications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);