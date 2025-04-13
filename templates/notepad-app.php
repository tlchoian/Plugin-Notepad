<?php
/**
 * Giao diện chính của ứng dụng Notepad
 */

// Kiểm tra truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

// Đường dẫn đến logo
$logo_url = SNSP_PLUGIN_URL . 'images/fx-digital-logo.png';
?>
<div class="snsp-container">
    <div class="snsp-header">
        <div class="snsp-logo-container">
            <img src="<?php echo esc_url($logo_url); ?>" alt="Fx Digital" class="snsp-logo">
            <h1 class="snsp-title">Notepad Online Bảo Mật Pro</h1>
            <span class="snsp-version">v<?php echo SNSP_VERSION; ?></span>
        </div>
    </div>
    
    <div class="snsp-layout">
        <div class="snsp-sidebar">
            <div class="snsp-notepad-list">
                <div class="snsp-list-header">
                    <h2 class="snsp-list-title">Notepad của tôi</h2>
                    <div class="snsp-list-actions">
                        <button class="snsp-btn snsp-btn-primary snsp-create-notepad-btn">
                            <i class="dashicons dashicons-plus"></i> Tạo mới
                        </button>
                    </div>
                </div>
                <div class="snsp-list-items">
                    <!-- Danh sách notepad sẽ được hiển thị ở đây -->
                    <div class="snsp-loading">Đang tải...</div>
                </div>
            </div>
            
            <div class="snsp-notepad-list" id="snsp-shared-notepad-list">
                <div class="snsp-list-header">
                    <h2 class="snsp-list-title">Được chia sẻ với tôi</h2>
                </div>
                <div class="snsp-list-items">
                    <!-- Danh sách notepad được chia sẻ sẽ được hiển thị ở đây -->
                    <div class="snsp-loading">Đang tải...</div>
                </div>
            </div>
        </div>
        
        <div class="snsp-content">
            <div class="snsp-notepad-editor" style="display: none;">
                <div class="snsp-editor-header">
                    <input type="text" id="snsp-title-input" class="snsp-editor-title-input" placeholder="Tiêu đề Notepad">
                    <div class="snsp-editor-actions">
                        <button id="snsp-favorite-btn" class="snsp-btn snsp-btn-light">
                            <i class="dashicons dashicons-star-empty"></i> Yêu thích
                        </button>
                        <button id="snsp-expiry-btn" class="snsp-btn snsp-btn-light">
                            <i class="dashicons dashicons-clock"></i> Đặt hạn
                        </button>
                        <button id="snsp-share-btn" class="snsp-btn snsp-btn-light">
                            <i class="dashicons dashicons-share"></i> Chia sẻ
                        </button>
                    </div>
                </div>
                
                <div class="snsp-editor-content">
                    <div class="snsp-password-container">
                        <label for="snsp-password-input" class="snsp-password-label">Mật khẩu mã hóa:</label>
                        <input type="password" id="snsp-password-input" class="snsp-password-input" placeholder="Nhập mật khẩu để mã hóa/giải mã">
                        <button id="snsp-toggle-password" class="snsp-btn snsp-btn-light">Hiện</button>
                    </div>
                    
                    <textarea id="snsp-content-textarea" class="snsp-textarea" placeholder="Nhập nội dung ghi chú của bạn ở đây..."></textarea>
                    
                    <div id="snsp-message-display" class="snsp-message"></div>
                </div>
                
                <div class="snsp-editor-footer">
                    <div class="snsp-footer-actions">
                        <button id="snsp-encrypt-btn" class="snsp-btn snsp-btn-primary">
                            <i class="dashicons dashicons-lock"></i> Mã hóa
                        </button>
                        <button id="snsp-decrypt-btn" class="snsp-btn snsp-btn-success">
                            <i class="dashicons dashicons-unlock"></i> Giải mã
                        </button>
                        <button id="snsp-save-btn" class="snsp-btn snsp-btn-primary" disabled>
                            <i class="dashicons dashicons-saved"></i> Lưu
                        </button>
                        <button id="snsp-download-btn" class="snsp-btn snsp-btn-light">
                            <i class="dashicons dashicons-download"></i> Tải xuống
                        </button>
                        <button id="snsp-clear-btn" class="snsp-btn snsp-btn-light">
                            <i class="dashicons dashicons-editor-removeformatting"></i> Xóa
                        </button>
                        <button id="snsp-delete-btn" class="snsp-btn snsp-btn-danger">
                            <i class="dashicons dashicons-trash"></i> Xóa notepad
                        </button>
                    </div>
                    
                    <div class="snsp-status">
                        <span class="snsp-last-saved"></span>
                    </div>
                </div>
            </div>
            
            <div class="snsp-shares-panel" style="display: none;">
                <div class="snsp-shares-header">
                    <h3 class="snsp-shares-title">Chia sẻ Notepad</h3>
                </div>
                
                <div class="snsp-shares-content">
                    <form id="snsp-share-form" class="snsp-share-form">
                        <input type="email" id="snsp-share-email" class="snsp-share-input" placeholder="Email người dùng">
                        <div class="snsp-share-checkbox">
                            <input type="checkbox" id="snsp-share-can-edit">
                            <label for="snsp-share-can-edit">Cho phép chỉnh sửa</label>
                        </div>
                        <button type="submit" class="snsp-btn snsp-btn-primary">Chia sẻ</button>
                    </form>
                    
                    <div id="snsp-shares-list" class="snsp-shares-list">
                        <!-- Danh sách người dùng được chia sẻ sẽ được hiển thị ở đây -->
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="snsp-footer">
        <img src="<?php echo esc_url($logo_url); ?>" alt="Fx Digital" class="snsp-footer-logo">
        <p class="snsp-copyright">© <?php echo date('Y'); ?> Fx Digital. Tất cả các quyền được bảo lưu.</p>
    </div>
</div>
