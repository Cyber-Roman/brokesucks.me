-- Grant execute permissions on RPC functions to anon/authenticated roles

GRANT EXECUTE ON FUNCTION login_employee(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION login_admin(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION logout_staff(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION place_order(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_order_status(TEXT, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_active_orders() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_today_analytics() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_analytics_for_date(DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_upsert_category(TEXT, UUID, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_category(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_reorder_categories(TEXT, UUID[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_upsert_product(TEXT, UUID, TEXT, TEXT, TEXT, UUID, NUMERIC, NUMERIC, BOOLEAN, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_product(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_reorder_products(TEXT, UUID[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_settings(TEXT, TEXT, TEXT, NUMERIC) TO anon, authenticated;
