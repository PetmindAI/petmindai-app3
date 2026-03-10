/*
  # Fix Security Issues for Products Table

  1. Security Improvements
    - Remove overly permissive RLS policies that allow unrestricted access
    - Implement proper role-based access control
    - Create admin role check for product management
    - Keep public read access for marketplace functionality
  
  2. Performance Optimization
    - Remove unused category index
  
  3. Changes
    - Drop existing overly permissive policies
    - Create new restrictive policies with proper authentication checks
    - Add admin role verification using app_metadata
    - Remove idx_products_category index (unused)
  
  4. Security Model
    - Anyone (including anonymous) can view products (marketplace requirement)
    - Only authenticated users with admin role can insert/update/delete products
    - Admin role is stored in user metadata for verification
*/

-- Drop unused index
DROP INDEX IF EXISTS idx_products_category;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;

-- Create secure policies with proper admin role checking
-- Only users with admin role in app_metadata can modify products

CREATE POLICY "Admin users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'role' = 'admin') OR
    (auth.jwt()->'app_metadata'->>'role' = 'admin')
  );

CREATE POLICY "Admin users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'role' = 'admin') OR
    (auth.jwt()->'app_metadata'->>'role' = 'admin')
  )
  WITH CHECK (
    (auth.jwt()->>'role' = 'admin') OR
    (auth.jwt()->'app_metadata'->>'role' = 'admin')
  );

CREATE POLICY "Admin users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'role' = 'admin') OR
    (auth.jwt()->'app_metadata'->>'role' = 'admin')
  );