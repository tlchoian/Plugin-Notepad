/**
 * Secure Notepad Storage Pro - Notepad Manager
 * © 2025 Fx Digital. All rights reserved.
 */

(function($) {
    'use strict';
    
    // Đối tượng NotepadManager
    const NotepadManager = {
        // Các phần tử DOM và trạng thái
        elements: {},
        state: {
            currentNotepadId: null,
            notepads: [],
            sharedNotepads: [],
            hasUnsavedChanges: false,
            isEditing: false
        },
        
        // Khởi tạo manager
        init: function() {
            // Thiết lập phần tử DOM
            this.setupElements();
            
            // Đăng ký các sự kiện
            this.registerEvents();
            
            // Tải danh sách notepad
            this.loadNotepadList();
            
            // Đánh dấu đã khởi tạo
            this.isInitialized = true;
            
            return this;
        },
        
        // Thiết lập phần tử DOM
        setupElements: function() {
            this.elements = {
                notepadList: $('#snsp-notepad-list'),
                sharedNotepadList: $('#snsp-shared-notepad-list'),
                createNotepadBtn: $('.snsp-create-notepad-btn'),
                notepadEditor: $('.snsp-notepad-editor'),
                titleInput: $('#snsp-title-input'),
                contentTextarea: $('#snsp-content-textarea'),
                passwordInput: $('#snsp-password-input'),
                togglePasswordBtn: $('#snsp-toggle-password'),
                encryptBtn: $('#snsp-encrypt-btn'),
                decryptBtn: $('#snsp-decrypt-btn'),
                saveBtn: $('#snsp-save-btn'),
                deleteBtn: $('#snsp-delete-btn'),
                favoriteBtn: $('#snsp-favorite-btn'),
                shareBtn: $('#snsp-share-btn'),
                expiryBtn: $('#snsp-expiry-btn'),
                downloadBtn: $('#snsp-download-btn'),
                clearBtn: $('#snsp-clear-btn'),
                messageDisplay: $('#snsp-message-display'),
                shareForm: $('#snsp-share-form'),
                shareEmail: $('#snsp-share-email'),
                shareCanEdit: $('#snsp-share-can-edit'),
                sharesList: $('#snsp-shares-list'),
                expiryDatepicker: $('#snsp-expiry-datepicker'),
                expiryTimepicker: $('#snsp-expiry-timepicker'),
                expiryRemoveBtn: $('#snsp-remove-expiry-btn')
            };
            
            // Khởi tạo editor
            if (window.SNSPEditor) {
                window.SNSPEditor.init({
                    textareaId: 'snsp-content-textarea',
                    passwordInputId: 'snsp-password-input',
                    togglePasswordBtnId: 'snsp-toggle-password',
                    encryptBtnId: 'snsp-encrypt-btn',
                    decryptBtnId: 'snsp-decrypt-btn',
                    saveBtnId: 'snsp-save-btn',
                    messageDisplayId: 'snsp-message-display'
                });
            }
            
            // Khởi tạo datepicker
            if ($.fn.datepicker) {
                this.elements.expiryDatepicker.datepicker({
                    dateFormat: 'yy-mm-dd',
                    changeMonth: true,
                    changeYear: true,
                    minDate: 0
                });
            }
        },
        
        // Đăng ký các sự kiện
        registerEvents: function() {
            const self = this;
            
            // Tạo notepad mới
            this.elements.createNotepadBtn.on('click', function(e) {
                e.preventDefault();
                self.createNewNotepad();
            });
            
            // Lưu notepad
            this.elements.saveBtn.on('click', function(e) {
                e.preventDefault();
                self.saveCurrentNotepad();
            });
            
            // Xóa notepad
            this.elements.deleteBtn.on('click', function(e) {
                e.preventDefault();
                self.deleteCurrentNotepad();
            });
            
            // Đánh dấu yêu thích
            this.elements.favoriteBtn.on('click', function(e) {
                e.preventDefault();
                self.toggleFavorite();
            });
            
            // Đặt thời gian hết hạn
            this.elements.expiryBtn.on('click', function(e) {
                e.preventDefault();
                self.showExpiryModal();
            });
            
            // Xóa thời gian hết hạn
            this.elements.expiryRemoveBtn.on('click', function(e) {
                e.preventDefault();
                self.removeExpiry();
            });
            
            // Tải xuống notepad
            this.elements.downloadBtn.on('click', function(e) {
                e.preventDefault();
                self.downloadNotepad();
            });
            
            // Xóa nội dung
            this.elements.clearBtn.on('click', function(e) {
                e.preventDefault();
                self.clearNotepadContent();
            });
            
            // Chia sẻ notepad
            this.elements.shareBtn.on('click', function(e) {
                e.preventDefault();
                self.toggleSharePanel();
            });
            
            // Form chia sẻ
            this.elements.shareForm.on('submit', function(e) {
                e.preventDefault();
                self.shareNotepad();
            });
            
            // Phát hiện thay đổi chưa lưu
            this.elements.contentTextarea.on('change keyup', function() {
                self.state.hasUnsavedChanges = true;
                self.updateSaveButtonState();
            });
            
            this.elements.titleInput.on('change keyup', function() {
                self.state.hasUnsavedChanges = true;
                self.updateSaveButtonState();
            });
            
            // Cảnh báo khi rời trang có thay đổi chưa lưu
            $(window).on('beforeunload', function() {
                if (self.state.hasUnsavedChanges) {
                    return 'Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?';
                }
            });
        },
        
        // Tải danh sách notepad
        loadNotepadList: function() {
            const self = this;
            
            $.ajax({
                url: snspData.ajaxUrl + 'list',
                method: 'GET',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', snspData.nonce);
                },
                success: function(response) {
                    if (response.success && response.notepads) {
                        self.state.notepads = response.notepads;
                        self.renderNotepadList();
                        
                        // Tải notepad đầu tiên nếu có
                        if (response.notepads.length > 0) {
                            self.loadNotepad(response.notepads[0].id);
                        } else {
                            self.showEmptyState();
                        }
                    }
                },
                error: function() {
                    self.showMessage('Không thể tải danh sách notepad.', 'error');
                }
            });
            
            // Tải danh sách notepad được chia sẻ
            $.ajax({
                url: snspData.ajaxUrl + 'shared-with-me',
                method: 'GET',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', snspData.nonce);
                },
                success: function(response) {
                    if (response.success && response.notepads) {
                        self.state.sharedNotepads = response.notepads;
                        self.renderSharedNotepadList();
                    }
                }
            });
        },
        
        // Hiển thị danh sách notepad
        renderNotepadList: function() {
            const self = this;
            const listElement = this.elements.notepadList.find('.snsp-list-items');
            
            // Xóa danh sách cũ
            listElement.empty();
            
            if (this.state.notepads.length === 0) {
                listElement.html('<div class="snsp-empty-list">Không có notepad nào.</div>');
                return;
            }
            
            // Thêm các notepad mới
            $.each(this.state.notepads, function(i, notepad) {
                const isActive = self.state.currentNotepadId === notepad.id;
                const isFavorite = notepad.is_favorite == 1;
                const hasExpiry = notepad.expires_at !== null;
                
                const itemHtml = `
                    <div class="snsp-list-item ${isActive ? 'active' : ''}" data-id="${notepad.id}">
                        <div class="snsp-list-item-title">
                            ${self.escapeHtml(notepad.title)}
                            ${isFavorite ? '<span class="snsp-favorite"><i class="dashicons dashicons-star-filled"></i></span>' : ''}
                        </div>
                        <div class="snsp-list-item-meta">
                            Cập nhật: ${self.formatDate(notepad.updated_at)}
                            ${hasExpiry ? '<span class="snsp-expired"><i class="dashicons dashicons-clock"></i> ' + self.formatDate(notepad.expires_at) + '</span>' : ''}
                        </div>
                    </div>
                `;
                
                listElement.append(itemHtml);
            });
            
            // Đăng ký sự kiện click vào notepad
            listElement.find('.snsp-list-item').on('click', function() {
                const id = $(this).data('id');
                self.loadNotepad(id);
            });
        },
        
        // Hiển thị danh sách notepad được chia sẻ
        renderSharedNotepadList: function() {
            const self = this;
            const listElement = this.elements.sharedNotepadList.find('.snsp-list-items');
            
            // Xóa danh sách cũ
            listElement.empty();
            
            if (this.state.sharedNotepads.length === 0) {
                listElement.html('<div class="snsp-empty-list">Không có notepad được chia sẻ.</div>');
                return;
            }
            
            // Thêm các notepad mới
            $.each(this.state.sharedNotepads, function(i, notepad) {
                const isActive = self.state.currentNotepadId === notepad.id;
                
                const itemHtml = `
                    <div class="snsp-list-item ${isActive ? 'active' : ''}" data-id="${notepad.id}">
                        <div class="snsp-list-item-title">
                            ${self.escapeHtml(notepad.title)}
                            <span class="snsp-shared"><i class="dashicons dashicons-share"></i></span>
                        </div>
                        <div class="snsp-list-item-meta">
                            Chia sẻ bởi: ${self.escapeHtml(notepad.owner_name)}
                            <span class="snsp-permission-${notepad.can_edit ? 'edit' : 'view'}">
                                <i class="dashicons dashicons-${notepad.can_edit ? 'edit' : 'visibility'}"></i>
                            </span>
                        </div>
                    </div>
                `;
                
                listElement.append(itemHtml);
            });
            
            // Đăng ký sự kiện click vào notepad
            listElement.find('.snsp-list-item').on('click', function() {
                const id = $(this).data('id');
                self.loadNotepad(id);
            });
        },
        
        // Tải một notepad
        loadNotepad: function(id) {
            const self = this;
            
            // Kiểm tra nếu có thay đổi chưa lưu
            if (this.state.hasUnsavedChanges && this.state.currentNotepadId) {
                if (!confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn chuyển sang notepad khác?')) {
                    return;
                }
            }
            
            $.ajax({
                url: snspData.ajaxUrl + 'get/' + id,
                method: 'GET',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', snspData.nonce);
                },
                success: function(response) {
                    if (response.success && response.notepad) {
                        self.displayNotepad(response.notepad, response.access, response.shares);
                        self.state.currentNotepadId = id;
                        self.state.hasUnsavedChanges = false;
                        self.updateSaveButtonState();
                        
                        // Cập nhật danh sách
                        self.renderNotepadList();
                        self.renderSharedNotepadList();
                    }
                },
                error: function() {
                    self.showMessage('Không thể tải notepad.', 'error');
                }
            });
        },
        
        // Hiển thị notepad
        displayNotepad: function(notepad, access, shares) {
            // Cập nhật tiêu đề
            this.elements.titleInput.val(notepad.title);
            
            // Cập nhật nội dung
            if (window.SNSPEditor) {
                window.SNSPEditor.setContent(notepad.content);
            } else {
                this.elements.contentTextarea.val(notepad.content);
            }
            
            // Cập nhật nút yêu thích
            this.updateFavoriteButton(notepad.is_favorite == 1);
            
            // Cập nhật nút hết hạn
            this.updateExpiryButton(notepad.expires_at);
            
            // Cập nhật quyền truy cập
            this.updateAccessControls(access);
            
            // Cập nhật danh sách chia sẻ nếu có
            if (access === 'owner' && shares) {
                this.renderSharesList(shares);
            }
            
            // Hiển thị editor
            this.elements.notepadEditor.show();
        },
        
        // Cập nhật trạng thái nút lưu
        updateSaveButtonState: function() {
            if (this.state.hasUnsavedChanges) {
                this.elements.saveBtn.prop('disabled', false);
            } else {
                this.elements.saveBtn.prop('disabled', true);
            }
        },
        
        // Cập nhật trạng thái nút yêu thích
        updateFavoriteButton: function(isFavorite) {
            if (isFavorite) {
                this.elements.favoriteBtn
                    .addClass('snsp-favorite-active')
                    .html('<i class="dashicons dashicons-star-filled"></i> Bỏ yêu thích');
            } else {
                this.elements.favoriteBtn
                    .removeClass('snsp-favorite-active')
                    .html('<i class="dashicons dashicons-star-empty"></i> Yêu thích');
            }
        },
        
        // Cập nhật trạng thái nút thời gian hết hạn
        updateExpiryButton: function(expiryDate) {
            if (expiryDate) {
                this.elements.expiryBtn
                    .addClass('snsp-expiry-active')
                    .html('<i class="dashicons dashicons-clock"></i> ' + this.formatDate(expiryDate));
            } else {
                this.elements.expiryBtn
                    .removeClass('snsp-expiry-active')
                    .html('<i class="dashicons dashicons-clock"></i> Đặt hạn');
            }
        },
        
        // Cập nhật quyền truy cập
        updateAccessControls: function(access) {
            // Ẩn tất cả các nút không cần thiết
            this.elements.titleInput.prop('disabled', access !== 'owner');
            this.elements.favoriteBtn.toggle(access === 'owner');
            this.elements.deleteBtn.toggle(access === 'owner');
            this.elements.shareBtn.toggle(access === 'owner');
            this.elements.expiryBtn.toggle(access === 'owner');
            
            // Hiển thị các nút thích hợp
            this.elements.saveBtn.toggle(access === 'owner' || access === 'editor');
        },
        
        // Tạo notepad mới
        createNewNotepad: function() {
            const self = this;
            
            // Kiểm tra nếu có thay đổi chưa lưu
            if (this.state.hasUnsavedChanges && this.state.currentNotepadId) {
                if (!confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn tạo notepad mới?')) {
                    return;
                }
            }
            
            $.ajax({
                url: snspData.ajaxUrl + 'create',
                method: 'POST',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', snspData.nonce);
                },
                data: {
                    title: 'Notepad mới'
                },
                success: function(response) {
                    if (response.success && response.notepad_id) {
                        self.showMessage('Đã tạo notepad mới thành công.', 'success');
                        
                        // Tải lại danh sách và mở notepad mới
                        self.loadNotepadList();
                        self.loadNotepad(response.notepad_id);
                    }
                },
                error: function() {
                    self.showMessage('Không thể tạo notepad mới.', 'error');
                }
            });
        },
        
        // Lưu notepad hiện tại
        saveCurrentNotepad: function() {
            const self = this;
            const id = this.state.currentNotepadId;
            
            if (!id) {
                return;
            }
            
            const title = this.elements.titleInput.val();
            const content = window.SNSPEditor ? window.SNSPEditor.getContent() : this.elements.contentTextarea.val();
            
            $.ajax({
                url: snspData.ajaxUrl + 'update/' + id,
                method: 'POST',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', snspData.nonce);
                },
                data: {
                    title: title,
                    content: content
                },
                success: function(response) {
                    if (response.success) {
                        self.showMessage('Đã lưu notepad thành công.', 'success');
                        self.state.hasUnsavedChanges = false;
                        self.updateSaveButtonState();
                        
                        // Cập nhật danh sách
                        self.loadNotepadList();
                    }
                },
                error: function() {
                    self.showMessage('Không thể lưu notepad.', 'error');
                }
            });
        },
        
        // Xóa notepad hiện tại
        deleteCurrentNotepad: function() {
            const self = this;
            const id = this.state.currentNotepadId;
            
            if (!id) {
                return;
            }
            
            if (!confirm('Bạn có chắc chắn muốn xóa notepad này? Hành động này không thể hoàn tác.')) {
                return;
            }
            
            $.ajax({
                url: snspData.ajaxUrl + 'delete/' + id,
                method: 'DELETE',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', snspData.nonce);
                },
                success: function(response) {
                    if (response.success) {
                        self.showMessage('Đã xóa notepad thành công.', 'success');
                        self.state.currentNotepadId = null;
                        self.state.hasUnsavedChanges = false;
                        
                        // Tải lại danh sách
                        self.loadNotepadList();
                    }
                },
                error: function() {
                    self.showMessage('Không thể xóa notepad.', 'error');
                }
            });
        },
        
        // Đánh dấu yêu thích
        toggleFavorite: function() {
            const self = this;
            const id = this.state.currentNotepadId;
            
            if (!id) {
                return;
            }
            
            $.ajax({
                url: snspData.ajaxUrl + 'toggle-favorite/' + id,
                method: 'POST',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', snspData.nonce);
                },
                success: function(response) {
                    if (response.success) {
                        self.showMessage(response.message, 'success');
                        
                        // Cập nhật UI
                        self.updateFavoriteButton(response.is_favorite);
                        
                        // Tải lại danh sách
                        self.loadNotepadList();
                    }
                },
                error: function() {
                    self.showMessage('Không thể thay đổi trạng thái yêu thích.', 'error');
                }
            });
        },
                // Hiển thị modal đặt thời gian hết hạn
        showExpiryModal: function() {
            const self = this;
            const id = this.state.currentNotepadId;
            
            if (!id) {
                return;
            }
            
            // Tạo modal
            const modalHtml = `
                <div class="snsp-modal-backdrop">
                    <div class="snsp-modal">
                        <div class="snsp-modal-header">
                            <h3 class="snsp-modal-title">Đặt thời gian hết hạn</h3>
                            <button class="snsp-modal-close">&times;</button>
                        </div>
                        <div class="snsp-modal-body">
                            <div class="snsp-form-group">
                                <label class="snsp-form-label">Ngày hết hạn:</label>
                                <input type="text" id="snsp-expiry-date" class="snsp-form-input" placeholder="YYYY-MM-DD">
                            </div>
                            <div class="snsp-form-group">
                                <label class="snsp-form-label">Giờ hết hạn:</label>
                                <input type="time" id="snsp-expiry-time" class="snsp-form-input">
                            </div>
                            <p class="snsp-form-help">Notepad sẽ tự động bị xóa sau thời gian này.</p>
                        </div>
                        <div class="snsp-modal-footer">
                            <button class="snsp-btn snsp-btn-light snsp-modal-cancel">Hủy</button>
                            <button class="snsp-btn snsp-btn-danger snsp-expiry-remove-btn">Xóa hạn</button>
                            <button class="snsp-btn snsp-btn-primary snsp-expiry-save-btn">Lưu</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Thêm modal vào trang
            $('body').append(modalHtml);
            
            // Datepicker cho trường ngày
            $('#snsp-expiry-date').datepicker({
                dateFormat: 'yy-mm-dd',
                changeMonth: true,
                changeYear: true,
                minDate: 0
            });
            
            // Đóng modal
            $('.snsp-modal-close, .snsp-modal-cancel').on('click', function() {
                $('.snsp-modal-backdrop').remove();
            });
            
            // Xóa hạn
            $('.snsp-expiry-remove-btn').on('click', function() {
                $('.snsp-modal-backdrop').remove();
                self.removeExpiry();
            });
            
            // Lưu thời gian hết hạn
            $('.snsp-expiry-save-btn').on('click', function() {
                const date = $('#snsp-expiry-date').val();
                const time = $('#snsp-expiry-time').val() || '23:59';
                
                if (!date) {
                    self.showMessage('Vui lòng chọn ngày hết hạn.', 'error');
                    return;
                }
                
                const expiryDate = date + ' ' + time + ':00';
                self.setExpiry(expiryDate);
                $('.snsp-modal-backdrop').remove();
            });
        },
        
        // Đặt thời gian hết hạn
        setExpiry: function(expiryDate) {
            const self = this;
            const id = this.state.currentNotepadId;
            
            if (!id) {
                return;
            }
            
            $.ajax({
                url: snspData.ajaxUrl + 'set-expiry/' + id,
                method: 'POST',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', snspData.nonce);
                },
                data: {
                    expires_at: expiryDate
                },
                success: function(response) {
                    if (response.success) {
                        self.showMessage('Đã đặt thời gian hết hạn.', 'success');
                        
                        // Cập nhật UI
                        self.updateExpiryButton(expiryDate);
                        
                        // Tải lại danh sách
                        self.loadNotepadList();
                    }
                },
                error: function() {
                    self.showMessage('Không thể đặt thời gian hết hạn.', 'error');
                }
            });
        },
        
        // Xóa thời gian hết hạn
        removeExpiry: function() {
            const self = this;
            const id = this.state.currentNotepadId;
            
            if (!id) {
                return;
            }
            
            $.ajax({
                url: snspData.ajaxUrl + 'set-expiry/' + id,
                method: 'POST',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', snspData.nonce);
                },
                data: {
                    expires_at: null
                },
                success: function(response) {
                    if (response.success) {
                        self.showMessage('Đã xóa thời gian hết hạn.', 'success');
                        
                        // Cập nhật UI
                        self.updateExpiryButton(null);
                        
                        // Tải lại danh sách
                        self.loadNotepadList();
                    }
                },
                error: function() {
                    self.showMessage('Không thể xóa thời gian hết hạn.', 'error');
                }
            });
        },
        
        // Tải xuống notepad
        downloadNotepad: function() {
            const title = this.elements.titleInput.val() || 'notepad';
            const content = window.SNSPEditor ? window.SNSPEditor.getContent() : this.elements.contentTextarea.val();
            
            if (!content) {
                this.showMessage('Không có nội dung để tải xuống.', 'error');
                return;
            }
            
            // Tạo blob và tạo URL
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            // Tạo thẻ a và kích hoạt tải xuống
            const a = document.createElement('a');
            a.href = url;
            a.download = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.txt';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('Đã tải xuống tệp!', 'success');
        },
        
        // Xóa nội dung
        clearNotepadContent: function() {
            if (!confirm('Bạn có chắc chắn muốn xóa tất cả nội dung?')) {
                return;
            }
            
            if (window.SNSPEditor) {
                window.SNSPEditor.clearContent();
            } else {
                this.elements.contentTextarea.val('');
                this.elements.contentTextarea.trigger('change');
            }
            
            this.showMessage('Đã xóa nội dung.', 'success');
        },
        
        // Hiển thị/ẩn panel chia sẻ
        toggleSharePanel: function() {
            const sharesPanel = $('.snsp-shares-panel');
            
            if (sharesPanel.is(':visible')) {
                sharesPanel.slideUp();
            } else {
                sharesPanel.slideDown();
            }
        },
        
        // Chia sẻ notepad
        shareNotepad: function() {
            const self = this;
            const id = this.state.currentNotepadId;
            
            if (!id) {
                return;
            }
            
            const email = this.elements.shareEmail.val();
            const canEdit = this.elements.shareCanEdit.is(':checked');
            
            if (!email) {
                this.showMessage('Vui lòng nhập email người dùng.', 'error');
                return;
            }
            
            $.ajax({
                url: snspData.ajaxUrl + 'share/' + id,
                method: 'POST',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', snspData.nonce);
                },
                data: {
                    email: email,
                    can_edit: canEdit
                },
                success: function(response) {
                    if (response.success) {
                        self.showMessage('Đã chia sẻ notepad thành công.', 'success');
                        
                        // Xóa form
                        self.elements.shareEmail.val('');
                        self.elements.shareCanEdit.prop('checked', false);
                        
                        // Tải lại notepad để lấy danh sách chia sẻ mới
                        self.loadNotepad(id);
                    } else if (response.message) {
                        self.showMessage(response.message, 'error');
                    }
                },
                error: function(xhr) {
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        self.showMessage(xhr.responseJSON.message, 'error');
                    } else {
                        self.showMessage('Không thể chia sẻ notepad.', 'error');
                    }
                }
            });
        },
        
        // Hiển thị danh sách chia sẻ
        renderSharesList: function(shares) {
            const self = this;
            const listElement = this.elements.sharesList;
            
            // Xóa danh sách cũ
            listElement.empty();
            
            if (shares.length === 0) {
                listElement.html('<div class="snsp-empty-shares">Notepad này chưa được chia sẻ với ai.</div>');
                return;
            }
            
            // Thêm các chia sẻ mới
            $.each(shares, function(i, share) {
                const itemHtml = `
                    <div class="snsp-share-item" data-id="${share.id}">
                        <div class="snsp-share-user">
                            <div class="snsp-share-avatar">${share.display_name.charAt(0).toUpperCase()}</div>
                            <div>
                                <div class="snsp-share-name">${self.escapeHtml(share.display_name)}</div>
                                <div class="snsp-share-email">${self.escapeHtml(share.user_email)}</div>
                            </div>
                        </div>
                        <div class="snsp-share-permissions">
                            <div class="snsp-share-permission snsp-permission-${share.can_edit ? 'edit' : 'view'}">
                                ${share.can_edit ? 'Chỉnh sửa' : 'Chỉ xem'}
                            </div>
                            <button class="snsp-btn snsp-btn-danger snsp-btn-sm snsp-unshare-btn" data-share-id="${share.id}">
                                <i class="dashicons dashicons-no"></i> Hủy chia sẻ
                            </button>
                        </div>
                    </div>
                `;
                
                listElement.append(itemHtml);
            });
            
            // Đăng ký sự kiện hủy chia sẻ
            listElement.find('.snsp-unshare-btn').on('click', function(e) {
                e.preventDefault();
                const shareId = $(this).data('share-id');
                self.unshareNotepad(shareId);
            });
        },
        
        // Hủy chia sẻ notepad
        unshareNotepad: function(shareId) {
            const self = this;
            const id = this.state.currentNotepadId;
            
            if (!id || !shareId) {
                return;
            }
            
            if (!confirm('Bạn có chắc chắn muốn hủy chia sẻ với người dùng này?')) {
                return;
            }
            
            $.ajax({
                url: snspData.ajaxUrl + 'unshare/' + id,
                method: 'POST',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', snspData.nonce);
                },
                data: {
                    share_id: shareId
                },
                success: function(response) {
                    if (response.success) {
                        self.showMessage('Đã hủy chia sẻ notepad.', 'success');
                        
                        // Tải lại notepad để cập nhật danh sách chia sẻ
                        self.loadNotepad(id);
                    }
                },
                error: function() {
                    self.showMessage('Không thể hủy chia sẻ notepad.', 'error');
                }
            });
        },
        
        // Hiển thị thông báo
        showMessage: function(message, type = 'success') {
            // Dùng SNSPEditor nếu có
            if (window.SNSPEditor) {
                window.SNSPEditor.showMessage(message, type);
                return;
            }
            
            // Nếu không, tự xử lý
            const messageDisplay = this.elements.messageDisplay;
            const colors = {
                success: 'green',
                error: 'red',
                info: 'blue',
                warning: 'orange'
            };
            
            messageDisplay.text(message);
            messageDisplay.css('color', colors[type] || colors.info);
            
            clearTimeout(this.messageTimeout);
            this.messageTimeout = setTimeout(() => {
                messageDisplay.text('');
            }, 5000);
        },
        
        // Hiển thị trạng thái trống
        showEmptyState: function() {
            this.elements.notepadEditor.hide();
            
            // Hiển thị thông báo trống
            const emptyHtml = `
                <div class="snsp-empty-state">
                    <h3>Không có notepad nào</h3>
                    <p>Tạo notepad mới để bắt đầu.</p>
                    <button class="snsp-btn snsp-btn-primary snsp-create-notepad-btn">
                        <i class="dashicons dashicons-plus"></i> Tạo notepad mới
                    </button>
                </div>
            `;
            
            $('.snsp-content').prepend(emptyHtml);
            
            // Đăng ký sự kiện tạo notepad
            $('.snsp-create-notepad-btn').on('click', () => {
                this.createNewNotepad();
            });
        },
        
        // Format date
        formatDate: function(dateString) {
            if (!dateString) return '';
            
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        },
        
        // Escape HTML
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };
    
    // Khởi tạo quản lý notepad
    $(document).ready(function() {
        NotepadManager.init();
    });
    
})(jQuery);

      