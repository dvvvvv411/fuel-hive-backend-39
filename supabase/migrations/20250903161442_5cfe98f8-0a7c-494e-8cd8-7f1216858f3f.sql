-- Remove specific orders by order number
DELETE FROM orders 
WHERE order_number IN ('8289089', '5276987', '5314594');