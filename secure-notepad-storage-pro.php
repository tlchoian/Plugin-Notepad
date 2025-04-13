<?php
/**
 * Plugin Name: Secure Notepad Storage Pro
 * Description: Lưu trữ dữ liệu Notepad bảo mật cao cấp cho người dùng WordPress với nhiều tính năng nâng cao
 * Version: 1.0
 * Author: Fx Digital
 * Author URI: https://fxdigital.vn
 * Copyright: © 2025 Fx Digital. Tất cả các quyền được bảo lưu.
 * License: Độc quyền - Không được phép phân phối lại hoặc sửa đổi mà không có sự cho phép của Fx Digital
 * Text Domain: secure-notepad-storage-pro
 */

// Đảm bảo không thể truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit('Direct access denied. This plugin is the exclusive property of Fx Digital.');
}

// Định nghĩa hằng số
define('SNSP_VERSION', '1.0');
define('SNSP_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SNSP_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SNSP_ASSETS_URL', SNSP_PLUGIN_URL . 'assets/');

/**
 * Class chính của plugin
 */
class Secure_Notepad_Storage_Pro {
    
    // Biến lưu trữ singleton
    private static $instance = null;
    
    // Singleton pattern
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    // Hàm khởi tạo
    private function __construct() {
        // Load các class cần thiết
        $this->load_dependencies();
        
        // Đăng ký hooks
        $this->register_hooks();
        // Đăng ký API endpoint tạo ghi chú mới
add_action('wp_ajax_create_notepad', array('SNSP_API_Controller', 'create_notepad'));
        // Đăng ký API endpoint cho chức năng chia sẻ
add_action('wp_ajax_search_users', array('SNSP_API_Controller', 'search_users'));
add_action('wp_ajax_share_notepad', array('SNSP_API_Controller', 'share_notepad'));
add_action('wp_ajax_unshare_notepad', array('SNSP_API_Controller', 'unshare_notepad'));
add_action('wp_ajax_get_shared_users', array('SNSP_API_Controller', 'get_shared_users'));
    }
    
    // Load các file phụ thuộc
    private function load_dependencies() {
        require_once SNSP_PLUGIN_DIR . 'includes/class-db-manager.php';
        require_once SNSP_PLUGIN_DIR . 'includes/class-api-controller.php';
        require_once SNSP_PLUGIN_DIR . 'includes/class-user-manager.php';
    }
    
