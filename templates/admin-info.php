<?php
/**
 * Template trang thông tin admin
 */

// Kiểm tra truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="wrap">
    <h1>
        <img src="<?php echo esc_url($logo_url); ?>" alt="Fx Digital" style="max-height: 50px; vertical-align: middle; margin-right: 10px;">
        Secure Notepad Storage Pro
    </h1>
    
    <div class="card">
        <h2>Thông tin bản quyền</h2>
        <p>Plugin này được phát triển và thuộc sở hữu độc quyền của Fx Digital.</p>
        <p><strong>© <?php echo date('Y'); ?> Fx Digital.</strong> Tất cả các quyền được bảo lưu.</p>
        <p>Không được phép sao chép, phân phối hoặc sửa đổi mà không có sự cho phép bằng văn bản.</p>
    </div>
    
    <div class="card">
        <h2>Nhập dữ liệu từ phiên bản cũ</h2>
        <p>Nếu bạn đã sử dụng plugin Secure Notepad Storage (phiên bản cũ), bạn có thể nhập dữ liệu từ phiên bản đó vào phiên bản Pro này.</p>
        <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
            <input type="hidden" name="action" value="snsp_import_old_data">
            <?php wp_nonce_field('snsp_import_old_data'); ?>
            <p>
                <button type="submit" class="button button-primary">Nhập dữ liệu từ phiên bản cũ</button>
            </p>
        </form>
    </div>
    
    <div class="card">
        <h2>Hướng dẫn sử dụng</h2>
        <p>Sử dụng shortcode <code>[secure_notepad_pro]</code> để hiển thị ứng dụng Notepad Online Bảo Mật Pro trên bất kỳ trang hoặc bài viết nào.</p>
        <h3>Các tính năng đặc biệt:</h3>
        <ul style="list-style-type: disc; margin-left: 20px;">
            <li>Mã hóa AES-256 phía client-side với PBKDF2</li>
            <li>Nhiều notepad cho mỗi người dùng</li>
            <li>Đánh dấu notepad yêu thích</li>
            <li>Đặt thời gian hết hạn tự động xóa</li>
            <li>Chia sẻ bảo mật với người dùng khác</li>
            <li>Sao lưu và tải xuống tệp</li>
        </ul>
    </div>
    
    <div class="card">
        <h2>Thông tin liên hệ</h2>
        <p><strong>Fx Digital</strong></p>
        <p>Website: <a href="https://fxdigital.com" target="_blank">fxdigital.com</a></p>
        <p>Email: contact@fxdigital.com</p>
    </div>
</div>
