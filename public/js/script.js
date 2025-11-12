// 配置管理
const Config = {
    validation: {
        email: {
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            messages: {
                required: '请输入邮箱地址',
                invalid: '请输入有效的邮箱地址'
            }
        },
        password: {
            minLength: 6,
            maxLength: 32,
            messages: {
                required: '请输入密码',
                minLength: '密码至少需要6个字符',
                maxLength: '密码不能超过32个字符'
            }
        },
        nickname: {
            minLength: 2,
            maxLength: 20,
            messages: {
                required: '请输入昵称',
                minLength: '昵称至少需要2个字符',
                maxLength: '昵称不能超过20个字符'
            }
        },
        verificationCode: {
            length: 6,
            messages: {
                required: '请输入验证码',
                invalid: '验证码应为6位数字'
            }
        }
    },
    api: {
        baseUrl: 'https://api.akihafield.com',
        endpoints: {
            login: '/auth/login',
            register: '/auth/register',
            forgotPassword: '/auth/forgot-password',
            resetPassword: '/auth/reset-password'
        }
    }
};

// 表单验证器
class FormValidator {
    validateEmail(email) {
        if (!email) {
            return { isValid: false, message: Config.validation.email.messages.required };
        }
        if (!Config.validation.email.regex.test(email)) {
            return { isValid: false, message: Config.validation.email.messages.invalid };
        }
        return { isValid: true };
    }

    validatePassword(password) {
        if (!password) {
            return { isValid: false, message: Config.validation.password.messages.required };
        }
        if (password.length < Config.validation.password.minLength) {
            return { isValid: false, message: Config.validation.password.messages.minLength };
        }
        if (password.length > Config.validation.password.maxLength) {
            return { isValid: false, message: Config.validation.password.messages.maxLength };
        }
        return { isValid: true };
    }

    validateNickname(nickname) {
        if (!nickname) {
            return { isValid: false, message: Config.validation.nickname.messages.required };
        }
        if (nickname.length < Config.validation.nickname.minLength) {
            return { isValid: false, message: Config.validation.nickname.messages.minLength };
        }
        if (nickname.length > Config.validation.nickname.maxLength) {
            return { isValid: false, message: Config.validation.nickname.messages.maxLength };
        }
        return { isValid: true };
    }

    validateVerificationCode(code) {
        if (!code) {
            return { isValid: false, message: Config.validation.verificationCode.messages.required };
        }
        if (!/^\d{6}$/.test(code)) {
            return { isValid: false, message: Config.validation.verificationCode.messages.invalid };
        }
        return { isValid: true };
    }
}

// 密码强度检测器
class PasswordStrengthChecker {
    checkStrength(password) {
        if (!password) return { level: 'weak', percentage: 0, text: '弱', class: 'weak', color: '#e74c3c' };

        let strength = 0;
        const checks = [
            { test: /.{8,}/, weight: 25 },
            { test: /[a-z]/, weight: 15 },
            { test: /[A-Z]/, weight: 15 },
            { test: /[0-9]/, weight: 15 },
            { test: /[^a-zA-Z0-9]/, weight: 15 },
            { test: /.{12,}/, weight: 15 }
        ];

        checks.forEach(check => {
            if (check.test.test(password)) strength += check.weight;
        });

        // 限制最大强度为100%
        strength = Math.min(strength, 100);

        const levels = [
            { min: 0, max: 40, text: '弱', class: 'weak', color: '#e74c3c' },
            { min: 40, max: 70, text: '一般', class: 'medium', color: '#f39c12' },
            { min: 70, max: 100, text: '强', class: 'strong', color: '#2ecc71' }
        ];

        const level = levels.find(l => strength >= l.min && strength <= l.max) || levels[0];
        return { ...level, percentage: strength };
    }

