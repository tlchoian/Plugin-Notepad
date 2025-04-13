/**
 * Secure Notepad Storage Pro - Notepad Editor
 * © 2025 Fx Digital. All rights reserved.
 */

(function($) {
    'use strict';
    
    // Đối tượng NotepadEditor
    const NotepadEditor = {
        // Các phần tử DOM
        elements: {
            textarea: null,
            passwordInput: null,
            togglePasswordBtn: null,
            encryptBtn: null,
            decryptBtn: null,
            saveBtn: null,
            messageDisplay: null
        },
        
        // Khởi tạo editor
        init: function(config) {
            // Thiết lập phần tử DOM
            this.elements = {
                textarea: document.getElementById(config.textareaId),
                passwordInput: document.getElementById(config.passwordInputId),
                togglePasswordBtn: document.getElementById(config.togglePasswordBtnId),
                encryptBtn: document.getElementById(config.encryptBtnId),
                decryptBtn: document.getElementById(config.decryptBtnId),
                saveBtn: document.getElementById(config.saveBtnId),
                messageDisplay: document.getElementById(config.messageDisplayId)
            };
            
            // Đăng ký các sự kiện
            this.registerEvents();
            
            // Đánh dấu đã khởi tạo
            this.isInitialized = true;
            
            return this;
        },
        
        // Đăng ký các sự kiện
        registerEvents: function() {
            const self = this;
            
            // Toggle hiển thị mật khẩu
            this.elements.togglePasswordBtn.addEventListener('click', function() {
                self.togglePasswordVisibility();
            });
            
            // Mã hóa nội dung
            this.elements.encryptBtn.addEventListener('click', function() {
                self.encryptContent();
            });
            
            // Giải mã nội dung
            this.elements.decryptBtn.addEventListener('click', function() {
                self.decryptContent();
            });
        },
        
        // Toggle hiển thị mật khẩu
        togglePasswordVisibility: function() {
            const input = this.elements.passwordInput;
            const button = this.elements.togglePasswordBtn;
            
            if (input.type === 'password') {
                input.type = 'text';
                button.textContent = 'Ẩn';
            } else {
                input.type = 'password';
                button.textContent = 'Hiện';
            }
        },
        
        // Hiển thị thông báo
        showMessage: function(message, type = 'success') {
            const messageDisplay = this.elements.messageDisplay;
            const colors = {
                success: 'green',
                error: 'red',
                info: 'blue',
                warning: 'orange'
            };
            
            messageDisplay.textContent = message;
            messageDisplay.style.color = colors[type] || colors.info;
            
            clearTimeout(this.messageTimeout);
            this.messageTimeout = setTimeout(() => {
                messageDisplay.textContent = '';
            }, 5000);
        },
        
        // Sử dụng PBKDF2 để tạo khóa mạnh hơn từ mật khẩu
        deriveKey: function(password, salt) {
            return CryptoJS.PBKDF2(password, salt, {
                keySize: 256 / 32,
                iterations: 10000
            });
        },
        
        // Mã hóa với salt và vector khởi tạo
        encryptWithSalt: function(text, password) {
            const salt = CryptoJS.lib.WordArray.random(128 / 8);
            const iv = CryptoJS.lib.WordArray.random(128 / 8);
            const key = this.deriveKey(password, salt);
            
            const encrypted = CryptoJS.AES.encrypt(text, key, {
                iv: iv,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            });
            
            // Kết hợp salt, iv và ciphertext để lưu trữ
            return salt.toString() + iv.toString() + encrypted.toString();
        },
        
        // Giải mã với salt và vector khởi tạo
        decryptWithSalt: function(ciphertext, password) {
            try {
                // Tách salt, iv, và ciphertext
                const salt = CryptoJS.enc.Hex.parse(ciphertext.substr(0, 32));
                const iv = CryptoJS.enc.Hex.parse(ciphertext.substr(32, 32));
                const encrypted = ciphertext.substring(64);
                
                const key = this.deriveKey(password, salt);
                
                const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
                    iv: iv,
                    padding: CryptoJS.pad.Pkcs7,
                    mode: CryptoJS.mode.CBC
                });
                
                return decrypted.toString(CryptoJS.enc.Utf8);
            } catch (e) {
                console.error("Decryption error:", e);
                return null;
            }
        },
        
        // Mã hóa nội dung
        encryptContent: function() {
            const content = this.elements.textarea.value;
            const password = this.elements.passwordInput.value;
            
            if (!content) {
                this.showMessage('Vui lòng nhập nội dung để mã hóa.', 'error');
                return;
            }
            
            if (!password) {
                this.showMessage('Vui lòng nhập mật khẩu để mã hóa.', 'error');
                return;
            }
            
            try {
                const encrypted = this.encryptWithSalt(content, password);
                this.elements.textarea.value = encrypted;
                this.showMessage('Nội dung đã được mã hóa thành công!', 'success');
                
                // Kích hoạt sự kiện thay đổi nội dung
                $(this.elements.textarea).trigger('change');
            } catch (error) {
                this.showMessage('Lỗi khi mã hóa: ' + error.message, 'error');
            }
        },
        
        // Giải mã nội dung
        decryptContent: function() {
            const content = this.elements.textarea.value;
            const password = this.elements.passwordInput.value;
            
            if (!content) {
                this.showMessage('Vui lòng nhập nội dung để giải mã.', 'error');
                return;
            }
            
            if (!password) {
                this.showMessage('Vui lòng nhập mật khẩu để giải mã.', 'error');
                return;
            }
            
            try {
                const decrypted = this.decryptWithSalt(content, password);
                
                if (!decrypted) {
                    this.showMessage('Không thể giải mã. Mật khẩu không chính xác.', 'error');
                    return;
                }
                
                this.elements.textarea.value = decrypted;
                this.showMessage('Nội dung đã được giải mã thành công!', 'success');
                
                // Kích hoạt sự kiện thay đổi nội dung
                $(this.elements.textarea).trigger('change');
            } catch (error) {
                this.showMessage('Lỗi khi giải mã. Hãy kiểm tra lại mật khẩu hoặc nội dung.', 'error');
            }
        },
        
        // Đặt nội dung
        setContent: function(content) {
            if (this.elements.textarea) {
                this.elements.textarea.value = content || '';
            }
        },
        
        // Lấy nội dung
        getContent: function() {
            return this.elements.textarea ? this.elements.textarea.value : '';
        },
        
        // Xóa nội dung
        clearContent: function() {
            if (this.elements.textarea) {
                this.elements.textarea.value = '';
                $(this.elements.textarea).trigger('change');
            }
        }
    };
    
    // Xuất đối tượng NotepadEditor ra global
    window.SNSPEditor = NotepadEditor;
    
})(jQuery);