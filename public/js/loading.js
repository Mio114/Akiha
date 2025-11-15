// 极致丝滑加载动画控制
class SmoothLoadingAnimation {
  constructor() {
    this.loading = document.getElementById('loading');
    this.body = document.body;
    this.startTime = performance.now();
    this.minLoadingTime = 700;
    this.maxLoadingTime = 3000;
    this.loadingSpeed = 'normal';
    
    this.init();
  }

  init() {
    if (!this.loading) return;

    // 立即设置为预加载状态（无过渡）
    this.loading.classList.add('preload');
    
    // 应用主题
    this.applyThemeToLoading();
    this.observeThemeChanges();
    
    // 微延迟后激活过渡效果
    setTimeout(() => {
      this.activateSmoothTransition();
    }, 10);
    
    this.setupPerformanceMonitoring();
    this.setupLoadingHandlers();
    this.observeContentLoading();
  }

  // 激活平滑过渡
  activateSmoothTransition() {
    if (this.loading) {
      // 移除预加载状态，添加激活状态（触发过渡）
      this.loading.classList.remove('preload');
      
      // 使用 requestAnimationFrame 确保过渡触发
      requestAnimationFrame(() => {
        this.loading.classList.add('active');
      });
    }
  }

  // 根据性能数据确定加载速度
  determineLoadingSpeed() {
    const navTiming = performance.getEntriesByType('navigation')[0];
    if (navTiming) {
      const domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.navigationStart;
      
      if (domContentLoaded < 800) {
        this.loadingSpeed = 'fast';
        this.minLoadingTime = 500;
      } else if (domContentLoaded > 2500) {
        this.loadingSpeed = 'slow';
        this.minLoadingTime = 1200;
      } else {
        this.loadingSpeed = 'normal';
        this.minLoadingTime = 800;
      }
      
      this.loading.classList.add(`loading-${this.loadingSpeed}`);
    }
  }

  // 性能监控
  setupPerformanceMonitoring() {
    this.determineLoadingSpeed();
  }

  // 内容加载观察
  observeContentLoading() {
    // 监控关键图片加载
    const criticalImages = document.querySelectorAll('img[loading="eager"], .navbar-logo img');
    let loadedCriticalImages = 0;
    const totalCriticalImages = criticalImages.length;

    if (totalCriticalImages > 0) {
      criticalImages.forEach(img => {
        if (img.complete) {
          loadedCriticalImages++;
        } else {
          img.addEventListener('load', () => {
            loadedCriticalImages++;
            this.checkCriticalContentLoaded(loadedCriticalImages, totalCriticalImages);
          });
          img.addEventListener('error', () => {
            loadedCriticalImages++;
            this.checkCriticalContentLoaded(loadedCriticalImages, totalCriticalImages);
          });
        }
      });
    }
  }

  checkCriticalContentLoaded(loaded, total) {
    if (loaded >= total) {
      // 关键内容已加载，可以准备隐藏动画
      this.scheduleHideAnimation();
    }
  }

  // 安排隐藏动画
  scheduleHideAnimation() {
    const currentTime = performance.now();
    const elapsedTime = currentTime - this.startTime;
    const remainingTime = Math.max(0, this.minLoadingTime - elapsedTime);

    // 提前准备内容过渡
    this.prepareContentTransition();

    setTimeout(() => {
      this.startHideAnimation();
    }, remainingTime);
  }

  // 准备内容过渡
  prepareContentTransition() {
    const mainContent = document.querySelector('main');
    if (mainContent && !mainContent.classList.contains('main-content')) {
      mainContent.classList.add('main-content');
    }
  }

  // 开始隐藏动画
  startHideAnimation() {
    // 第一阶段：添加页面加载类（触发CSS过渡）
    this.body.classList.add('page-loaded');
    
    // 第二阶段：完全移除元素
    setTimeout(() => {
      this.completeHide();
    }, 700); // 与CSS过渡时间匹配
  }

  // 完成隐藏
  completeHide() {
    if (this.loading && this.loading.parentNode) {
      // 添加最终微调过渡
      this.loading.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      this.loading.style.opacity = '0';
      this.loading.style.transform = 'scale(0.97)';
      
      setTimeout(() => {
        if (this.loading.parentNode) {
          this.loading.parentNode.removeChild(this.loading);
          
          // 触发自定义事件，通知其他组件
          window.dispatchEvent(new CustomEvent('loadingComplete', {
            detail: { loadTime: performance.now() - this.startTime }
          }));
        }
      }, 400);
    }
  }

  // 设置加载处理器
  setupLoadingHandlers() {
    // 主要加载完成事件
    if (document.readyState === 'complete') {
      this.scheduleHideAnimation();
    } else {
      window.addEventListener('load', () => this.scheduleHideAnimation());
    }

    // DOM内容加载完成时调整策略
    document.addEventListener('DOMContentLoaded', () => {
      this.determineLoadingSpeed();
    });

    // 备用方案：最大等待时间
    setTimeout(() => {
      if (this.loading && this.loading.parentNode) {
        console.log('Fallback: Force completing loading animation');
        this.startHideAnimation();
      }
    }, this.maxLoadingTime);

    // 错误处理
    window.addEventListener('error', (e) => {
      console.warn('Page loading error, completing loading animation:', e.error);
      this.startHideAnimation();
    });
  }

  // 主题适配
  applyThemeToLoading() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    if (this.loading) {
      if (currentTheme === 'dark') {
        this.loading.style.backgroundColor = '#1a1a1a';
      } else {
        this.loading.style.backgroundColor = '#fff';
      }
    }
  }

  observeThemeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          this.applyThemeToLoading();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
}

// 初始化 - 在DOM解析完成后立即执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SmoothLoadingAnimation();
  });
} else {
  new SmoothLoadingAnimation();
}

// 性能记录和用户体验监控
window.addEventListener('load', function() {
  const navTiming = performance.getEntriesByType('navigation')[0];
  if (navTiming) {
    const loadTime = navTiming.loadEventEnd - navTiming.navigationStart;
    const speed = loadTime < 800 ? '极快' : loadTime < 1600 ? '快速' : '正常';
    
    console.log(`%c🎯 页面加载完成 - ${loadTime.toFixed(0)}ms (${speed})`, 
      'color: #4CAF50; font-weight: bold; font-size: 14px;');
  }
});