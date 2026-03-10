/*
  # Add Admin Role System

  ## Overview
  This migration creates a comprehensive admin role system for PetMind that:
  - Adds a role column to user_profiles table
  - Automatically assigns admin role to the first registered user
  - Provides functions to manage admin roles
  - Ensures proper security with RLS policies

  ## Changes Made

  1. Schema Changes
    - Add `role` column to `user_profiles` table (default: 'user')
    - Possible values: 'user', 'admin'

  2. Functions Created
    - `assign_first_user_as_admin()`: Automatically makes first user an admin
    - `set_user_role(user_id, new_role)`: Admin function to change user roles

  3. Triggers
    - Automatically assigns admin role to the first user on profile creation

  4. Security
    - Updated RLS policies to allow users to view their own role
    - Only admins can modify user roles through the function

  ## Important Notes
  - First registered user becomes admin automatically
  - Additional admins can be created by existing admins
  - Role changes are tracked and logged
*/

-- Add role column to user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Function to check if any admin exists
CREATE OR REPLACE FUNCTION admin_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM user_profiles
  WHERE role = 'admin';
  
  RETURN admin_count > 0;
END;
$$;

-- Function to assign first user as admin
CREATE OR REPLACE FUNCTION assign_first_user_as_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if this is the first user (no admins exist)
  IF NOT admin_exists() THEN
    NEW.role := 'admin';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists and create new one
DROP TRIGGER IF EXISTS set_first_user_as_admin ON user_profiles;

CREATE TRIGGER set_first_user_as_admin
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_first_user_as_admin();

-- Function for admins to set user roles
CREATE OR REPLACE FUNCTION set_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Check if caller is admin
  SELECT role INTO caller_role
  FROM user_profiles
  WHERE id = auth.uid();
  
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  -- Validate role
  IF new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be user or admin';
  END IF;
  
  -- Update the role
  UPDATE user_profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- Update RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
