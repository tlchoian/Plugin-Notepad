/**
 * Secure Notepad Pro - Share Management
 */

// Hiển thị dialog chia sẻ
function showShareDialog(notepadId, notepadTitle) {
    // Tạo và hiển thị modal chia sẻ
    const modal = document.createElement('div');
    modal.className = 'notepad-modal share-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Chia sẻ ghi chú: ${notepadTitle}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="search-users">
                    <input type="text" id="user-search" placeholder="Tìm kiếm người dùng...">
                    <button id="search-user-btn">Tìm kiếm</button>
                </div>
                <div class="search-results"></div>
                <div class="shared-users-list">
                    <h4>Đã chia sẻ với</h4>
                    <div class="shared-users"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Xử lý đóng modal
    modal.querySelector('.close-modal').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Xử lý sự kiện tìm kiếm người dùng
    const searchInput = modal.querySelector('#user-search');
    const searchButton = modal.querySelector('#search-user-btn');
    
    searchButton.addEventListener('click', function() {
        searchUsers(searchInput.value, modal.querySelector('.search-results'), notepadId);
    });
    
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchUsers(searchInput.value, modal.querySelector('.search-results'), notepadId);
        }
    });
    
    // Tải danh sách người dùng đã chia sẻ
    loadSharedUsers(notepadId, modal.querySelector('.shared-users'));
}

