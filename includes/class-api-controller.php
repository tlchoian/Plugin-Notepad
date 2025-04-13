<?php
/**
 * Class quản lý API
 */
class SNSP_API_Controller {
    
    // Đăng ký các routes
    public static function register_routes() {
        // Endpoint lấy danh sách notepad
        register_rest_route('secure-notepad-pro/v1', '/list', array(
            'methods' => 'GET',
            'callback' => array('SNSP_API_Controller', 'get_notepad_list'),
            'permission_callback' => array('SNSP_API_Controller', 'check_user_logged_in')
        ));
        
        // Endpoint lấy một notepad cụ thể
        register_rest_route('secure-notepad-pro/v1', '/get/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array('SNSP_API_Controller', 'get_single_notepad'),
            'permission_callback' => array('SNSP_API_Controller', 'check_user_logged_in')
        ));
        
        // Endpoint tạo notepad mới
        register_rest_route('secure-notepad-pro/v1', '/create', array(
            'methods' => 'POST',
            'callback' => array('SNSP_API_Controller', 'create_notepad'),
            'permission_callback' => array('SNSP_API_Controller', 'check_user_logged_in')
        ));
        
        // Endpoint cập nhật notepad
        register_rest_route('secure-notepad-pro/v1', '/update/(?P<id>\d+)', array(
            'methods' => 'POST',
            'callback' => array('SNSP_API_Controller', 'update_notepad'),
            'permission_callback' => array('SNSP_API_Controller', 'check_user_logged_in')
        ));
        
