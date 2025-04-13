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
