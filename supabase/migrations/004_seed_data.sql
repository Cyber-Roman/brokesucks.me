-- Seed data: settings, staff accounts, categories, products

-- Settings (singleton)
INSERT INTO settings (store_name, currency, sit_here_markup)
SELECT 'Nordic Bakery', 'NOK', 10
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Employee: PIN 753596, password passvord
INSERT INTO employees (username, pin, password_hash)
SELECT 'employee', '753596', crypt('passvord', gen_salt('bf'))
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE pin = '753596');

-- Admin: PIN 529641, password passivordik
INSERT INTO admins (username, pin, password_hash)
SELECT 'admin', '529641', crypt('passivordik', gen_salt('bf'))
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE pin = '529641');

-- Categories
INSERT INTO categories (id, name, display_order) VALUES
  ('a0000001-0000-4000-8000-000000000001', 'Buns', 0),
  ('a0000001-0000-4000-8000-000000000002', 'Coffee', 1),
  ('a0000001-0000-4000-8000-000000000003', 'Sandwiches', 2),
  ('a0000001-0000-4000-8000-000000000004', 'Bread', 3)
ON CONFLICT (id) DO NOTHING;

-- Products (takeaway_price + sit_here_price with 10 NOK markup)
INSERT INTO products (id, name, description, image_url, category_id, sit_here_price, takeaway_price, is_available, display_order) VALUES
  ('b0000001-0000-4000-8000-000000000001', 'Cinnamon Bun', 'Warm, freshly baked with Saigon cinnamon and pearl sugar.', 'https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000001', 55, 45, true, 0),
  ('b0000001-0000-4000-8000-000000000002', 'Cardamom Knot', 'Buttery braided knot with Nordic cardamom.', 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000001', 59, 49, true, 1),
  ('b0000001-0000-4000-8000-000000000003', 'Vanilla Snail', 'Soft pastry filled with vanilla cream.', 'https://images.unsplash.com/photo-1597528662465-55ece5734101?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000001', 62, 52, true, 2),
  ('b0000001-0000-4000-8000-000000000004', 'Chocolate Bun', 'Dark chocolate chunks in a sweet brioche.', 'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000001', 59, 49, true, 3),
  ('b0000001-0000-4000-8000-000000000005', 'Cappuccino', 'Double espresso with velvety steamed milk.', 'https://images.unsplash.com/photo-1559001724-fbad036dbc9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000002', 52, 42, true, 0),
  ('b0000001-0000-4000-8000-000000000006', 'Latte', 'Smooth espresso, generous milk, light foam.', 'https://images.unsplash.com/photo-1593443320739-77f74939d0da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000002', 55, 45, true, 1),
  ('b0000001-0000-4000-8000-000000000007', 'Americano', 'Espresso lengthened with hot water.', 'https://images.unsplash.com/photo-1595485225178-457ee5893fa3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000002', 48, 38, true, 2),
  ('b0000001-0000-4000-8000-000000000008', 'Flat White', 'Strong, silky and short.', 'https://images.unsplash.com/photo-1543233604-3baca4d35513?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000002', 55, 45, true, 3),
  ('b0000001-0000-4000-8000-000000000009', 'Brie & Pear', 'Sourdough, brie, pear, honey, rocket.', 'https://images.unsplash.com/photo-1553909489-cd47e0907980?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000003', 99, 89, true, 0),
  ('b0000001-0000-4000-8000-000000000010', 'Smoked Salmon', 'Norwegian salmon, dill cream, cucumber.', 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000003', 119, 109, true, 1),
  ('b0000001-0000-4000-8000-000000000011', 'Chicken Club', 'Roast chicken, bacon, avocado, lettuce.', 'https://images.unsplash.com/photo-1540713434306-58505cf1b6fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000003', 105, 95, true, 2),
  ('b0000001-0000-4000-8000-000000000012', 'Caprese', 'Mozzarella, tomato, basil, olive oil.', 'https://images.unsplash.com/photo-1655279562015-047c3da9a271?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000003', 95, 85, true, 3),
  ('b0000001-0000-4000-8000-000000000013', 'Sourdough Loaf', 'Slow-fermented, crisp crust, open crumb.', 'https://images.unsplash.com/photo-1559811814-e2c57b5e69df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000004', 75, 65, true, 0),
  ('b0000001-0000-4000-8000-000000000014', 'Rye Bread', 'Dense Nordic rye with seeds.', 'https://images.unsplash.com/photo-1613396874083-2d5fbe59ae79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000004', 69, 59, true, 1),
  ('b0000001-0000-4000-8000-000000000015', 'Country Loaf', 'Rustic country bread, perfect everyday.', 'https://images.unsplash.com/photo-1549413468-cd78edb7e75c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000004', 65, 55, true, 2),
  ('b0000001-0000-4000-8000-000000000016', 'Seeded Baguette', 'Crisp baguette topped with sesame and poppy.', 'https://images.unsplash.com/photo-1590301157172-7ba48dd1c2b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'a0000001-0000-4000-8000-000000000004', 59, 49, true, 3)
ON CONFLICT (id) DO NOTHING;

-- Initialize today's analytics
SELECT refresh_analytics_for_date(CURRENT_DATE);
