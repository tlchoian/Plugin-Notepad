<?php
/**
 * Template hiển thị khi chưa đăng nhập
 */

// Kiểm tra truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

// Đường dẫn đến logo
$logo_url = SNSP_PLUGIN_URL . 'images/fx-digital-logo.png';
?>
<div class="snsp-container">
    <div class="snsp-login-required">
        <img src="<?php echo esc_url($logo_url); ?>" alt="Fx Digital" class="snsp-footer-logo">
        <h2 class="snsp-login-required-title">Bạn cần đăng nhập để sử dụng Notepad Online Bảo Mật Pro</h2>
        <p class="snsp-login-required-text">Đăng nhập để tạo và quản lý các ghi chú bảo mật của bạn. Dữ liệu của bạn được mã hóa và chỉ bạn mới có thể truy cập.</p>
        <a href="<?php echo wp_login_url(get_permalink()); ?>" class="snsp-login-btn">Đăng nhập</a>
    </div>
    
    <div class="snsp-footer">
        <p class="snsp-copyright">© <?php echo date('Y'); ?> Fx Digital. Tất cả các quyền được bảo lưu.</p>
    </div>
</div>
