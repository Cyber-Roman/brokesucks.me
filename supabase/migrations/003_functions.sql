-- RPC Functions (SECURITY DEFINER)

-- ---------------------------------------------------------------------------
-- Session helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_staff_session(p_token TEXT, p_role TEXT)
RETURNS UUID AS $$
DECLARE
  v_staff_id UUID;
BEGIN
  IF p_token IS NULL OR p_token = '' THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;

  DELETE FROM staff_sessions WHERE expires_at < now();

  SELECT staff_id INTO v_staff_id
  FROM staff_sessions
  WHERE token = p_token
    AND role = p_role
    AND expires_at > now();

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'Session expired or invalid';
  END IF;

  RETURN v_staff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Authentication
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION login_employee(p_pin TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
  v_employee employees%ROWTYPE;
  v_token TEXT;
BEGIN
  SELECT * INTO v_employee
  FROM employees
  WHERE pin = p_pin
    AND password_hash = crypt(p_password, password_hash);

  IF v_employee.id IS NULL THEN
    RAISE EXCEPTION 'Invalid PIN or password';
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO staff_sessions (role, staff_id, token)
  VALUES ('employee', v_employee.id, v_token);

  RETURN json_build_object(
    'token', v_token,
    'username', v_employee.username,
    'role', 'employee'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION login_admin(p_pin TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
  v_admin admins%ROWTYPE;
  v_token TEXT;
BEGIN
  SELECT * INTO v_admin
  FROM admins
  WHERE pin = p_pin
    AND password_hash = crypt(p_password, password_hash);

  IF v_admin.id IS NULL THEN
    RAISE EXCEPTION 'Invalid PIN or password';
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO staff_sessions (role, staff_id, token)
  VALUES ('admin', v_admin.id, v_token);

  RETURN json_build_object(
    'token', v_token,
    'username', v_admin.username,
    'role', 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION logout_staff(p_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM staff_sessions WHERE token = p_token;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Analytics refresh
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_analytics_for_date(p_date DATE)
RETURNS VOID AS $$
DECLARE
  v_orders_count INTEGER;
  v_revenue NUMERIC(12, 2);
  v_popular_products JSONB;
  v_popular_categories JSONB;
  v_peak_hours JSONB;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(total_price), 0)
  INTO v_orders_count, v_revenue
  FROM orders
  WHERE created_at::date = p_date;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.count DESC), '[]'::jsonb)
  INTO v_popular_products
  FROM (
    SELECT oi.product_name_snapshot AS name, SUM(oi.quantity)::int AS count
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at::date = p_date
    GROUP BY oi.product_name_snapshot
    ORDER BY count DESC
    LIMIT 10
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.count DESC), '[]'::jsonb)
  INTO v_popular_categories
  FROM (
    SELECT c.name, SUM(oi.quantity)::int AS count
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE o.created_at::date = p_date AND c.name IS NOT NULL
    GROUP BY c.name
    ORDER BY count DESC
    LIMIT 10
  ) t;

  SELECT COALESCE(jsonb_object_agg(hour_key, order_count), '{}'::jsonb)
  INTO v_peak_hours
  FROM (
    SELECT to_char(created_at, 'HH24:00') AS hour_key, COUNT(*)::int AS order_count
    FROM orders
    WHERE created_at::date = p_date
    GROUP BY to_char(created_at, 'HH24:00')
  ) h;

  INSERT INTO analytics (date, daily_orders, daily_revenue, popular_products, popular_categories, peak_hours, updated_at)
  VALUES (p_date, v_orders_count, v_revenue, v_popular_products, v_popular_categories, v_peak_hours, now())
  ON CONFLICT (date) DO UPDATE SET
    daily_orders = EXCLUDED.daily_orders,
    daily_revenue = EXCLUDED.daily_revenue,
    popular_products = EXCLUDED.popular_products,
    popular_categories = EXCLUDED.popular_categories,
    peak_hours = EXCLUDED.peak_hours,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Place order (customer)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION place_order(
  p_customer_name TEXT,
  p_order_type TEXT,
  p_items JSONB
)
RETURNS JSON AS $$
DECLARE
  v_order_id UUID;
  v_order_number INTEGER;
  v_total NUMERIC(10, 2) := 0;
  v_item JSONB;
  v_product products%ROWTYPE;
  v_price NUMERIC(10, 2);
  v_qty INTEGER;
BEGIN
  IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;

  IF p_order_type NOT IN ('sit_here', 'takeaway') THEN
    RAISE EXCEPTION 'Invalid order type';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Calculate total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::uuid;
    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;
    IF NOT v_product.is_available THEN
      RAISE EXCEPTION 'Product unavailable: %', v_product.name;
    END IF;

    v_qty := (v_item->>'quantity')::int;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;

    v_price := CASE WHEN p_order_type = 'sit_here' THEN v_product.sit_here_price ELSE v_product.takeaway_price END;
    v_total := v_total + (v_price * v_qty);
  END LOOP;

  INSERT INTO orders (customer_name, order_type, status, total_price)
  VALUES (trim(p_customer_name), p_order_type, 'new', v_total)
  RETURNING id, order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    v_price := CASE WHEN p_order_type = 'sit_here' THEN v_product.sit_here_price ELSE v_product.takeaway_price END;

    INSERT INTO order_items (order_id, product_id, quantity, price, product_name_snapshot)
    VALUES (v_order_id, v_product.id, v_qty, v_price, v_product.name);
  END LOOP;

  PERFORM refresh_analytics_for_date(CURRENT_DATE);

  RETURN json_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'customer_name', trim(p_customer_name),
    'total_price', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Order status updates (employee)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_order_status(
  p_token TEXT,
  p_order_id UUID,
  p_status TEXT
)
RETURNS JSON AS $$
DECLARE
  v_order orders%ROWTYPE;
BEGIN
  PERFORM validate_staff_session(p_token, 'employee');

  IF p_status NOT IN ('new', 'preparing', 'ready', 'completed') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  UPDATE orders
  SET
    status = p_status,
    completed_at = CASE WHEN p_status = 'completed' THEN now() ELSE completed_at END
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  PERFORM refresh_analytics_for_date(v_order.created_at::date);

  RETURN row_to_json(v_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Category CRUD (admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_upsert_category(
  p_token TEXT,
  p_id UUID,
  p_name TEXT,
  p_display_order INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_category categories%ROWTYPE;
BEGIN
  PERFORM validate_staff_session(p_token, 'admin');

  IF p_id IS NULL THEN
    INSERT INTO categories (name, display_order)
    VALUES (trim(p_name), COALESCE(p_display_order, 0))
    RETURNING * INTO v_category;
  ELSE
    UPDATE categories
    SET name = trim(p_name), display_order = COALESCE(p_display_order, display_order)
    WHERE id = p_id
    RETURNING * INTO v_category;

    IF v_category.id IS NULL THEN
      RAISE EXCEPTION 'Category not found';
    END IF;
  END IF;

  RETURN row_to_json(v_category);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION admin_delete_category(p_token TEXT, p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  PERFORM validate_staff_session(p_token, 'admin');
  DELETE FROM categories WHERE id = p_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION admin_reorder_categories(p_token TEXT, p_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
  i INTEGER;
BEGIN
  PERFORM validate_staff_session(p_token, 'admin');

  FOR i IN 1..array_length(p_ids, 1)
  LOOP
    UPDATE categories SET display_order = i - 1 WHERE id = p_ids[i];
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Product CRUD (admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_upsert_product(
  p_token TEXT,
  p_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_image_url TEXT,
  p_category_id UUID,
  p_sit_here_price NUMERIC,
  p_takeaway_price NUMERIC,
  p_is_available BOOLEAN,
  p_display_order INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_product products%ROWTYPE;
BEGIN
  PERFORM validate_staff_session(p_token, 'admin');

  IF p_id IS NULL THEN
    INSERT INTO products (name, description, image_url, category_id, sit_here_price, takeaway_price, is_available, display_order)
    VALUES (
      trim(p_name),
      COALESCE(p_description, ''),
      COALESCE(p_image_url, ''),
      p_category_id,
      p_sit_here_price,
      p_takeaway_price,
      COALESCE(p_is_available, true),
      COALESCE(p_display_order, 0)
    )
    RETURNING * INTO v_product;
  ELSE
    UPDATE products SET
      name = trim(p_name),
      description = COALESCE(p_description, description),
      image_url = COALESCE(p_image_url, image_url),
      category_id = p_category_id,
      sit_here_price = p_sit_here_price,
      takeaway_price = p_takeaway_price,
      is_available = COALESCE(p_is_available, is_available),
      display_order = COALESCE(p_display_order, display_order)
    WHERE id = p_id
    RETURNING * INTO v_product;

    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'Product not found';
    END IF;
  END IF;

  RETURN row_to_json(v_product);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION admin_delete_product(p_token TEXT, p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  PERFORM validate_staff_session(p_token, 'admin');
  DELETE FROM products WHERE id = p_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION admin_reorder_products(p_token TEXT, p_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
  i INTEGER;
BEGIN
  PERFORM validate_staff_session(p_token, 'admin');

  FOR i IN 1..array_length(p_ids, 1)
  LOOP
    UPDATE products SET display_order = i - 1 WHERE id = p_ids[i];
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Settings (admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_update_settings(
  p_token TEXT,
  p_store_name TEXT,
  p_currency TEXT,
  p_sit_here_markup NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_settings settings%ROWTYPE;
BEGIN
  PERFORM validate_staff_session(p_token, 'admin');

  UPDATE settings SET
    store_name = COALESCE(p_store_name, store_name),
    currency = COALESCE(p_currency, currency),
    sit_here_markup = COALESCE(p_sit_here_markup, sit_here_markup)
  WHERE id = (SELECT id FROM settings LIMIT 1)
  RETURNING * INTO v_settings;

  RETURN row_to_json(v_settings);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Get today's analytics
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_today_analytics()
RETURNS JSON AS $$
DECLARE
  v_row analytics%ROWTYPE;
BEGIN
  PERFORM refresh_analytics_for_date(CURRENT_DATE);

  SELECT * INTO v_row FROM analytics WHERE date = CURRENT_DATE;

  IF v_row.id IS NULL THEN
    RETURN json_build_object(
      'date', CURRENT_DATE,
      'daily_orders', 0,
      'daily_revenue', 0,
      'popular_products', '[]'::jsonb,
      'popular_categories', '[]'::jsonb,
      'peak_hours', '{}'::jsonb
    );
  END IF;

  RETURN row_to_json(v_row);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Fetch active orders with items (for dashboards)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_active_orders()
RETURNS JSON AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(order_data ORDER BY (order_data->>'created_at') DESC)
    FROM (
      SELECT json_build_object(
        'id', o.id,
        'customer_name', o.customer_name,
        'order_number', o.order_number,
        'order_type', o.order_type,
        'status', o.status,
        'total_price', o.total_price,
        'created_at', o.created_at,
        'completed_at', o.completed_at,
        'items', COALESCE((
          SELECT json_agg(json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.price,
            'product_name_snapshot', oi.product_name_snapshot
          ))
          FROM order_items oi WHERE oi.order_id = o.id
        ), '[]'::json)
      ) AS order_data
      FROM orders o
      WHERE o.status IN ('new', 'preparing', 'ready')
    ) sub
  ), '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