    updateUI(password, strengthBarId = 'password-strength', strengthTextId = 'strength-text') {
        const result = this.checkStrength(password);
        const bar = document.querySelector(`#${strengthBarId} .strength-bar`);
        const text = document.getElementById(strengthTextId);
        
        if (bar) {
            bar.className = 'strength-bar';
            bar.classList.add(result.class);
            bar.style.width = `${result.percentage}%`;
            bar.style.backgroundColor = result.color;
        }
        if (text) {
            text.textContent = `密码强度：${result.text}`;
            text.style.color = result.color;
        }
        return result;
    }
}

// 表单处理器基类
class FormHandler {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.validator = new FormValidator();
        this.passwordChecker = new PasswordStrengthChecker();
        this.isSubmitting = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCustomCheckboxes();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.form.addEventListener('input', this.handleInput.bind(this));
        
        // 添加键盘事件支持
        this.form.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isSubmitting) {
                this.form.requestSubmit();
            }
        });
    }

    setupCustomCheckboxes() {
        const checkboxes = this.form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.validateCheckboxes();
            });
        });
    }

    handleInput(e) {
        const fieldName = e.target.name || e.target.id.replace(/^(login|register|forgot)-/, '');
        this.validateField(fieldName, e.target.value);
    }

    validateField(fieldName, value) {
        let result;
        
        switch (fieldName) {
            case 'email':
                result = this.validator.validateEmail(value);
                break;
            case 'password':
                result = this.validator.validatePassword(value);
                break;
            case 'nickname':
                result = this.validator.validateNickname(value);
                break;
            default:
                return;
        }

        this.updateFieldUI(fieldName, result);
    }

    updateFieldUI(fieldName, result, prefix = '') {
        const fieldId = prefix ? `${prefix}-${fieldName}` : `${this.form.id.replace('-form', '')}-${fieldName}`;
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (!field || !errorElement) return;

        field.classList.remove('valid', 'invalid');
        
        if (result.isValid) {
            field.classList.add('valid');
            this.hideError(errorElement);
        } else {
            field.classList.add('invalid');
            this.showError(errorElement, result.message);
        }
    }

    showError(element, message) {
        if (element) {
            element.textContent = message;
            element.classList.add('show');
        }
    }

    hideError(element) {
        if (element) {
            element.textContent = '';
            element.classList.remove('show');
        }
    }

    validateCheckboxes() {
        const loginAgreement1 = document.querySelector('input[name="agreement1"]');
        const loginAgreement2 = document.querySelector('input[name="agreement2"]');
        const registerAgreement1 = document.querySelector('input[name="register-agreement1"]');
        const registerAgreement2 = document.querySelector('input[name="register-agreement2"]');
        
        // 验证登录页面的协议
        if (loginAgreement1 && loginAgreement2) {
            const errorElement = document.getElementById('login-agreement-error');
            if (!loginAgreement1.checked || !loginAgreement2.checked) {
                this.showError(errorElement, '请同意所有协议');
            } else {
                this.hideError(errorElement);
            }
        }
        
        // 验证注册页面的协议
        if (registerAgreement1 && registerAgreement2) {
            const errorElement = document.getElementById('register-agreement-error');
            if (!registerAgreement1.checked || !registerAgreement2.checked) {
                this.showError(errorElement, '请同意所有协议');
            } else {
                this.hideError(errorElement);
            }
        }
    }

    setSubmitButton(submitting, buttonText = '提交') {
        const button = this.form.querySelector('button[type="submit"]');
        if (!button) return;

        if (submitting) {
            button.disabled = true;
            button.innerHTML = '<span class="loading"></span> 提交中...';
        } else {
            button.disabled = false;
            button.textContent = buttonText;
        }
    }

    showMessage(message, type) {
        // 移除现有的消息
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast. Text = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
            color: white;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }
        }, 3000);
    }

    validateAllFields() {
        let isValid = true;
        
        const inputs = this.form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
        inputs.forEach(input => {
            const fieldName = input.name || input.id.replace(/^(login|register|forgot)-/, '');
            this.validateField(fieldName, input.value);
            
            const errorElement = document.getElementById(`${input.id}-error`);
            if (errorElement && errorElement.classList.contains('show')) {
                isValid = false;
            }
        });
        
        this.validateCheckboxes();
        const agreementError = this.form.querySelector('.error-message.show');
        if (agreementError) {
            isValid = false;
        }
        
        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (this.isSubmitting) return;

        const isValid = this.validateAllFields();
        if (!isValid) {
            this.showMessage('请检查表单中的错误', 'error');
            return;
        }

        this.isSubmitting = true;
        this.setSubmitButton(true);

        try {
            // 模拟API调用
            await this.submitFormData();
            
            this.showMessage('操作成功！', 'success');
            this.form.reset();

            // 根据表单类型进行不同的重定向
            await this.handleFormSuccess();

        } catch (error) {
            console.error('表单提交错误:', error);
            this.showMessage('提交失败，请重试', 'error');
        } finally {
            this.isSubmitting = false;
            this.setSubmitButton(false);
        }
    }

    async submitFormData() {
        // 模拟网络延迟
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // 模拟随机失败
                if (Math.random() < 0.1) { // 10% 失败率用于测试
                    reject(new Error('网络错误'));
                } else {
                    resolve();
                }
            }, 1500);
        });
    }

    async handleFormSuccess() {
        const formId = this.form.id;
        
        if (formId === 'register-form') {
            setTimeout(() => {
                showLoginPage();
            }, 1000);
        }
        
        if (formId === 'login-form') {
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
        }
    }
}

