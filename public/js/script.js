// 配置管理 - 使用Object.freeze防止修改，提升访问性能
const Config = Object.freeze({
    validation: Object.freeze({
        email: Object.freeze({
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            messages: Object.freeze({
                required: '请输入邮箱地址',
                invalid: '请输入有效的邮箱地址'
            })
        }),
        password: Object.freeze({
            minLength: 6,
            maxLength: 32,
            messages: Object.freeze({
                required: '请输入密码',
                minLength: '密码至少需要6个字符',
                maxLength: '密码不能超过32个字符'
            })
        }),
        nickname: Object.freeze({
            minLength: 2,
            maxLength: 20,
            messages: Object.freeze({
                required: '请输入昵称',
                minLength: '昵称至少需要2个字符',
                maxLength: '昵称不能超过20个字符'
            })
        }),
        verificationCode: Object.freeze({
            length: 6,
            messages: Object.freeze({
                required: '请输入验证码',
                invalid: '验证码应为6位数字'
            })
        })
    }),
    api: Object.freeze({
        baseUrl: 'https://api.akihafield.com',
        endpoints: Object.freeze({
            login: '/auth/login',
            register: '/auth/register',
            forgotPassword: '/auth/forgot-password',
            resetPassword: '/auth/reset-password'
        })
    })
});

// 预编译正则表达式和缓存常用值
const VALIDATION_REGEX = {
    email: Config.validation.email.regex,
    verificationCode: /^\d{6}$/
};

// 密码强度检测器 - 优化计算逻辑
class PasswordStrengthChecker {
    constructor() {
        // 预定义检查项，避免每次调用时重新创建
        this.checks = Object.freeze([
            { test: /.{8,}/, weight: 25 },
            { test: /[a-z]/, weight: 15 },
            { test: /[A-Z]/, weight: 15 },
            { test: /[0-9]/, weight: 15 },
            { test: /[^a-zA-Z0-9]/, weight: 15 },
            { test: /.{12,}/, weight: 15 }
        ]);
        
        this.levels = Object.freeze([
            { min: 0, max: 40, text: '弱', class: 'weak', color: '#e74c3c' },
            { min: 40, max: 70, text: '一般', class: 'medium', color: '#f39c12' },
            { min: 70, max: 100, text: '强', class: 'strong', color: '#2ecc71' }
        ]);
        
        this.defaultResult = Object.freeze({ level: 'weak', percentage: 0, text: '弱', class: 'weak', color: '#e74c3c' });
    }

    checkStrength(password) {
        if (!password) return this.defaultResult;

        let strength = 0;
        
        // 使用for循环替代forEach，性能更好
        for (let i = 0; i < this.checks.length; i++) {
            const check = this.checks[i];
            if (check.test.test(password)) {
                strength += check.weight;
            }
        }

        strength = Math.min(strength, 100);

        // 使用find替代循环查找
        const level = this.levels.find(l => strength >= l.min && strength <= l.max) || this.levels[0];
        return { ...level, percentage: strength };
    }

    updateUI(password, strengthBarId = 'password-strength', strengthTextId = 'strength-text') {
        const result = this.checkStrength(password);
        
        // 批量DOM操作，减少重排重绘
        const bar = document.querySelector(`#${strengthBarId} .strength-bar`);
        const text = document.getElementById(strengthTextId);
        
        if (bar) {
            bar.className = 'strength-bar ' + result.class;
            bar.style.cssText = `width: ${result.percentage}%; background-color: ${result.color};`;
        }
        
        if (text) {
            text.textContent = `密码强度：${result.text}`;
            text.style.color = result.color;
        }
        
        return result;
    }
}

// 表单验证器 - 优化验证逻辑
class FormValidator {
    validateEmail(email) {
        if (!email) {
            return { isValid: false, message: Config.validation.email.messages.required };
        }
        if (!VALIDATION_REGEX.email.test(email)) {
            return { isValid: false, message: Config.validation.email.messages.invalid };
        }
        return { isValid: true };
    }

    validatePassword(password) {
        if (!password) {
            return { isValid: false, message: Config.validation.password.messages.required };
        }
        const { minLength, maxLength, messages } = Config.validation.password;
        if (password.length < minLength) {
            return { isValid: false, message: messages.minLength };
        }
        if (password.length > maxLength) {
            return { isValid: false, message: messages.maxLength };
        }
        return { isValid: true };
    }

