/*
  # Create products table for PetMind AI marketplace

  1. New Tables
    - `products`
      - `id` (uuid, primary key) - Unique product identifier
      - `name` (text) - Product name
      - `category` (text) - Product category (Dog Food, Cat Food, Pet Toys)
      - `price` (numeric) - Product price in INR
      - `description` (text) - Product description
      - `image_url` (text) - URL to product image
      - `stock` (integer) - Available stock quantity
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `products` table
    - Add policy for anyone to read products (public marketplace)
    - Add policy for authenticated users to insert/update/delete (admin functionality)

  3. Notes
    - All prices are stored in Indian Rupees (INR)
    - Categories include: Dog Food, Cat Food, Pet Toys
    - Stock tracking enabled for inventory management
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  description text NOT NULL,
  image_url text NOT NULL,
  stock integer DEFAULT 0 CHECK (stock >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster category queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Insert sample products
INSERT INTO products (name, category, price, description, image_url, stock) VALUES
  ('Premium Dog Food 5kg', 'Dog Food', 999, 'High-quality nutrition for your furry friend with real chicken and vegetables', 'https://images.pexels.com/photos/1482193/pexels-photo-1482193.jpeg?auto=compress&cs=tinysrgb&w=600', 50),
  ('Cat Salmon Treats', 'Cat Food', 299, 'Delicious salmon treats that cats love, packed with omega-3', 'https://images.pexels.com/photos/1276553/pexels-photo-1276553.jpeg?auto=compress&cs=tinysrgb&w=600', 100),
  ('Interactive Ball Toy', 'Pet Toys', 199, 'Keeps your pet entertained for hours with automatic rolling action', 'https://images.pexels.com/photos/4587998/pexels-photo-4587998.jpeg?auto=compress&cs=tinysrgb&w=600', 75),
  ('Organic Cat Food 3kg', 'Cat Food', 899, 'Grain-free organic food for sensitive cats', 'https://images.pexels.com/photos/1359307/pexels-photo-1359307.jpeg?auto=compress&cs=tinysrgb&w=600', 30),
  ('Puppy Training Treats', 'Dog Food', 249, 'Soft training treats perfect for puppies and small dogs', 'https://images.pexels.com/photos/3687957/pexels-photo-3687957.jpeg?auto=compress&cs=tinysrgb&w=600', 120),
  ('Catnip Mouse Toy', 'Pet Toys', 149, 'Plush mouse toy filled with premium catnip', 'https://images.pexels.com/photos/3844790/pexels-photo-3844790.jpeg?auto=compress&cs=tinysrgb&w=600', 200),
  ('Dog Dental Chew Sticks', 'Dog Food', 399, 'Promote healthy teeth and fresh breath', 'https://images.pexels.com/photos/5745188/pexels-photo-5745188.jpeg?auto=compress&cs=tinysrgb&w=600', 80),
  ('Cat Scratching Post', 'Pet Toys', 799, 'Durable sisal scratching post to save your furniture', 'https://images.pexels.com/photos/4587955/pexels-photo-4587955.jpeg?auto=compress&cs=tinysrgb&w=600', 40),
  ('Dog Rope Toy Set', 'Pet Toys', 299, 'Set of 3 durable rope toys for tug and fetch', 'https://images.pexels.com/photos/5255271/pexels-photo-5255271.jpeg?auto=compress&cs=tinysrgb&w=600', 90),
  ('Premium Kitten Food', 'Cat Food', 699, 'Complete nutrition for growing kittens', 'https://images.pexels.com/photos/2071882/pexels-photo-2071882.jpeg?auto=compress&cs=tinysrgb&w=600', 60),
  ('Dog Chew Bone Large', 'Pet Toys', 349, 'Long-lasting chew bone for aggressive chewers', 'https://images.pexels.com/photos/8473523/pexels-photo-8473523.jpeg?auto=compress&cs=tinysrgb&w=600', 70),
  ('Senior Dog Food 4kg', 'Dog Food', 1299, 'Specially formulated for senior dogs with joint support', 'https://images.pexels.com/photos/3726314/pexels-photo-3726314.jpeg?auto=compress&cs=tinysrgb&w=600', 45)
ON CONFLICT DO NOTHING;