// 注册表单处理器
class RegisterFormHandler extends FormHandler {
    constructor(formId) {
        super(formId);
    }

    init() {
        super.init();
        this.setupPasswordStrength();
        this.setupRealTimePasswordValidation();
    }

    setupPasswordStrength() {
        const passwordField = this.form.querySelector('#register-password');
        if (passwordField) {
            passwordField.addEventListener('input', (e) => {
                this.passwordChecker.updateUI(e.target.value);
            });
        }
    }

    setupRealTimePasswordValidation() {
        const passwordField = this.form.querySelector('#register-password');
        const confirmPasswordField = this.form.querySelector('#register-confirm-password');
        
        if (passwordField && confirmPasswordField) {
            passwordField.addEventListener('input', (e) => {
                this.validatePasswordMatch();
                this.passwordChecker.updateUI(e.target.value);
            });
            
            confirmPasswordField.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }
    }

    validatePasswordMatch() {
        const passwordField = this.form.querySelector('#register-password');
        const confirmPasswordField = this.form.querySelector('#register-confirm-password');
        const passwordError = document.getElementById('register-password-error');
        const confirmPasswordError = document.getElementById('register-confirm-password-error');
        
        if (!passwordField || !confirmPasswordField) return;
        
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        
        passwordField.classList.remove('invalid');
        confirmPasswordField.classList.remove('invalid');
        this.hideError(passwordError);
        this.hideError(confirmPasswordError);
        
        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordField.classList.add('invalid');
            this.showError(confirmPasswordError, '两次输入的密码不一致');
        }
        
        if (password && !confirmPassword) {
            this.showError(confirmPasswordError, '请确认密码');
        }
        
        if (password && confirmPassword && password === confirmPassword) {
            passwordField.classList.add('valid');
            confirmPasswordField.classList.add('valid');
            this.hideError(confirmPasswordError);
        }
    }

    validateAllFields() {
        let isValid = super.validateAllFields();
        
        const passwordField = this.form.querySelector('#register-password');
        const confirmPasswordField = this.form.querySelector('#register-confirm-password');
        const confirmPasswordError = document.getElementById('register-confirm-password-error');
        
        if (passwordField && confirmPasswordField && 
            passwordField.value && confirmPasswordField.value && 
            passwordField.value !== confirmPasswordField.value) {
            this.showError(confirmPasswordError, '两次输入的密码不一致');
            isValid = false;
        }
        
        return isValid;
    }
}

