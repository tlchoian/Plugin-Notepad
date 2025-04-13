/**
 * Secure Notepad Pro - Notepad List Management
 */
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo danh sách ghi chú
    loadNotepadList();
    
    // Sự kiện thêm ghi chú mới
    document.getElementById('add-new-notepad').addEventListener('click', createNewNotepad);
});

// Hàm tải danh sách ghi chú
function loadNotepadList() {
    fetch(secure_notepad_ajax.ajax_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'action': 'get_notepad_list',
            'nonce': secure_notepad_ajax.nonce
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 200) {
            renderNotepadList(data.user_notepads, 'user-notepads-list', true);
            renderNotepadList(data.shared_notepads, 'shared-notepads-list', false);
        } else {
            console.error('Error loading notepads:', data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Hàm render danh sách ghi chú
function renderNotepadList(notepads, containerId, isOwned) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (notepads && notepads.length > 0) {
        notepads.forEach(notepad => {
            const notepadItem = document.createElement('div');
            notepadItem.className = 'notepad-item';
            notepadItem.dataset.id = notepad.id;
            
            // Thêm star icon nếu là ghi chú yêu thích
            const starClass = notepad.is_favorite == 1 ? 'favorite' : '';
            
            // Format thời gian
            const updatedDate = new Date(notepad.updated_at);
            const formattedDate = updatedDate.toLocaleDateString() + ' ' + updatedDate.toLocaleTimeString();
            
            // Hiển thị cảnh báo nếu sắp hết hạn
            let expiryWarning = '';
            if (notepad.expires_at) {
                const expiryDate = new Date(notepad.expires_at);
                const now = new Date();
                const daysLeft = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
                
                if (daysLeft < 0) {
                    expiryWarning = '<span class="expiry expired">Đã hết hạn</span>';
                } else if (daysLeft < 7) {
                    expiryWarning = `<span class="expiry warning">Hết hạn trong ${daysLeft} ngày</span>`;
                }
            }
            
            // Nút chia sẻ chỉ hiển thị nếu người dùng là chủ sở hữu
            const shareButton = isOwned ? 
                `<button class="share-notepad" data-id="${notepad.id}">
                    <i class="fas fa-share-alt"></i>
                </button>` : '';
            
            // Thông tin người chia sẻ nếu là ghi chú được chia sẻ
            const ownerInfo = !isOwned && notepad.owner_name ? 
                `<div class="shared-by">Được chia sẻ bởi: ${notepad.owner_name}</div>` : '';
            
            notepadItem.innerHTML = `
                <div class="notepad-header">
                    <h3 class="notepad-title ${starClass}">${notepad.title}</h3>
                    <div class="notepad-actions">
                        ${shareButton}
                        ${isOwned ? `<button class="toggle-favorite" data-id="${notepad.id}">
                            <i class="fas fa-star ${starClass ? 'active' : ''}"></i>
                        </button>` : ''}
                        ${isOwned ? `<button class="set-expiry" data-id="${notepad.id}">
                            <i class="fas fa-clock"></i>
                        </button>` : ''}
                    </div>
                </div>
                <div class="notepad-info">
                    <span class="updated-at">Cập nhật: ${formattedDate}</span>
                    ${expiryWarning}
                    ${ownerInfo}
                </div>
            `;
            
            // Xử lý sự kiện click vào ghi chú để mở
            notepadItem.addEventListener('click', function(e) {
                if (!e.target.closest('button')) {
                    openNotepad(notepad.id);
                }
            });
            
            // Thêm sự kiện cho các nút
            if (isOwned) {
                const favoriteBtn = notepadItem.querySelector('.toggle-favorite');
                if (favoriteBtn) {
                    favoriteBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        toggleFavorite(notepad.id);
                    });
                }
                
                const shareBtn = notepadItem.querySelector('.share-notepad');
                if (shareBtn) {
                    shareBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        showShareDialog(notepad.id, notepad.title);
                    });
                }
                
                const expiryBtn = notepadItem.querySelector('.set-expiry');
                if (expiryBtn) {
                    expiryBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        showExpiryDialog(notepad.id, notepad.title, notepad.expires_at);
                    });
                }
            }
            
            container.appendChild(notepadItem);
        });
    } else {
        container.innerHTML = `<div class="no-notepads">
            ${isOwned ? 'Bạn chưa có ghi chú nào' : 'Chưa có ghi chú nào được chia sẻ với bạn'}
        </div>`;
    }
}

// Hàm tạo ghi chú mới
function createNewNotepad() {
    const title = prompt('Nhập tiêu đề cho ghi chú mới:', 'Ghi chú mới');
    if (title !== null) {
        fetch(secure_notepad_ajax.ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'action': 'create_notepad',
                'nonce': secure_notepad_ajax.nonce,
                'title': title
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 200) {
                loadNotepadList(); // Tải lại danh sách
                openNotepad(data.notepad_id); // Mở ghi chú mới
            } else {
                alert('Lỗi khi tạo ghi chú mới. Vui lòng thử lại.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Lỗi khi tạo ghi chú mới. Vui lòng thử lại.');
        });
    }
}

// Hàm mở ghi chú
function openNotepad(id) {
    // Lưu ID ghi chú hiện tại vào localStorage
    localStorage.setItem('current_notepad_id', id);
    
    // Chuyển sang chế độ chỉnh sửa
    document.getElementById('notepad-list-view').style.display = 'none';
    document.getElementById('notepad-edit-view').style.display = 'block';
    
    // Tải nội dung ghi chú
    loadNotepadContent(id);
}