    // Đăng ký các hooks
    private function register_hooks() {
        // Hooks kích hoạt và gỡ cài đặt
        register_activation_hook(__FILE__, array($this, 'activate_plugin'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate_plugin'));
        
        // Thêm shortcode để hiển thị ứng dụng Notepad
        add_shortcode('secure_notepad_pro', array($this, 'display_notepad_app'));
        
        // Thêm Scripts và Styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        
        // Thêm trang thông tin trong admin
        add_action('admin_menu', array($this, 'add_admin_menu'));
        
        // Xử lý tác vụ hết hạn
        add_action('snsp_scheduled_delete', array($this, 'process_expired_notepads'));
        
        // Tích hợp với các hệ thống thành viên
        add_action('user_register', array('SNSP_User_Manager', 'new_user_setup'));
        add_action('delete_user', array('SNSP_User_Manager', 'handle_user_deletion'), 10, 3);
        
        // Công cụ nhập dữ liệu từ plugin cũ
        add_action('admin_init', array($this, 'register_import_tool'));
    }
    
    // Khi kích hoạt plugin
    public function activate_plugin() {
        // Tạo bảng dữ liệu
        SNSP_DB_Manager::create_tables();
        
        // Đặt lịch xử lý các notepad hết hạn
        if (!wp_next_scheduled('snsp_scheduled_delete')) {
            wp_schedule_event(time(), 'daily', 'snsp_scheduled_delete');
        }
    }
    
    // Khi gỡ cài đặt plugin
    public function deactivate_plugin() {
        // Hủy lịch xử lý
        wp_clear_scheduled_hook('snsp_scheduled_delete');
    }
    
    // Xử lý các notepad hết hạn
    public function process_expired_notepads() {
        SNSP_DB_Manager::delete_expired_notepads();
    }
    
    // Đăng ký công cụ nhập dữ liệu
    public function register_import_tool() {
        if (current_user_can('manage_options')) {
            add_action('admin_post_snsp_import_old_data', array($this, 'import_data_from_old_plugin'));
        }
    }
    
    // Nhập dữ liệu từ plugin cũ
    public function import_data_from_old_plugin() {
        // Kiểm tra nonce
        check_admin_referer('snsp_import_old_data');
        
        global $wpdb;
        $old_table = $wpdb->prefix . 'secure_notepad';
        $success = SNSP_DB_Manager::import_from_old_plugin($old_table);
        
        // Chuyển hướng với thông báo
        $redirect_url = add_query_arg(
            array('page' => 'secure-notepad-pro-info', 'import' => $success ? 'success' : 'error'),
            admin_url('options-general.php')
        );
        wp_redirect($redirect_url);
        exit;
    }
    
    // Hiển thị ứng dụng Notepad
    public function display_notepad_app() {
        // Kiểm tra nếu người dùng chưa đăng nhập
        if (!is_user_logged_in()) {
            ob_start();
            include SNSP_PLUGIN_DIR . 'templates/login-required.php';
            return ob_get_clean();
        }
        
        // Enqueue các script và style cần thiết
        $this->enqueue_notepad_scripts();
        
        // HTML cho ứng dụng Notepad
        ob_start();
        include SNSP_PLUGIN_DIR . 'templates/notepad-app.php';
        return ob_get_clean();
    }
    
    // Thêm Scripts và Styles chung
    public function enqueue_scripts() {
        // Chỉ đăng ký các style và script chung
        wp_register_style('secure-notepad-pro-style', SNSP_PLUGIN_URL . 'css/style.css', array(), SNSP_VERSION);
    }
    
    // Thêm Scripts và Styles cụ thể cho Notepad
    public function enqueue_notepad_scripts() {
        // Enqueue style chung
        wp_enqueue_style('secure-notepad-pro-style');
        
        // Các script phụ thuộc
        wp_enqueue_script('jquery');
        wp_enqueue_script('jquery-ui-datepicker');
        wp_enqueue_style('jquery-ui', 'https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css');
        
        // Script của crypto-js
        wp_enqueue_script('crypto-js', 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js', array(), '4.1.1', true);
        
        // Scripts chính của plugin
        wp_enqueue_script('secure-notepad-pro-editor', SNSP_PLUGIN_URL . 'js/notepad-editor.js', array('jquery', 'crypto-js'), SNSP_VERSION, true);
        wp_enqueue_script('secure-notepad-pro-manager', SNSP_PLUGIN_URL . 'js/notepad-manager.js', array('jquery', 'jquery-ui-datepicker'), SNSP_VERSION, true);
        
        // Truyền dữ liệu cần thiết đến JavaScript
        wp_localize_script('secure-notepad-pro-manager', 'snspData', array(
            'ajaxUrl' => rest_url('secure-notepad-pro/v1/'),
            'nonce' => wp_create_nonce('wp_rest'),
            'isLoggedIn' => is_user_logged_in(),
            'pluginUrl' => SNSP_PLUGIN_URL,
            'dateFormat' => get_option('date_format'),
            'timeFormat' => get_option('time_format')
        ));
    }
    
    // Thêm trang thông tin về plugin
    public function add_admin_menu() {
        add_submenu_page(
            'options-general.php',
            'Secure Notepad Pro',
            'Secure Notepad Pro',
            'manage_options',
            'secure-notepad-pro-info',
            array($this, 'render_info_page')
        );
    }
    
    // Hiển thị trang thông tin
    public function render_info_page() {
        // Hiển thị thông báo nhập dữ liệu nếu có
        if (isset($_GET['import'])) {
            if ($_GET['import'] === 'success') {
                echo '<div class="notice notice-success is-dismissible"><p>Nhập dữ liệu từ plugin cũ thành công!</p></div>';
            } else {
                echo '<div class="notice notice-error is-dismissible"><p>Đã xảy ra lỗi khi nhập dữ liệu từ plugin cũ.</p></div>';
            }
        }
        
        // Đường dẫn đến logo
        $logo_url = SNSP_PLUGIN_URL . 'images/fx-digital-logo.png';
        include SNSP_PLUGIN_DIR . 'templates/admin-info.php';
    }
}

// Khởi tạo plugin
function run_secure_notepad_storage_pro() {
    $plugin = Secure_Notepad_Storage_Pro::get_instance();
}
run_secure_notepad_storage_pro();

// Khởi tạo controller API
add_action('rest_api_init', array('SNSP_API_Controller', 'register_routes'));
// Thêm vào phương thức register_scripts() hoặc phương thức enqueue_scripts nếu có
public function enqueue_scripts() {
    // Code hiện tại để đăng ký các file JS khác
    
    // Thêm file JS xử lý chia sẻ
    wp_enqueue_script(
        'secure-notepad-share',
        plugin_dir_url(__FILE__) . 'js/secure-notepad-share.js',
        array('jquery', 'secure-notepad'), // Đảm bảo file này được tải sau file JS chính
        '1.0.0',
        true
    );
}

