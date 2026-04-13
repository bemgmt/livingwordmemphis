# First Admin Bootstrap

After deploying the portal and running all Supabase migrations, you need to
promote the first user to the `apostle` role so they can access the
Leadership Dashboard at `/admin/dashboard`.

## Steps

1. **Create an account** — Sign up at `/auth/signup` with the email of the
   founding admin/apostle.
2. **Confirm the email** — Click the confirmation link sent by Supabase Auth.
3. **Find the user ID** — Open the Supabase dashboard, navigate to
   **Authentication > Users**, and copy the `id` (UUID) of the new user.
4. **Promote to apostle** — Run this SQL in the Supabase **SQL Editor**:

   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<paste-uuid-here>', 'apostle')
   ON CONFLICT DO NOTHING;
   ```

5. **Log in** — Visit `/auth/login`. The member dashboard will now show a
   **Leadership Dashboard** link. From there you can promote other users to
   `staff`, `executive`, or `apostle` via the Members admin page.

## Role Hierarchy

| Role | Portal access | Admin access | Can remove members |
|------|--------------|-------------|-------------------|
| `member` | Yes | No | No |
| `ministry_leader` | Yes | No | No |
| `staff` | Yes | Yes | No |
| `executive` | Yes | Yes | Yes |
| `apostle` | Yes | Yes | Yes |