// 忘记密码表单处理器
class ForgotPasswordHandler extends FormHandler {
    constructor(formId) {
        super(formId);
    }

    init() {
        super.init();
        this.setupPasswordStrength();
        this.setupRealTimePasswordValidation();
    }

    setupPasswordStrength() {
        const passwordField = document.getElementById('new-password');
        if (passwordField) {
            passwordField.addEventListener('input', (e) => {
                this.passwordChecker.updateUI(e.target.value, 'new-password-strength', 'new-strength-text');
            });
        }
    }

    setupRealTimePasswordValidation() {
        const passwordField = document.getElementById('new-password');
        const confirmPasswordField = document.getElementById('confirm-new-password');
        
        if (passwordField && confirmPasswordField) {
            passwordField.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
            
            confirmPasswordField.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }
    }

    validatePasswordMatch() {
        const passwordField = document.getElementById('new-password');
        const confirmPasswordField = document.getElementById('confirm-new-password');
        const passwordError = document.getElementById('new-password-error');
        const confirmPasswordError = document.getElementById('confirm-new-password-error');
        
        if (!passwordField || !confirmPasswordField) return;
        
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        
        passwordField.classList.remove('invalid');
        confirmPasswordField.classList.remove('invalid');
        this.hideError(passwordError);
        this.hideError(confirmPasswordError);
        
        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordField.classList.add('invalid');
            this.showError(confirmPasswordError, '两次输入的密码不一致');
        }
        
        if (password && !confirmPassword) {
            this.showError(confirmPasswordError, '请确认密码');
        }
        
        if (password && confirmPassword && password === confirmPassword) {
            passwordField.classList.add('valid');
            confirmPasswordField.classList.add('valid');
            this.hideError(confirmPasswordError);
        }
    }

    validateAllFields() {
        let isValid = true;
        const validator = new FormValidator();
        
        const email = document.getElementById('forgot-email').value;
        const emailValidation = validator.validateEmail(email);
        this.updateFieldUI('email', emailValidation, 'forgot');
        if (!emailValidation.isValid) isValid = false;
        
        const code = document.getElementById('verification-code').value;
        const codeValidation = validator.validateVerificationCode(code);
        this.updateFieldUI('verification-code', codeValidation);
        if (!codeValidation.isValid) isValid = false;
        
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;
        const passwordValidation = validator.validatePassword(newPassword);
        this.updateFieldUI('new-password', passwordValidation);
        if (!passwordValidation.isValid) isValid = false;
        
        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            this.showError(document.getElementById('confirm-new-password-error'), '两次输入的密码不一致');
            isValid = false;
        }
        
        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (this.isSubmitting) return;

        const isValid = this.validateAllFields();
        if (!isValid) {
            this.showMessage('请检查表单中的错误', 'error');
            return;
        }

        this.isSubmitting = true;
        this.setSubmitButton(true, '重置密码');

        try {
            await this.submitFormData();
            this.showSuccessMessage();
            this.form.reset();

        } catch (error) {
            this.showMessage('重置密码失败，请重试', 'error');
        } finally {
            this.isSubmitting = false;
            this.setSubmitButton(false, '重置密码');
        }
    }

    showSuccessMessage() {
        const formContainer = this.form.closest('.form-container');
        const successHTML = `
            <div class="success-message">
                <div class="success-icon">✓</div>
                <h3>密码重置成功！</h3>
                <p>您的密码已成功重置，请使用新密码登录。</p>
                <button type="button" class="btn btn-login" onclick="showLoginPage()">立即登录</button>
            </div>
        `;
        
        formContainer.innerHTML = successHTML;
    }
}

// 应用主类
class AuthApp {
    constructor() {
        this.init();
    }