    validateNickname(nickname) {
        if (!nickname) {
            return { isValid: false, message: Config.validation.nickname.messages.required };
        }
        const { minLength, maxLength, messages } = Config.validation.nickname;
        if (nickname.length < minLength) {
            return { isValid: false, message: messages.minLength };
        }
        if (nickname.length > maxLength) {
            return { isValid: false, message: messages.maxLength };
        }
        return { isValid: true };
    }

    validateVerificationCode(code) {
        if (!code) {
            return { isValid: false, message: Config.validation.verificationCode.messages.required };
        }
        if (!VALIDATION_REGEX.verificationCode.test(code)) {
            return { isValid: false, message: Config.validation.verificationCode.messages.invalid };
        }
        return { isValid: true };
    }
}

// 缓存DOM查询和事件处理优化
class FormHandler {
    constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) return;
        
        this.validator = new FormValidator();
        this.passwordChecker = new PasswordStrengthChecker();
        this.isSubmitting = false;
        
        // 缓存常用DOM元素
        this.cachedElements = new Map();
        this.submitButton = this.form.querySelector('button[type="submit"]');
        
        this.init();
    }

    init() {
        if (!this.form) return;
        this.setupEventListeners();
        this.setupCustomCheckboxes();
    }

    setupEventListeners() {
        // 使用事件委托，减少事件监听器数量
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.form.addEventListener('input', this.handleInput.bind(this));
        this.form.addEventListener('keypress', this.handleKeypress.bind(this));
    }

    handleKeypress(e) {
        if (e.key === 'Enter' && !this.isSubmitting) {
            this.form.requestSubmit();
        }
    }

    setupCustomCheckboxes() {
        // 使用事件委托处理所有checkbox
        this.form.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.validateCheckboxes();
            }
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

    // 缓存DOM查询结果
    getCachedElement(id) {
        if (!this.cachedElements.has(id)) {
            this.cachedElements.set(id, document.getElementById(id));
        }
        return this.cachedElements.get(id);
    }

    updateFieldUI(fieldName, result, prefix = '') {
        const fieldId = prefix ? `${prefix}-${fieldName}` : `${this.form.id.replace('-form', '')}-${fieldName}`;
        const field = this.getCachedElement(fieldId);
        const errorElement = this.getCachedElement(`${fieldId}-error`);
        
        if (!field || !errorElement) return;

        // 使用classList批量操作
        field.classList.toggle('valid', result.isValid);
        field.classList.toggle('invalid', !result.isValid);
        
        if (result.isValid) {
            this.hideError(errorElement);
        } else {
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
        // 缓存查询
        const loginAgreement1 = this.form.querySelector('input[name="agreement1"]');
        const loginAgreement2 = this.form.querySelector('input[name="agreement2"]');
        const registerAgreement1 = this.form.querySelector('input[name="register-agreement1"]');
        const registerAgreement2 = this.form.querySelector('input[name="register-agreement2"]');
        
        if (loginAgreement1 && loginAgreement2) {
            const errorElement = this.getCachedElement('login-agreement-error');
            if (errorElement) {
                if (!loginAgreement1.checked || !loginAgreement2.checked) {
                    this.showError(errorElement, '请同意所有协议');
                } else {
                    this.hideError(errorElement);
                }
            }
        }
        
        if (registerAgreement1 && registerAgreement2) {
            const errorElement = this.getCachedElement('register-agreement-error');
            if (errorElement) {
                if (!registerAgreement1.checked || !registerAgreement2.checked) {
                    this.showError(errorElement, '请同意所有协议');
                } else {
                    this.hideError(errorElement);
                }
            }
        }
    }

    setSubmitButton(submitting, buttonText = '提交') {
        if (!this.submitButton) return;

        if (submitting) {
            this.submitButton.disabled = true;
            this.submitButton.innerHTML = '<span class="loading"></span> 提交中...';
        } else {
            this.submitButton.disabled = false;
            this.submitButton.textContent = buttonText;
        }
    }

    // 优化消息显示，避免频繁创建销毁
    showMessage(message, type) {
        // 使用单例模式管理toast
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
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
        
        // 清除之前的定时器
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        
        this.toastTimeout = setTimeout(() => {
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
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const fieldName = input.name || input.id.replace(/^(login|register|forgot)-/, '');
            this.validateField(fieldName, input.value);
            
            const errorElement = this.getCachedElement(`${input.id}-error`);
            if (errorElement && errorElement.classList.contains('show')) {
                isValid = false;
            }
        }
        
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
            await this.submitFormData();
            this.showMessage('操作成功！', 'success');
            this.form.reset();
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
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() < 0.1) {
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

// 注册表单处理器 - 优化密码匹配验证
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
            // 使用防抖优化频繁输入
            let timeoutId;
            passwordField.addEventListener('input', (e) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    this.passwordChecker.updateUI(e.target.value);
                }, 150);
            });
        }
    }

    setupRealTimePasswordValidation() {
        const passwordField = this.form.querySelector('#register-password');
        const confirmPasswordField = this.form.querySelector('#register-confirm-password');
        
        if (passwordField && confirmPasswordField) {
            // 使用防抖
            let timeoutId;
            const validate = () => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    this.validatePasswordMatch();
                }, 150);
            };
            
            passwordField.addEventListener('input', validate);
            confirmPasswordField.addEventListener('input', validate);
        }
    }

    validatePasswordMatch() {
        const passwordField = this.form.querySelector('#register-password');
        const confirmPasswordField = this.form.querySelector('#register-confirm-password');
        const passwordError = this.getCachedElement('register-password-error');
        const confirmPasswordError = this.getCachedElement('register-confirm-password-error');
        
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
        const confirmPasswordError = this.getCachedElement('register-confirm-password-error');
        
        if (passwordField && confirmPasswordField && 
            passwordField.value && confirmPasswordField.value && 
            passwordField.value !== confirmPasswordField.value) {
            this.showError(confirmPasswordError, '两次输入的密码不一致');
            isValid = false;
        }
        
        return isValid;
    }
}

