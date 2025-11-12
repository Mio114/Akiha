// ===== 主题切换功能 =====
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('theme');
  const html = document.documentElement;
  
  // 检查本地存储的主题偏好
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  
  // 设置切换器的初始状态
  if (savedTheme === 'dark') {
    themeToggle.checked = true;
  }
  
  // 切换主题
  themeToggle.addEventListener('change', function() {
    const newTheme = this.checked ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
});

// ===== 导航栏交互功能 =====
document.addEventListener('DOMContentLoaded', function() {
  const navbar = document.querySelector('.navbar');
  
  // 导航栏滚动效果
  let lastScrollTop = 0;
  
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
      // 向下滚动
      navbar.style.transform = 'translateY(-100%)';
    } else {
      // 向上滚动
      navbar.style.transform = 'translateY(0)';
    }
    
    lastScrollTop = scrollTop;
  });
  
  // 导航菜单激活状态
  function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-menu a');
    
    navLinks.forEach(link => {
      const linkPath = link.getAttribute('href');
      if (currentPath === linkPath || (currentPath.startsWith(linkPath) && linkPath !== '/')) {
        link.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        link.style.color = 'var(--text-white)';
      }
    });
  }
  
  setActiveNavLink();
});

// ===== 图片懒加载 =====
document.addEventListener('DOMContentLoaded', function() {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          imageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
  }
});

// ===== 登录按钮动画优化 =====
document.addEventListener('DOMContentLoaded', function() {
  const loginBtn = document.querySelector('.login-btn');
  
  if (loginBtn) {
    // 添加点击涟漪效果
    loginBtn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
      `;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }
});

// 添加涟漪动画样式
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(rippleStyle);

// ===== 页面加载动画 =====
document.addEventListener('DOMContentLoaded', function() {
  // 导航栏入场动画
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.style.opacity = '0';
    navbar.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
      navbar.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      navbar.style.opacity = '1';
      navbar.style.transform = 'translateY(0)';
    }, 100);
  }
});

// ===== 键盘导航支持 =====
document.addEventListener('keydown', function(e) {
  // Tab 键导航
  if (e.key === 'Tab') {
    document.body.classList.add('keyboard-navigation');
  }
});

document.addEventListener('mousedown', function() {
  document.body.classList.remove('keyboard-navigation');
});

// 添加键盘导航样式
const keyboardNavStyle = document.createElement('style');
keyboardNavStyle.textContent = `
  .keyboard-navigation *:focus {
    outline: 2px solid var(--primary-color) !important;
    outline-offset: 2px !important;
  }
`;
document.head.appendChild(keyboardNavStyle);

// ===== 错误处理 =====
// 图片加载错误处理
document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('img');
  
  images.forEach(img => {
    img.addEventListener('error', function() {
      this.alt = '图片加载失败';
      this.style.backgroundColor = '#f0f0f0';
    });
  });
});

// ===== 工具函数 =====
const utils = {
  // 防抖函数
  debounce: function(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },
  
  // 节流函数
  throttle: function(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// 控制台欢迎信息
console.log(`
%cAKIHA FIELD %c欢迎来到我们的视觉小说世界！🎮
%c典藏世间之美，共叙心动诗篇。✨
`,
'color: #bb645b; font-size: 20px; font-weight: bold;',
'color: #666; font-size: 14px;',
'color: #bb645b; font-size: 12px; font-style: italic;'
);