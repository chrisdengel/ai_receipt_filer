/*
  # Add User Profile Creation Trigger

  ## Overview
  This migration creates a database trigger that automatically creates a user profile
  in the `users` table when a new user signs up via Supabase Auth.

  ## Changes
  1. Create a trigger function that inserts into users table
  2. Add trigger on auth.users table for INSERT operations
  
  ## Security
  - Function runs with SECURITY DEFINER to bypass RLS
  - Only creates records, doesn't modify existing data
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_status, subscription_tier, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    'free',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();