// 忘记密码表单处理器 - 优化DOM操作
class ForgotPasswordHandler extends FormHandler {
    constructor(formId) {
        super(formId);
        this.cachedPasswordFields = null;
    }

    init() {
        super.init();
        this.setupPasswordStrength();
        this.setupRealTimePasswordValidation();
    }

    // 延迟初始化DOM元素缓存
    getPasswordFields() {
        if (!this.cachedPasswordFields) {
            this.cachedPasswordFields = {
                password: document.getElementById('new-password'),
                confirmPassword: document.getElementById('confirm-new-password'),
                passwordError: document.getElementById('new-password-error'),
                confirmPasswordError: document.getElementById('confirm-new-password-error')
            };
        }
        return this.cachedPasswordFields;
    }

    setupPasswordStrength() {
        const passwordField = document.getElementById('new-password');
        if (passwordField) {
            let timeoutId;
            passwordField.addEventListener('input', (e) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    this.passwordChecker.updateUI(e.target.value, 'new-password-strength', 'new-strength-text');
                }, 150);
            });
        }
    }

    setupRealTimePasswordValidation() {
        const fields = this.getPasswordFields();
        if (fields.password && fields.confirmPassword) {
            let timeoutId;
            const validate = () => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    this.validatePasswordMatch();
                }, 150);
            };
            
            fields.password.addEventListener('input', validate);
            fields.confirmPassword.addEventListener('input', validate);
        }
    }

    validatePasswordMatch() {
        const fields = this.getPasswordFields();
        if (!fields.password || !fields.confirmPassword) return;
        
        const password = fields.password.value;
        const confirmPassword = fields.confirmPassword.value;
        
        fields.password.classList.remove('invalid');
        fields.confirmPassword.classList.remove('invalid');
        this.hideError(fields.passwordError);
        this.hideError(fields.confirmPasswordError);
        
        if (confirmPassword && password !== confirmPassword) {
            fields.confirmPassword.classList.add('invalid');
            this.showError(fields.confirmPasswordError, '两次输入的密码不一致');
        }
        
        if (password && !confirmPassword) {
            this.showError(fields.confirmPasswordError, '请确认密码');
        }
        
        if (password && confirmPassword && password === confirmPassword) {
            fields.password.classList.add('valid');
            fields.confirmPassword.classList.add('valid');
            this.hideError(fields.confirmPasswordError);
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
        
        const fields = this.getPasswordFields();
        const newPassword = fields.password ? fields.password.value : '';
        const confirmPassword = fields.confirmPassword ? fields.confirmPassword.value : '';
        const passwordValidation = validator.validatePassword(newPassword);
        this.updateFieldUI('new-password', passwordValidation);
        if (!passwordValidation.isValid) isValid = false;
        
        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            this.showError(fields.confirmPasswordError, '两次输入的密码不一致');
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
        if (formContainer) {
            formContainer.innerHTML = `
                <div class="success-message">
                    <div class="success-icon">✓</div>
                    <h3>密码重置成功！</h3>
                    <p>您的密码已成功重置，请使用新密码登录。</p>
                    <button type="button" class="btn btn-login" onclick="showLoginPage()">立即登录</button>
                </div>
            `;
        }
    }
}

