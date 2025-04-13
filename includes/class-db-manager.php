<?php
/**
 * Class quản lý cơ sở dữ liệu
 */
class SNSP_DB_Manager {
    
    // Tạo bảng dữ liệu
    public static function create_tables() {
        global $wpdb;
        
        // Bảng notepad
        $table_notepads = $wpdb->prefix . 'secure_notepads_pro';
        
        // Bảng chia sẻ notepad
        $table_shares = $wpdb->prefix . 'secure_notepad_pro_shares';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // SQL để tạo bảng notepad
        $sql_notepads = "CREATE TABLE $table_notepads (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            title varchar(255) NOT NULL DEFAULT 'Untitled Notepad',
            content longtext NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            expires_at datetime DEFAULT NULL,
            is_favorite tinyint(1) DEFAULT 0,
            PRIMARY KEY  (id),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        // SQL để tạo bảng chia sẻ
        $sql_shares = "CREATE TABLE $table_shares (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            notepad_id mediumint(9) NOT NULL,
            owner_id bigint(20) NOT NULL,
            shared_with_id bigint(20) NOT NULL,
            can_edit tinyint(1) DEFAULT 0,
            share_key varchar(255) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            KEY notepad_id (notepad_id),
            KEY owner_id (owner_id),
            KEY shared_with_id (shared_with_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_notepads);
        dbDelta($sql_shares);
        
        return true;
    }
    
    // Xóa các notepad hết hạn
    public static function delete_expired_notepads() {
        global $wpdb;
        $table_notepads = $wpdb->prefix . 'secure_notepads_pro';
        
        // Xóa tất cả các notepad đã hết hạn
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM $table_notepads WHERE expires_at IS NOT NULL AND expires_at < %s",
                current_time('mysql')
            )
        );
        
        return true;
    }
    
    // Nhập dữ liệu từ plugin cũ
    public static function import_from_old_plugin($old_table) {
        global $wpdb;
        
        // Kiểm tra bảng cũ có tồn tại không
        $old_table_exists = $wpdb->get_var("SHOW TABLES LIKE '$old_table'") === $old_table;
        
        if (!$old_table_exists) {
            return false;
        }
        
        $new_table = $wpdb->prefix . 'secure_notepads_pro';
        
        // Di chuyển dữ liệu từ bảng cũ sang bảng mới
        $old_records = $wpdb->get_results("SELECT * FROM $old_table");
        
        if (empty($old_records)) {
            return false;
        }
        
        $imported_count = 0;
        
        foreach ($old_records as $record) {
            $result = $wpdb->insert(
                $new_table,
                array(
                    'user_id' => $record->user_id,
                    'title' => 'Notepad từ phiên bản cũ',
                    'content' => $record->notepad_content,
                    'created_at' => isset($record->created_at) ? $record->created_at : current_time('mysql'),
                    'updated_at' => isset($record->updated_at) ? $record->updated_at : current_time('mysql')
                )
            );
            
            if ($result) {
                $imported_count++;
            }
        }
        
        return $imported_count > 0;
    }
    
    // Kiểm tra quyền truy cập notepad
    public static function check_notepad_access($notepad_id, $user_id) {
        global $wpdb;
        $table_notepads = $wpdb->prefix . 'secure_notepads_pro';
        $table_shares = $wpdb->prefix . 'secure_notepad_pro_shares';
        
        // Kiểm tra người dùng có phải là chủ sở hữu
        $is_owner = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM $table_notepads WHERE id = %d AND user_id = %d",
                $notepad_id,
                $user_id
            )
        );
        
        if ($is_owner) {
            return 'owner';
        }
        
        // Kiểm tra xem notepad có được chia sẻ với người dùng không
        $share = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_shares 
                WHERE notepad_id = %d AND shared_with_id = %d",
                $notepad_id,
                $user_id
            )
        );
        
        if ($share) {
            return $share->can_edit ? 'editor' : 'viewer';
        }
        
        return false;
    }
     // Cập nhật hàm tạo bảng để đảm bảo nó có các trường cần thiết
    public static function create_tables() {
        global $wpdb;
        
        $secure_notepads = $wpdb->prefix . 'secure_notepads_pro';
        $secure_shares = $wpdb->prefix . 'secure_notepad_pro_shares';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // SQL để tạo bảng notepad
        $sql_notepads = "CREATE TABLE $secure_notepads (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            title varchar(255) NOT NULL DEFAULT 'Untitled Notepad',
            content longtext NOT NULL NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            expires_at datetime NULL,
            is_favorite tinyint(1) DEFAULT 0,
            PRIMARY KEY  (id),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        // SQL để tạo bảng chia sẻ
        $sql_shares = "CREATE TABLE $secure_shares (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            notepad_id mediumint(9) NOT NULL,
            owner_id bigint(20) NOT NULL NULL,
            shared_with_id bigint(20) NOT NULL NULL,
            can_edit tinyint(1) DEFAULT 0,
            share_key varchar(255) NOT NULL NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL NULL,
            PRIMARY KEY  (id),
            KEY notepad_id (notepad_id),
            KEY owner_id (owner_id),
            KEY shared_with_id (shared_with_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_notepads);
        dbDelta($sql_shares);
        
        return true;
    }
    
    // Thêm hàm để lấy danh sách notepad của người dùng
    public function get_user_notepads($user_id = null) {
        global $wpdb;
        
        if (!$user_id) {
            $user_id = get_current_user_id();
        }
        
        $table_name = $wpdb->prefix . 'secure_notepads_pro';
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, title, created_at, updated_at, expires_at, is_favorite 
                FROM $table_name 
                WHERE user_id = %d 
                ORDER BY is_favorite DESC, updated_at DESC",
                $user_id
            )
        );
        
        return $results;
    }
    
    // Thêm hàm để lấy danh sách notepad được chia sẻ với người dùng
    public function get_shared_notepads($user_id = null) {
        global $wpdb;
        
        if (!$user_id) {
            $user_id = get_current_user_id();
        }
        
        $notepads_table = $wpdb->prefix . 'secure_notepads_pro';
        $shares_table = $wpdb->prefix . 'secure_notepad_pro_shares';
        
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT n.id, n.title, n.created_at, n.updated_at, n.expires_at, 
                       s.can_edit, s.share_key, u.display_name as owner_name
                FROM $shares_table s
                JOIN $notepads_table n ON s.notepad_id = n.id
                JOIN {$wpdb->users} u ON n.user_id = u.ID
                WHERE s.shared_with_id = %d",
                $user_id
            )
        );
        
        return $results;
    }
}