        // Endpoint xóa notepad
        register_rest_route('secure-notepad-pro/v1', '/delete/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array('SNSP_API_Controller', 'delete_notepad'),
            'permission_callback' => array('SNSP_API_Controller', 'check_user_logged_in')
        ));
        
        // Endpoint chia sẻ notepad
        register_rest_route('secure-notepad-pro/v1', '/share/(?P<id>\d+)', array(
            'methods' => 'POST',
            'callback' => array('SNSP_API_Controller', 'share_notepad'),
            'permission_callback' => array('SNSP_API_Controller', 'check_user_logged_in')
        ));
        
        // Endpoint hủy chia sẻ notepad
        register_rest_route('secure-notepad-pro/v1', '/unshare/(?P<id>\d+)', array(
            'methods' => 'POST',
            'callback' => array('SNSP_API_Controller', 'unshare_notepad'),
            'permission_callback' => array('SNSP_API_Controller', 'check_user_logged_in')
        ));
        
        // Endpoint lấy danh sách notepad được chia sẻ
        register_rest_route('secure-notepad-pro/v1', '/shared-with-me', array(
            'methods' => 'GET',
            'callback' => array('SNSP_API_Controller', 'get_shared_notepads'),
            'permission_callback' => array('SNSP_API_Controller', 'check_user_logged_in')
        ));
        
        // Endpoint tìm kiếm người dùng
        register_rest_route('secure-notepad-pro/v1', '/search-users', array(
            'methods' => 'GET',
            'callback' => array('SNSP_API_Controller', 'search_users'),
            'permission_callback' => array('SNSP_API_Controller', 'check_user_logged_in')
        ));
        
        // Endpoint đánh dấu yêu thích
        register_rest_route('secure-notepad-pro/v1', '/toggle-favorite/(?P<id>\d+)', array(
            'methods' => 'POST',
            'callback' => array('SNSP_API_Controller', 'toggle_favorite'),
            'permission_callback' => array('SNSP_API_Controller', 'check_user_logged_in')
        ));
        
        // Endpoint cập nhật thời gian hết hạn
        register_rest_route('secure-notepad-pro/v1', '/set-expiry/(?P<id>\d+)', array(
            'methods' => 'POST',
            'callback' => array('SNSP_API_Controller', 'set_notepad_expiry'),
            'permission_callback' => array('SNSP_API_Controller', 'check_user_logged_in')
        ));
    }
    
    // Kiểm tra xem người dùng đã đăng nhập chưa
    public static function check_user_logged_in() {
        return is_user_logged_in();
    }
    
    // Lấy danh sách notepad
    public static function get_notepad_list() {
        if (!is_user_logged_in()) {
            return new WP_Error('not_logged_in', 'Bạn phải đăng nhập để sử dụng tính năng này', array('status' => 401));
        }
        
        global $wpdb;
        $table_notepads = $wpdb->prefix . 'secure_notepads_pro';
        $user_id = get_current_user_id();
        
        $notepads = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, title, created_at, updated_at, expires_at, is_favorite 
                FROM $table_notepads 
                WHERE user_id = %d 
                ORDER BY is_favorite DESC, updated_at DESC",
                $user_id
            )
        );
        
        return array(
            'success' => true,
            'notepads' => $notepads
        );
    }
    
    // Lấy một notepad cụ thể
    public static function get_single_notepad($request) {
        if (!is_user_logged_in()) {
            return new WP_Error('not_logged_in', 'Bạn phải đăng nhập để sử dụng tính năng này', array('status' => 401));
        }
        
        global $wpdb;
        $table_notepads = $wpdb->prefix . 'secure_notepads_pro';
        $table_shares = $wpdb->prefix . 'secure_notepad_pro_shares';
        $user_id = get_current_user_id();
        $notepad_id = $request['id'];
        
        // Kiểm tra quyền truy cập
        $access = SNSP_DB_Manager::check_notepad_access($notepad_id, $user_id);
        
        if (!$access) {
            return new WP_Error('access_denied', 'Bạn không có quyền truy cập vào notepad này', array('status' => 403));
        }
        
        // Lấy thông tin notepad
        $notepad = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_notepads WHERE id = %d",
                $notepad_id
            )
        );
        
        if (!$notepad) {
            return new WP_Error('not_found', 'Không tìm thấy notepad', array('status' => 404));
        }
        
        // Lấy thông tin chia sẻ nếu người dùng là chủ sở hữu
        $shares = array();
        if ($access === 'owner') {
            $shares = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT s.*, u.display_name, u.user_email
                    FROM $table_shares s
                    JOIN {$wpdb->users} u ON s.shared_with_id = u.ID
                    WHERE s.notepad_id = %d",
                    $notepad_id
                )
            );
        }
        
        return array(
            'success' => true,
            'notepad' => $notepad,
            'access' => $access,
            'shares' => $shares
        );
    }
    
    // Tạo notepad mới
    public static function create_notepad($request) {
        if (!is_user_logged_in()) {
            return new WP_Error('not_logged_in', 'Bạn phải đăng nhập để sử dụng tính năng này', array('status' => 401));
        }
        
        global $wpdb;
        $table_notepads = $wpdb->prefix . 'secure_notepads_pro';
        $user_id = get_current_user_id();
        
        $title = sanitize_text_field($request->get_param('title') ?: 'Untitled Notepad');
        $content = $request->get_param('content') ?: '';
        $expires_at = $request->get_param('expires_at') ?: null;
        
        $wpdb->insert(
            $table_notepads,
            array(
                'user_id' => $user_id,
                'title' => $title,
                'content' => $content,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
                'expires_at' => $expires_at
            )
        );
        
        $new_id = $wpdb->insert_id;
        
        if (!$new_id) {
            return new WP_Error('db_error', 'Không thể tạo notepad: ' . $wpdb->last_error, array('status' => 500));
        }
        
        return array(
            'success' => true,
            'message' => 'Đã tạo notepad mới thành công',
            'notepad_id' => $new_id
        );
    }
    
    // Cập nhật notepad
    public static function update_notepad($request) {
        if (!is_user_logged_in()) {
            return new WP_Error('not_logged_in', 'Bạn phải đăng nhập để sử dụng tính năng này', array('status' => 401));
        }
        
        global $wpdb;
        $table_notepads = $wpdb->prefix . 'secure_notepads_pro';
        $user_id = get_current_user_id();
        $notepad_id = $request['id'];
        
        // Kiểm tra quyền truy cập
        $access = SNSP_DB_Manager::check_notepad_access($notepad_id, $user_id);
        
        if (!$access || ($access !== 'owner' && $access !== 'editor')) {
            return new WP_Error('access_denied', 'Bạn không có quyền chỉnh sửa notepad này', array('status' => 403));
        }
        
        $data = array(
            'updated_at' => current_time('mysql')
        );
        
        // Cập nhật nội dung nếu được cung cấp
        if ($request->get_param('content') !== null) {
            $data['content'] = $request->get_param('content');
        }
        
        // Cập nhật tiêu đề nếu được cung cấp và người dùng là chủ sở hữu
        if ($access === 'owner' && $request->get_param('title') !== null) {
            $data['title'] = sanitize_text_field($request->get_param('title'));
        }
        
        $wpdb->update(
            $table_notepads,
            $data,
            array('id' => $notepad_id)
        );
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', 'Không thể cập nhật notepad: ' . $wpdb->last_error, array('status' => 500));
        }
        
        return array(
            'success' => true,
            'message' => 'Đã cập nhật notepad thành công'
        );
    }
    
    // Xóa notepad
    public static function delete_notepad($request) {
        if (!is_user_logged_in()) {
            return new WP_Error('not_logged_in', 'Bạn phải đăng nhập để sử dụng tính năng này', array('status' => 401));
        }
        
        global $wpdb;
        $table_notepads = $wpdb->prefix . 'secure_notepads_pro';
        $table_shares = $wpdb->prefix . 'secure_notepad_pro_shares';
        $user_id = get_current_user_id();
        $notepad_id = $request['id'];
        
        // Kiểm tra quyền truy cập
        $access = SNSP_DB_Manager::check_notepad_access($notepad_id, $user_id);
        
        if (!$access || $access !== 'owner') {
            return new WP_Error('access_denied', 'Bạn không có quyền xóa notepad này', array('status' => 403));
        }
        
     
    // Cập nhật phương thức lấy danh sách ghi chú
    public static function get_notepad_list() {
        if (!is_user_logged_in()) {
            return new WP_Error('not_logged_in', 'Bạn phải đăng nhập để sử dụng tính năng này', array('status' => 401));
        }
        
        global $wpdb;
        $table_notepads = $wpdb->prefix . 'secure_notepads_pro';
        $user_id = get_current_user_id();
        
        // Lấy danh sách ghi chú của người dùng hiện tại
        $user_notepads = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, title, created_at, updated_at, expires_at, is_favorite 
                FROM $table_notepads
                WHERE user_id = %d
                ORDER BY is_favorite DESC, updated_at DESC",
                $user_id
            )
        );
        
        // Lấy danh sách ghi chú được chia sẻ với người dùng
        $db = new SNSP_DB_Manager();
        $shared_notepads = $db->get_shared_notepads();
        
        return array(
            'status' => 200,
            'user_notepads' => $user_notepads,
            'shared_notepads' => $shared_notepads
        );
    }
    
    // Thêm phương thức tạo notepad mới
    public static function create_notepad() {
        if (!is_user_logged_in()) {
            return new WP_Error('not_logged_in', 'Bạn phải đăng nhập để sử dụng tính năng này', array('status' => 401));
        }
        
        $user_id = get_current_user_id();
        $title = isset($_POST['title']) ? sanitize_text_field($_POST['title']) : 'Untitled Notepad';
        
        global $wpdb;
        $table_notepads = $wpdb->prefix . 'secure_notepads_pro';
        
        $result = $wpdb->insert(
            $table_notepads,
            array(
                'user_id' => $user_id,
                'title' => $title,
                'content' => '',
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            ),
            array('%d', '%s', '%s', '%s', '%s')
        );
        
        if ($result) {
            $notepad_id = $wpdb->insert_id;
            return array(
                'status' => 200,
                'message' => 'Notepad created successfully',
                'notepad_id' => $notepad_id,
                'title' => $title
            );
        } else {
            return new WP_Error('db_error', 'Error creating notepad', array('status' => 500));
        }
    }
}