// 应用主类 - 优化页面切换和事件处理
class AuthApp {
    constructor() {
        this.pageCache = new Map();
        this.countdownTimers = new Map();
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
        // 使用Promise.all并行初始化（如果有多个表单）
        const forms = [];
        if (document.getElementById('login-form')) {
            forms.push(new FormHandler('login-form'));
        }
        
        if (document.getElementById('register-form')) {
            forms.push(new RegisterFormHandler('register-form'));
        }
        
        if (document.getElementById('forgot-password-form')) {
            forms.push(new ForgotPasswordHandler('forgot-password-form'));
        }
        return forms;
    }

    setupPageSwitching() {
        // 缓存页面切换函数
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
        
        // 使用CSS动画替代JS动画
        hidePage.style.cssText = 'opacity: 0; transform: translateX(-20px); transition: all 0.3s ease;';
        
        setTimeout(() => {
            hidePage.style.display = 'none';
            showPage.style.display = 'block';
            showPage.style.cssText = 'opacity: 0; transform: translateX(20px); transition: all 0.3s ease;';
            
            // 强制重排
            showPage.offsetHeight;
            
            showPage.style.cssText = 'opacity: 1; transform: translateX(0); transition: all 0.3s ease;';
        }, 50);
    }

    setupForgotPassword() {
        const sendCodeBtn = document.getElementById('send-code-btn');
        if (sendCodeBtn) {
            // 移除之前的事件监听器，避免重复绑定
            sendCodeBtn.removeEventListener('click', this.sendCodeHandler);
            this.sendCodeHandler = this.handleSendVerificationCode.bind(this);
            sendCodeBtn.addEventListener('click', this.sendCodeHandler);
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
        
        setTimeout(() => {
            this.showMessage('模拟验证码：123456', 'success');
        }, 1000);
    }

    startCountdown(button) {
        // 清除之前的定时器
        const existingTimer = this.countdownTimers.get(button);
        if (existingTimer) {
            clearInterval(existingTimer);
        }
        
        let countdown = 60;
        button.disabled = true;
        button.textContent = `${countdown}秒后重新发送`;
        
        const timer = setInterval(() => {
            countdown--;
            button.textContent = `${countdown}秒后重新发送`;
            
            if (countdown <= 0) {
                clearInterval(timer);
                this.countdownTimers.delete(button);
                button.disabled = false;
                button.textContent = '发送验证码';
            }
        }, 1000);
        
        this.countdownTimers.set(button, timer);
    }

    setupBackToTop() {
        const backToTopBtn = document.querySelector('.back-to-top');
        if (backToTopBtn) {
            // 使用节流优化scroll事件
            let ticking = false;
            const updateVisibility = () => {
                backToTopBtn.classList.toggle('visible', window.scrollY > 300);
                ticking = false;
            };
            
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateVisibility);
                    ticking = true;
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
        const csrfToken = this.generateCSRFToken();
        
        for (let i = 0; i < forms.length; i++) {
            const form = forms[i];
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'csrf_token';
            input.value = csrfToken;
            form.appendChild(input);
        }
    }

    generateCSRFToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    showMessage(message, type) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
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
        
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        
        this.toastTimeout = setTimeout(() => {
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

// 预加载CSS动画
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

// 使用DOMContentLoaded最佳实践
let appInstance = null;
document.addEventListener('DOMContentLoaded', () => {
    appInstance = new AuthApp();
});

// 全局页面切换函数 - 保持原功能不变
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