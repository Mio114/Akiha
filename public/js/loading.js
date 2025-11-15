// 加载动画控制 - 深色模式适配
document.addEventListener('DOMContentLoaded', function() {
  const loading = document.getElementById('loading');
  const body = document.body;
  
  if (!loading) return;

  // 应用当前主题到加载动画
  function applyThemeToLoading() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    if (loading) {
      // 使用 CSS 类而不是直接修改样式，以便 CSS 可以处理过渡
      if (currentTheme === 'dark') {
        loading.classList.add('dark-mode');
        loading.classList.remove('light-mode');
      } else {
        loading.classList.add('light-mode');
        loading.classList.remove('dark-mode');
      }
    }
  }

  // 监听主题变化
  function observeThemeChanges() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          applyThemeToLoading();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  // 初始化主题
  applyThemeToLoading();
  observeThemeChanges();

  // 确保加载动画至少显示一段时间（提供更好的用户体验）
  let minLoadingTime = 800; // 最少显示 800ms
  let startTime = Date.now();

  function hideLoading() {
    let loadTime = Date.now() - startTime;
    let remainingTime = Math.max(0, minLoadingTime - loadTime);
    
    setTimeout(() => {
      // 添加 loaded class 触发 CSS 过渡
      body.classList.add('loaded');
      
      // 过渡完成后完全移除加载元素
      setTimeout(() => {
        if (loading && loading.parentNode) {
          // 先触发重绘确保动画完成
          loading.offsetHeight;
          loading.parentNode.removeChild(loading);
        }
      }, 500); // 与 CSS 过渡时间匹配
    }, remainingTime);
  }

  // 页面完全加载后隐藏加载动画
  if (document.readyState === 'complete') {
    hideLoading();
  } else {
    window.addEventListener('load', hideLoading);
  }

  // 备用方案：如果 3 秒后仍未加载完成，强制隐藏加载动画
  setTimeout(hideLoading, 3000);

  // 错误处理：如果页面加载出错也隐藏加载动画
  window.addEventListener('error', function(e) {
    console.warn('页面加载出现错误，隐藏加载动画:', e.error);
    hideLoading();
  });

  // 处理页面可见性变化
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      // 页面被隐藏，暂停不必要的操作
    } else {
      // 页面重新可见
    }
  });
});

// 性能监控：记录加载时间
(function() {
  const startTime = performance.now();
  
  window.addEventListener('load', function() {
    const loadTime = performance.now() - startTime;
    console.log(`%c🚀 页面加载完成 - ${loadTime.toFixed(2)}ms`, 
      'color: #4CAF50; font-weight: bold;');
    
    // 发送性能数据到分析服务（可选）
    if (typeof gtag !== 'undefined') {
      gtag('event', 'timing_complete', {
        'name': 'load',
        'value': Math.round(loadTime),
        'event_category': 'Load Time'
      });
    }
  });
})();

// 与现有工具函数集成
if (typeof utils !== 'undefined') {
  // 使用现有的防抖/节流函数
  const optimizedHideLoading = utils.throttle(function() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.opacity = '0';
    }
  }, 100);
}

// 导出函数供其他模块使用（如果需要）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    applyThemeToLoading: applyThemeToLoading,
    hideLoading: hideLoading
  };
}