// Hàm tìm kiếm người dùng
function searchUsers(keyword, resultsContainer, notepadId) {
    if (keyword.length < 3) {
        resultsContainer.innerHTML = '<p class="error">Vui lòng nhập ít nhất 3 ký tự để tìm kiếm</p>';
        return;
    }
    
    resultsContainer.innerHTML = '<p>Đang tìm kiếm...</p>';
    
    fetch(secure_notepad_ajax.ajax_url + '?action=search_users&nonce=' + secure_notepad_ajax.nonce + '&keyword=' + encodeURIComponent(keyword))
        .then(response => response.json())
        .then(data => {
            if (data.status === 200 && data.users && data.users.length > 0) {
                resultsContainer.innerHTML = '<ul class="user-list"></ul>';
                const userList = resultsContainer.querySelector('.user-list');
                
                data.users.forEach(user => {
                    const userItem = document.createElement('li');

                // Hàm chia sẻ ghi chú với người dùng
function shareWithUser(notepadId, userId, canEdit = false) {
    // Hiển thị thông báo đang xử lý
    showLoadingMessage('Đang chia sẻ ghi chú...');
    
    // Gọi API chia sẻ ghi chú
    fetch(secure_notepad_ajax.ajax_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'action': 'share_notepad',
            'nonce': secure_notepad_ajax.nonce,
            'notepad_id': notepadId,
            'user_id': userId,
            'can_edit': canEdit ? 1 : 0
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingMessage();
        if (data.status === 200) {
            // Thêm người dùng vào danh sách đã chia sẻ
            addUserToSharedList(data.user, notepadId);
            showNotification('Đã chia sẻ ghi chú thành công với ' + data.user.display_name);
        } else {
            showError('Lỗi khi chia sẻ ghi chú: ' + (data.message || 'Không thể chia sẻ'));
        }
    })
    .catch(error => {
        hideLoadingMessage();
        showError('Lỗi khi chia sẻ ghi chú: ' + error.message);
    });
}

// Hàm thêm người dùng vào danh sách đã chia sẻ
function addUserToSharedList(user, notepadId) {
    const sharedUsersList = document.querySelector('.shared-users');
    if (!sharedUsersList) return;
    
    // Kiểm tra xem người dùng đã có trong danh sách chưa
    const existingUser = sharedUsersList.querySelector(`[data-user-id="${user.id}"]`);
    if (existingUser) {
        // Cập nhật quyền nếu đã tồn tại
        existingUser.querySelector('.user-permissions').textContent = user.can_edit ? 'Có thể chỉnh sửa' : 'Chỉ đọc';
        return;
    }
    
    // Tạo phần tử người dùng mới
    const userItem = document.createElement('div');
    userItem.className = 'shared-user-item';
    userItem.dataset.userId = user.id;
    
    userItem.innerHTML = `
        <div class="user-info">
            <span class="user-name">${user.display_name}</span>
            <span class="user-email">${user.email}</span>
        </div>
        <div class="user-permissions">${user.can_edit ? 'Có thể chỉnh sửa' : 'Chỉ đọc'}</div>
        <div class="user-actions">
            <button class="toggle-permission" data-user-id="${user.id}" data-notepad-id="${notepadId}">
                ${user.can_edit ? 'Đổi thành chỉ đọc' : 'Cho phép chỉnh sửa'}
            </button>
            <button class="remove-share" data-user-id="${user.id}" data-notepad-id="${notepadId}">
                <i class="fas fa-times"></i> Hủy chia sẻ
            </button>
        </div>
    `;
    
    // Gắn sự kiện cho các nút
    userItem.querySelector('.toggle-permission').addEventListener('click', function() {
        const newPermission = this.textContent.trim() === 'Cho phép chỉnh sửa';
        toggleUserPermission(notepadId, user.id, newPermission);
    });
    
    userItem.querySelector('.remove-share').addEventListener('click', function() {
        unshareWithUser(notepadId, user.id);
    });
    
    // Thêm vào danh sách
    sharedUsersList.appendChild(userItem);
}

// Hàm thay đổi quyền của người dùng
function toggleUserPermission(notepadId, userId, canEdit) {
    // Hiển thị thông báo đang xử lý
    showLoadingMessage('Đang cập nhật quyền...');
    
    // Gọi API cập nhật quyền
    fetch(secure_notepad_ajax.ajax_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'action': 'share_notepad', // Dùng lại API share_notepad để cập nhật
            'nonce': secure_notepad_ajax.nonce,
            'notepad_id': notepadId,
            'user_id': userId,
            'can_edit': canEdit ? 1 : 0
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingMessage();
        if (data.status === 200) {
            // Cập nhật UI
            const userItem = document.querySelector(`.shared-user-item[data-user-id="${userId}"]`);
            if (userItem) {
                userItem.querySelector('.user-permissions').textContent = data.user.can_edit ? 'Có thể chỉnh sửa' : 'Chỉ đọc';
                userItem.querySelector('.toggle-permission').textContent = data.user.can_edit ? 'Đổi thành chỉ đọc' : 'Cho phép chỉnh sửa';
            }
            showNotification('Đã cập nhật quyền thành công');
        } else {
            showError('Lỗi khi cập nhật quyền: ' + (data.message || 'Không thể cập nhật'));
        }
    })
    .catch(error => {
        hideLoadingMessage();
        showError('Lỗi khi cập nhật quyền: ' + error.message);
    });
}

// Hàm hủy chia sẻ với người dùng
function unshareWithUser(notepadId, userId) {
    if (!confirm('Bạn có chắc chắn muốn hủy chia sẻ ghi chú này?')) {
        return;
    }
    
    // Hiển thị thông báo đang xử lý
    showLoadingMessage('Đang hủy chia sẻ...');
    
    // Gọi API hủy chia sẻ
    fetch(secure_notepad_ajax.ajax_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'action': 'unshare_notepad',
            'nonce': secure_notepad_ajax.nonce,
            'notepad_id': notepadId,
            'user_id': userId
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingMessage();
        if (data.status === 200) {
            // Xóa người dùng khỏi danh sách
            const userItem = document.querySelector(`.shared-user-item[data-user-id="${userId}"]`);
            if (userItem) {
                userItem.parentNode.removeChild(userItem);
            }
            showNotification('Đã hủy chia sẻ thành công');
        } else {
            showError('Lỗi khi hủy chia sẻ: ' + (data.message || 'Không thể hủy chia sẻ'));
        }
    })
    .catch(error => {
        hideLoadingMessage();
        showError('Lỗi khi hủy chia sẻ: ' + error.message);
    });
}

// Hàm hiển thị thông báo
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification-message';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}
