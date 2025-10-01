-- Delete three test orders
DELETE FROM orders 
WHERE order_number IN ('5706987', '3103863', '1779255');