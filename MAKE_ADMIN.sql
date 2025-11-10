-- Make rwenzo053@gmail.com an admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'rwenzo053@gmail.com';

-- Verify the update
SELECT id, name, email, role FROM users WHERE email = 'rwenzo053@gmail.com';
