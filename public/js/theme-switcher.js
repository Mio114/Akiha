// ===== 主题切换功能 =====
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('theme');
  const html = document.documentElement;
  
  if (!themeToggle) return;
  
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
  if (!navbar) return;
  
  // 导航栏滚动效果 - 使用节流优化
  let lastScrollTop = 0;
  let ticking = false;
  
  const handleScroll = function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (!ticking) {
      requestAnimationFrame(() => {
        if (scrollTop > lastScrollTop && scrollTop > 100) {
          // 向下滚动
          navbar.style.transform = 'translateY(-100%)';
        } else {
          // 向上滚动
          navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // 导航菜单激活状态
  function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-menu a');
    
    for (let i = 0; i < navLinks.length; i++) {
      const link = navLinks[i];
      const linkPath = link.getAttribute('href');
      if (currentPath === linkPath || (currentPath.startsWith(linkPath) && linkPath !== '/')) {
        link.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        link.style.color = 'var(--text-white)';
        break;
      }
    }
  }
  
  setActiveNavLink();
});

// ===== 图片懒加载 =====
document.addEventListener('DOMContentLoaded', function() {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if (lazyImages.length === 0) return;
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          imageObserver.unobserve(img);
        }
      }
    });
    
    for (let i = 0; i < lazyImages.length; i++) {
      imageObserver.observe(lazyImages[i]);
    }
  } else {
    // 回退方案：直接加载所有图片
    for (let i = 0; i < lazyImages.length; i++) {
      const img = lazyImages[i];
      img.src = img.dataset.src || img.src;
    }
  }
});

// ===== 登录按钮动画优化 =====
document.addEventListener('DOMContentLoaded', function() {
  const loginBtn = document.querySelector('.login-btn');
  
  if (loginBtn) {
    // 预创建样式避免重复创建
    if (!document.getElementById('ripple-style')) {
      const rippleStyle = document.createElement('style');
      rippleStyle.id = 'ripple-style';
      rippleStyle.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(rippleStyle);
    }
    
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
        if (ripple.parentNode === this) {
          this.removeChild(ripple);
        }
      }, 600);
    });
  }
});

// ===== 页面加载动画 =====
document.addEventListener('DOMContentLoaded', function() {
  // 导航栏入场动画
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.style.opacity = '0';
    navbar.style.transform = 'translateY(-20px)';
    
    requestAnimationFrame(() => {
      navbar.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      navbar.style.opacity = '1';
      navbar.style.transform = 'translateY(0)';
    });
  }
});

// ===== 键盘导航支持 =====
// 预创建样式避免重复创建
if (!document.getElementById('keyboard-nav-style')) {
  const keyboardNavStyle = document.createElement('style');
  keyboardNavStyle.id = 'keyboard-nav-style';
  keyboardNavStyle.textContent = `
    .keyboard-navigation *:focus {
      outline: 2px solid var(--primary-color) !important;
      outline-offset: 2px !important;
    }
  `;
  document.head.appendChild(keyboardNavStyle);
}

let keyboardTimeout;
document.addEventListener('keydown', function(e) {
  // Tab 键导航
  if (e.key === 'Tab') {
    document.body.classList.add('keyboard-navigation');
    clearTimeout(keyboardTimeout);
  }
});

document.addEventListener('mousedown', function() {
  document.body.classList.remove('keyboard-navigation');
  keyboardTimeout = setTimeout(() => {
    document.body.classList.remove('keyboard-navigation');
  }, 100);
});

// ===== 错误处理 =====
// 图片加载错误处理
document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('img');
  
  for (let i = 0; i < images.length; i++) {
    images[i].addEventListener('error', function() {
      this.alt = '图片加载失败';
      this.style.backgroundColor = '#f0f0f0';
    });
  }
});

// ===== 工具函数 =====
const utils = Object.freeze({
  // 防抖函数
  debounce: function(func, wait, immediate) {
    let timeout;
    return function(...args) {
      const context = this;
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  },
  
  // 节流函数
  throttle: function(func, limit) {
    let inThrottle;
    let lastFunc;
    let lastRan;
    return function(...args) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        lastRan = Date.now();
        inThrottle = true;
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(function() {
          if (Date.now() - lastRan >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }
});

// 控制台欢迎信息
function showWelcomeMessage() {
  console.log(`%cAKIHA FIELD %c欢迎来到我们的视觉小说世界！🎮\n%c典藏世间之美，共叙心动诗篇。✨`,
    'color: #bb645b; font-size: 20px; font-weight: bold;',
    'color: #666; font-size: 14px;',
    'color: #bb645b; font-size: 12px; font-style: italic;'
  );
}

// 简化初始化，避免干扰其他功能
document.addEventListener('DOMContentLoaded', function() {
  showWelcomeMessage();
});