    init() {
        this.initializeForms();
        this.setupPageSwitching();
        this.setupForgotPassword();
        this.setupBackToTop();
        this.addCSRFToken();
    }

    initializeForms() {
        if (document.getElementById('login-form')) {
            new FormHandler('login-form');
        }
        
        if (document.getElementById('register-form')) {
            new RegisterFormHandler('register-form');
        }
        
        if (document.getElementById('forgot-password-form')) {
            new ForgotPasswordHandler('forgot-password-form');
        }
    }

    setupPageSwitching() {
        window.showRegisterPage = () => {
            this.animatePageTransition('login-page', 'register-page');
        };

        window.showLoginPage = () => {
            const fromPage = document.getElementById('register-page').style.display !== 'none' ? 
                'register-page' : 'forgot-password-page';
            this.animatePageTransition(fromPage, 'login-page');
        };

        window.showForgotPasswordPage = () => {
            this.animatePageTransition('login-page', 'forgot-password-page');
        };
    }

    animatePageTransition(hideId, showId) {
        const hidePage = document.getElementById(hideId);
        const showPage = document.getElementById(showId);
        
        if (!hidePage || !showPage) return;
        
        hidePage.style.opacity = '0';
        hidePage.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            hidePage.style.display = 'none';
            showPage.style.display = 'block';
            showPage.style.opacity = '0';
            showPage.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                showPage.style.opacity = '1';
                showPage.style.transform = 'translateX(0)';
            }, 50);
        }, 300);
    }

    setupForgotPassword() {
        const sendCodeBtn = document.getElementById('send-code-btn');
        if (sendCodeBtn) {
            sendCodeBtn.addEventListener('click', this.handleSendVerificationCode.bind(this));
        }
    }

    handleSendVerificationCode() {
        const emailField = document.getElementById('forgot-email');
        const email = emailField.value;
        const sendCodeBtn = document.getElementById('send-code-btn');
        
        const validator = new FormValidator();
        const emailValidation = validator.validateEmail(email);
        
        if (!emailValidation.isValid) {
            this.showMessage(emailValidation.message, 'error');
            return;
        }
        
        this.startCountdown(sendCodeBtn);
        
        console.log(`向 ${email} 发送验证码`);
        this.showMessage('验证码已发送到您的邮箱，请查收', 'success');
        
        // 模拟验证码（实际项目中应该通过后端发送）
        setTimeout(() => {
            this.showMessage('模拟验证码：123456', 'success');
        }, 1000);
    }

    startCountdown(button) {
        let countdown = 60;
        button.disabled = true;
        button.textContent = `${countdown}秒后重新发送`;
        
        const timer = setInterval(() => {
            countdown--;
            button.textContent = `${countdown}秒后重新发送`;
            
            if (countdown <= 0) {
                clearInterval(timer);
                button.disabled = false;
                button.textContent = '发送验证码';
            }
        }, 1000);
    }

    setupBackToTop() {
        const backToTopBtn = document.querySelector('.back-to-top');
        if (backToTopBtn) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    backToTopBtn.classList.add('visible');
                } else {
                    backToTopBtn.classList.remove('visible');
                }
            });

            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    addCSRFToken() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const csrfToken = this.generateCSRFToken();
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'csrf_token';
            input.value = csrfToken;
            form.appendChild(input);
        });
    }

    generateCSRFToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    showMessage(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast. Text = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
            color: white;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }
        }, 3000);
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new AuthApp();
});

// 全局页面切换函数
function showRegisterPage() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('register-page').style.display = 'block';
    document.getElementById('forgot-password-page').style.display = 'none';
}

function showLoginPage() {
    document.getElementById('register-page').style.display = 'none';
    document.getElementById('login-page').style.display = 'block';
    document.getElementById('forgot-password-page').style.display = 'none';
}

function showForgotPasswordPage() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('register-page').style.display = 'none';
    document.getElementById('forgot-password-page').style.display = 'block';
}