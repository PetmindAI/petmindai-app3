/*
  # Create Pets, Orders, and Chat Tables

  1. New Tables
    - `pets`
      - `id` (uuid, primary key) - Unique pet identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `name` (text) - Pet name
      - `pet_type` (text) - Type: dog or cat
      - `breed` (text, nullable) - Pet breed
      - `age` (integer, nullable) - Pet age in years
      - `image_url` (text, nullable) - Pet photo URL
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `orders`
      - `id` (uuid, primary key) - Unique order identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `total_amount` (numeric) - Total order amount in INR
      - `status` (text) - Order status: pending, processing, completed, cancelled
      - `payment_method` (text, nullable) - Payment method used
      - `payment_id` (text, nullable) - Payment gateway transaction ID
      - `shipping_address` (jsonb, nullable) - Shipping address details
      - `created_at` (timestamptz) - Order creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `order_items`
      - `id` (uuid, primary key) - Unique order item identifier
      - `order_id` (uuid, foreign key) - References orders
      - `product_id` (uuid, foreign key) - References products
      - `quantity` (integer) - Item quantity
      - `price` (numeric) - Price at time of purchase
      - `created_at` (timestamptz) - Creation timestamp

    - `chat_history`
      - `id` (uuid, primary key) - Unique chat message identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `message` (text) - User message
      - `response` (text) - AI response
      - `recommended_products` (jsonb, nullable) - Product recommendations as JSON array
      - `created_at` (timestamptz) - Message timestamp

  2. Security
    - Enable RLS on all tables
    - Users can only access their own pets, orders, and chat history
    - Products referenced in order_items are publicly readable

  3. Indexes
    - Add indexes on foreign keys for better query performance
    - Add indexes on user_id columns for faster user data retrieval
    - Add index on order status for admin filtering
*/

-- ============================================
-- CREATE PETS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  pet_type text NOT NULL CHECK (pet_type IN ('dog', 'cat')),
  breed text,
  age integer CHECK (age >= 0 AND age <= 50),
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pets
CREATE POLICY "Users can view own pets"
  ON pets FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own pets"
  ON pets FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own pets"
  ON pets FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own pets"
  ON pets FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);

-- ============================================
-- CREATE ORDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  payment_method text,
  payment_id text,
  shipping_address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admin users can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );

CREATE POLICY "Admin users can update all orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- CREATE ORDER ITEMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admin users can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- CREATE CHAT HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  response text NOT NULL,
  recommended_products jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_history
CREATE POLICY "Users can view own chat history"
  ON chat_history FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own chat history"
  ON chat_history FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own chat history"
  ON chat_history FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);

-- ============================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- ============================================

-- Pets trigger
DROP TRIGGER IF EXISTS update_pets_updated_at ON pets;
CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Orders trigger
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();