-- Drop the existing policy for viewing orders
DROP POLICY IF EXISTS "Allow authenticated users to view orders" ON orders;

-- Create updated policy that filters out specific shops for specific user
CREATE POLICY "Allow authenticated users to view orders" 
ON orders 
FOR SELECT 
USING (
  auth.role() = 'authenticated'::text 
  AND (
    -- If not the restricted user, show all orders
    auth.uid() != '3338709d-0620-4384-8705-f6b4e9bf8be6'::uuid
    OR
    -- If the restricted user, hide orders from specific shops
    (
      auth.uid() = '3338709d-0620-4384-8705-f6b4e9bf8be6'::uuid
      AND shop_id NOT IN (
        'a1d00154-5abc-4d59-8adc-2a26ab3ea0cc'::uuid,
        '53c94ca7-9d7b-49fa-9e28-cd727ebb82ac'::uuid
      )
    )
  )
);