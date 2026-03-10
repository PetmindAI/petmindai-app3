/*
  # Veterinary Marketplace Feature

  1. New Tables
    - `vets`
      - `id` (uuid, primary key) - Unique identifier for each vet
      - `vet_name` (text) - Name of the veterinarian
      - `clinic_name` (text) - Name of the clinic
      - `specialization` (text) - Area of specialization
      - `experience_years` (integer) - Years of experience
      - `address` (text) - Full address
      - `city` (text) - City location
      - `latitude` (numeric) - Latitude for location mapping
      - `longitude` (numeric) - Longitude for location mapping
      - `consultation_fee` (numeric) - Fee for consultation
      - `rating` (numeric) - Average rating (0-5)
      - `total_reviews` (integer) - Total number of reviews
      - `phone` (text) - Contact phone number
      - `email` (text) - Contact email
      - `availability` (text) - Availability information
      - `is_approved` (boolean) - Admin approval status
      - `user_id` (uuid) - Reference to auth.users for vet login
      - `created_at` (timestamptz) - Creation timestamp

    - `vet_reviews`
      - `id` (uuid, primary key) - Unique identifier for each review
      - `vet_id` (uuid) - Reference to vets table
      - `user_id` (uuid) - Reference to auth.users
      - `rating` (integer) - Rating (1-5)
      - `review_text` (text) - Review content
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on both tables
    - Public can read approved vets
    - Authenticated users can create reviews
    - Vets can update their own profiles
    - Admins can approve/edit vets
*/

-- Create vets table
CREATE TABLE IF NOT EXISTS vets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_name text NOT NULL,
  clinic_name text NOT NULL,
  specialization text DEFAULT '',
  experience_years integer DEFAULT 0,
  address text DEFAULT '',
  city text DEFAULT '',
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  consultation_fee numeric DEFAULT 0,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  phone text DEFAULT '',
  email text DEFAULT '',
  availability text DEFAULT 'Mon-Fri: 9AM-6PM',
  is_approved boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create vet_reviews table
CREATE TABLE IF NOT EXISTS vet_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_id uuid REFERENCES vets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_reviews ENABLE ROW LEVEL SECURITY;

-- Vets table policies
CREATE POLICY "Anyone can view approved vets"
  ON vets FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Authenticated users can create vet profiles"
  ON vets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vets can update own profiles"
  ON vets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all vets"
  ON vets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any vet"
  ON vets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete vets"
  ON vets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Vet reviews policies
CREATE POLICY "Anyone can view reviews"
  ON vet_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON vet_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON vet_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON vet_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vets_city ON vets(city);
CREATE INDEX IF NOT EXISTS idx_vets_rating ON vets(rating DESC);
CREATE INDEX IF NOT EXISTS idx_vets_approved ON vets(is_approved);
CREATE INDEX IF NOT EXISTS idx_vets_user_id ON vets(user_id);
CREATE INDEX IF NOT EXISTS idx_vet_reviews_vet_id ON vet_reviews(vet_id);
CREATE INDEX IF NOT EXISTS idx_vet_reviews_user_id ON vet_reviews(user_id);

-- Function to update vet rating after review
CREATE OR REPLACE FUNCTION update_vet_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vets
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM vet_reviews
      WHERE vet_id = COALESCE(NEW.vet_id, OLD.vet_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM vet_reviews
      WHERE vet_id = COALESCE(NEW.vet_id, OLD.vet_id)
    )
  WHERE id = COALESCE(NEW.vet_id, OLD.vet_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update vet rating when review is added/updated/deleted
DROP TRIGGER IF EXISTS update_vet_rating_trigger ON vet_reviews;
CREATE TRIGGER update_vet_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON vet_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_vet_rating();

-- Insert sample vets for testing
INSERT INTO vets (vet_name, clinic_name, specialization, experience_years, address, city, latitude, longitude, consultation_fee, rating, total_reviews, phone, email, is_approved)
VALUES 
  ('Dr. Sarah Johnson', 'Happy Paws Veterinary Clinic', 'General Practice', 8, '123 Main Street', 'Mumbai', 19.0760, 72.8777, 500, 4.8, 0, '+91-9876543210', 'sarah@happypaws.com', true),
  ('Dr. Rajesh Kumar', 'Pet Care Center', 'Surgery', 12, '456 Park Avenue', 'Delhi', 28.7041, 77.1025, 800, 4.9, 0, '+91-9876543211', 'rajesh@petcare.com', true),
  ('Dr. Priya Sharma', 'Animal Hospital', 'Dermatology', 6, '789 Lake Road', 'Bangalore', 12.9716, 77.5946, 600, 4.7, 0, '+91-9876543212', 'priya@animalhospital.com', true),
  ('Dr. Amit Patel', 'Veterinary Wellness', 'Emergency Care', 10, '321 Garden Street', 'Pune', 18.5204, 73.8567, 700, 4.6, 0, '+91-9876543213', 'amit@vetwellness.com', true),
  ('Dr. Neha Gupta', 'Furry Friends Clinic', 'Dentistry', 5, '654 River View', 'Hyderabad', 17.3850, 78.4867, 550, 4.5, 0, '+91-9876543214', 'neha@furryfriends.com', true);
