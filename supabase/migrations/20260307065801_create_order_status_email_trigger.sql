/*
  # Create Order Status Email Trigger

  1. Overview
    - Automatically sends email notifications when order status changes
    - Triggers on specific status updates: processing, shipped, delivered
    - Calls the send-order-status-email edge function

  2. Components
    - Trigger function: notify_order_status_change()
    - Trigger: order_status_update_trigger
    - Attached to: orders table

  3. Behavior
    - Fires AFTER UPDATE on orders table
    - Only triggers when status column changes
    - Sends email with order details and customer information
    
  4. Security
    - Function runs with SECURITY DEFINER privileges
    - Uses service role to call edge function
*/

-- Create function to send order status emails
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  product_names_array TEXT[];
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Only send emails for these status changes
  IF NEW.status NOT IN ('processing', 'shipped', 'delivered') THEN
    RETURN NEW;
  END IF;

  -- Only proceed if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get product names from order items
  SELECT ARRAY_AGG(p.name)
  INTO product_names_array
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = NEW.id;

  -- Get Supabase configuration
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Call the edge function asynchronously using pg_net if available
  -- If pg_net is not available, this will fail gracefully
  BEGIN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-order-status-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'order_id', NEW.id,
        'customer_email', NEW.customer_email,
        'customer_name', NEW.customer_name,
        'status', NEW.status,
        'product_names', product_names_array,
        'total_amount', NEW.total_amount
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the update
      RAISE WARNING 'Failed to send order status email: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS order_status_update_trigger ON orders;

-- Create trigger for order status updates
CREATE TRIGGER order_status_update_trigger
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();
