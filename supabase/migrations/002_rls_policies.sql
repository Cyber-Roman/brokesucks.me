-- Row Level Security Policies

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_sessions ENABLE ROW LEVEL SECURITY;

-- Public read: menu data
CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read available products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read settings"
  ON settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Orders: public read for realtime dashboards (kiosk LAN deployment)
CREATE POLICY "Public read orders"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read order items"
  ON order_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- Analytics: public read
CREATE POLICY "Public read analytics"
  ON analytics FOR SELECT
  TO anon, authenticated
  USING (true);

-- Block direct writes — all mutations go through SECURITY DEFINER RPC functions
CREATE POLICY "No direct insert categories"
  ON categories FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update categories"
  ON categories FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete categories"
  ON categories FOR DELETE TO anon, authenticated USING (false);

CREATE POLICY "No direct insert products"
  ON products FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update products"
  ON products FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete products"
  ON products FOR DELETE TO anon, authenticated USING (false);

CREATE POLICY "No direct insert orders"
  ON orders FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update orders"
  ON orders FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete orders"
  ON orders FOR DELETE TO anon, authenticated USING (false);

CREATE POLICY "No direct insert order_items"
  ON order_items FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update order_items"
  ON order_items FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct delete order_items"
  ON order_items FOR DELETE TO anon, authenticated USING (false);

CREATE POLICY "No direct access employees"
  ON employees FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "No direct access admins"
  ON admins FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "No direct access staff_sessions"
  ON staff_sessions FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "No direct write settings"
  ON settings FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update settings"
  ON settings FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No direct write analytics"
  ON analytics FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No direct update analytics"
  ON analytics FOR UPDATE TO anon, authenticated USING (false);

-- Storage policies for product images
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated upload product images"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated update product images"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated delete product images"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'product-images');
