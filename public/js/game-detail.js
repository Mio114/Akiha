// 游戏详情页交互功能 - 性能优化版
document.addEventListener('DOMContentLoaded', function() {
    console.log('游戏详情页交互功能加载中...');

    // ========== 缓存和性能优化工具 ==========
    const performanceUtils = {
        // 防抖函数
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func.apply(this, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
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
        },

        // 批量DOM操作
        batchDOMUpdates: function(callback) {
            requestAnimationFrame(callback);
        },

        // 内存优化：对象池
        objectPool: {
            _pool: new Map(),
            get: function(type) {
                if (!this._pool.has(type)) {
                    this._pool.set(type, []);
                }
                return this._pool.get(type).pop() || document.createElement(type);
            },
            release: function(element) {
                const type = element.tagName.toLowerCase();
                if (!this._pool.has(type)) {
                    this._pool.set(type, []);
                }
                element.innerHTML = '';
                this._pool.get(type).push(element);
            }
        }
    };

    // ========== 全局缓存 ==========
    const elementCache = new Map();
    const imageCache = new Map();
    const videoCache = new Map();

    // ========== 页面导航功能 ==========
    function initPageNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const pages = document.querySelectorAll('.page');
        
        // 缓存页面元素
        const pageContent = document.querySelector('.page-content');
        
        navButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetPage = this.getAttribute('data-page');
                
                // 使用批量更新优化
                performanceUtils.batchDOMUpdates(() => {
                    // 更新按钮状态
                    navButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    
                    // 显示对应页面
                    pages.forEach(page => {
                        page.classList.remove('active');
                        if (page.id === `${targetPage}-page`) {
                            page.classList.add('active');
                        }
                    });
                });
                
                // 滚动到页面顶部 - 使用节流
                if (pageContent) {
                    window.scrollTo({
                        top: pageContent.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
                
                // 触发自定义事件
                document.dispatchEvent(new CustomEvent('pageChanged', {
                    detail: { page: targetPage }
                }));
                
                console.log(`切换到页面: ${targetPage}`);
            });
        });
        
        console.log('页面导航初始化完成');
    }

    // ========== 导航栏滚动效果 ==========
    function initNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        let lastScrollY = window.scrollY;
        let ticking = false;
        
        const updateNavbar = performanceUtils.throttle(() => {
            const scrollY = window.scrollY;
            
            if (scrollY > lastScrollY && scrollY > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            
            // 背景透明度变化
            const scrolled = scrollY / (document.body.scrollHeight - window.innerHeight);
            navbar.style.background = `rgba(255, 255, 255, ${Math.min(scrolled * 2, 0.9)})`;
            
            lastScrollY = scrollY;
            ticking = false;
        }, 16);
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        });
        
        console.log('导航栏滚动效果初始化完成');
    }

    // ========== 图片懒加载 ==========
    function initImageLazyLoad() {
        const images = document.querySelectorAll('img[data-src]');
        if (images.length === 0) return;
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    // 检查缓存
                    if (imageCache.has(src)) {
                        img.src = imageCache.get(src);
                    } else {
                        const imageLoader = new Image();
                        imageLoader.onload = () => {
                            img.src = src;
                            imageCache.set(src, src);
                            img.classList.add('loaded');
                        };
                        imageLoader.src = src;
                    }
                    
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });

        images.forEach(img => imageObserver.observe(img));
        console.log(`图片懒加载初始化完成，监控 ${images.length} 张图片`);
    }

    // ========== 封面鼠标视差效果 ==========
    function initCoverParallax() {
        const gameCover = document.querySelector('.game-cover');
        if (!gameCover) return;
        
        const parallaxHandler = performanceUtils.throttle((e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
            
            gameCover.style.transform = `translateY(-8px) rotate3d(${moveY}, ${moveX}, 0, 5deg)`;
        }, 16);
        
        document.addEventListener('mousemove', parallaxHandler);

        // 鼠标离开时恢复
        document.addEventListener('mouseleave', () => {
            gameCover.style.transform = 'translateY(-8px)';
        });
        
        console.log('封面视差效果初始化完成');
    }

    // ========== 图片点击预览 ==========
    function initImagePreview() {
        const screenshotImages = document.querySelectorAll('.screenshot-image');
        
        // 预创建模态框模板
        const modalTemplate = performanceUtils.objectPool.get('div');
        modalTemplate.className = 'image-modal';
        modalTemplate.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            cursor: zoom-out;
        `;

        screenshotImages.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', function() {
                const overlay = modalTemplate.cloneNode();
                const enlargedImg = performanceUtils.objectPool.get('img');
                
                enlargedImg.src = this.src;
                enlargedImg.style.cssText = `
                    max-width: 90%;
                    max-height: 90%;
                    object-fit: contain;
                    border-radius: 8px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                `;
                
                overlay.appendChild(enlargedImg);
                document.body.appendChild(overlay);
                
                // 点击关闭
                const closeModal = () => {
                    document.body.removeChild(overlay);
                    performanceUtils.objectPool.release(enlargedImg);
                    performanceUtils.objectPool.release(overlay);
                    document.removeEventListener('keydown', handleEsc);
                };
                
                const handleEsc = (e) => {
                    if (e.key === 'Escape') closeModal();
                };
                
                overlay.addEventListener('click', closeModal);
                document.addEventListener('keydown', handleEsc);
                
                console.log('打开图片预览');
            });
        });
        
        console.log('图片预览功能初始化完成');
    }

    // ========== 视频点击播放功能 ==========
    function initVideoPlayer() {
        const videoPlaceholders = document.querySelectorAll('.video-placeholder');
        
        // 预定义视频处理函数
        const videoHandlers = {
            playDirectVideo: function(container, src) {
                const video = performanceUtils.objectPool.get('video');
                video.src = src;
                video.controls = true;
                video.style.cssText = `
                    width: 100%;
                    height: auto;
                    display: block;
                    border-radius: 12px;
                `;
                
                container.innerHTML = '';
                container.appendChild(video);
                container.classList.add('playing');
                
                video.play().catch(error => {
                    console.log('自动播放被阻止:', error);
                });
            },
            
            playEmbedVideo: function(container, src) {
                const wrapper = performanceUtils.objectPool.get('div');
                const iframe = performanceUtils.objectPool.get('iframe');
                
                let finalSrc = src;
                if (src.includes('youtube.com') || src.includes('youtu.be')) {
                    finalSrc = `${src}${src.includes('?') ? '&' : '?'}autoplay=1&rel=0&modestbranding=1`;
                } else if (src.includes('bilibili.com')) {
                    finalSrc = `${src}${src.includes('?') ? '&' : '?'}autoplay=true`;
                } else {
                    finalSrc = `${src}${src.includes('?') ? '&' : '?'}autoplay=1`;
                }
                
                iframe.src = finalSrc;
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.allowFullscreen = true;
                iframe.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border: none;
                    border-radius: 12px;
                `;
                
                wrapper.style.cssText = `
                    position: relative;
                    width: 100%;
                    height: 0;
                    padding-bottom: 56.25%;
                `;
                wrapper.appendChild(iframe);
                
                container.innerHTML = '';
                container.appendChild(wrapper);
                container.classList.add('playing');
            }
        };
        
        videoPlaceholders.forEach(placeholder => {
            placeholder.addEventListener('click', function() {
                if (this.classList.contains('playing')) return;
                
                const videoSrc = this.getAttribute('data-src');
                if (!videoSrc) return;
                
                const videoExt = getFileExtension(videoSrc);
                
                if (isDirectVideoFormat(videoExt)) {
                    videoHandlers.playDirectVideo(this, videoSrc);
                } else if (isEmbedVideo(videoSrc)) {
                    videoHandlers.playEmbedVideo(this, videoSrc);
                } else {
                    playGenericVideo(this, videoSrc);
                }
                
                console.log('开始播放视频，格式:', videoExt);
            });
        });
        
        console.log('视频播放器初始化完成');
    }

    // 工具函数保持不变但添加缓存
    const fileUtils = {
        getFileExtension: function(url) {
            if (!url) return '';
            return url.split('.').pop().toLowerCase().split('?')[0];
        },
        
        isDirectVideoFormat: function(ext) {
            const directFormats = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv'];
            return directFormats.includes(ext);
        },
        
        isEmbedVideo: function(url) {
            return url.includes('youtube.com') || 
                   url.includes('youtu.be') || 
                   url.includes('bilibili.com') ||
                   url.includes('vimeo.com');
        }
    };

    // 为保持兼容性，暴露原有函数
    const { getFileExtension, isDirectVideoFormat, isEmbedVideo } = fileUtils;

    // 通用视频处理（优化版）
    function playGenericVideo(container, src) {
        const video = performanceUtils.objectPool.get('video');
        video.src = src;
        video.controls = true;
        video.style.cssText = `
            width: 100%;
            height: auto;
            display: block;
            border-radius: 12px;
        `;
        
        video.onerror = function() {
            console.log('Video 元素不支持该格式，尝试使用 iframe');
            const iframe = performanceUtils.objectPool.get('iframe');
            iframe.src = src;
            iframe.style.cssText = `
                width: 100%;
                height: 400px;
                border: none;
                border-radius: 12px;
            `;
            
            container.innerHTML = '';
            container.appendChild(iframe);
            performanceUtils.objectPool.release(video);
        };
        
        container.innerHTML = '';
        container.appendChild(video);
        container.classList.add('playing');
        
        video.play().catch(error => {
            console.log('自动播放失败:', error);
        });
    }

    // ========== 下载下拉菜单功能 ==========
    function initDownloadDropdown() {
        const downloadDropdown = document.querySelector('.download-dropdown');
        if (!downloadDropdown) return;

        const mainButton = downloadDropdown.querySelector('.download-main-button');
        const dropdownMenu = downloadDropdown.querySelector('.download-dropdown-menu');
        const downloadOptions = downloadDropdown.querySelectorAll('.download-option');

        // 使用事件委托优化
        downloadDropdown.addEventListener('click', function(e) {
            if (e.target === mainButton || mainButton.contains(e.target)) {
                e.stopPropagation();
                const isOpen = dropdownMenu.classList.contains('open');
                isOpen ? closeDropdown() : openDropdown();
            } else if (e.target.closest('.download-option')) {
                const option = e.target.closest('.download-option');
                handleDownloadOptionClick(option);
            }
        });

        function handleDownloadOptionClick(option) {
            const url = option.getAttribute('data-url');
            const name = option.querySelector('.option-name').textContent;
            
            if (url) {
                window.open(url, '_blank');
                console.log(`开始下载: ${name}`);
                closeDropdown();
                showMessage(`开始下载: ${name}`, 'success');
            }
        }

        function openDropdown() {
            dropdownMenu.classList.add('open');
            mainButton.classList.add('open');
        }

        function closeDropdown() {
            dropdownMenu.classList.remove('open');
            mainButton.classList.remove('open');
        }

        // 点击页面其他区域关闭下拉菜单
        document.addEventListener('click', closeDropdown);
        
        // ESC键关闭下拉菜单
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeDropdown();
        });

        console.log(`下载下拉菜单初始化完成，找到 ${downloadOptions.length} 个下载选项`);
    }

    // ========== 评价系统 ==========
    function initReviewSystem() {
        const reviewTextarea = document.querySelector('.review-textarea');
        const charCount = document.querySelector('.char-count');
        const reviewSubmit = document.querySelector('.review-submit');

        // 使用防抖优化输入处理
        const handleReviewInput = performanceUtils.debounce(function() {
            const length = this.value.length;
            if (charCount) charCount.textContent = length;
            
            if (reviewSubmit) {
                reviewSubmit.disabled = length === 0;
                this.style.borderColor = length === 0 ? '#e74c3c' : '#4A6CF7';
            }
        }, 100);

        if (reviewTextarea) {
            reviewTextarea.addEventListener('input', handleReviewInput);
            
            // 初始状态
            if (charCount) charCount.textContent = '0';
        }

        // 提交评价功能
        if (reviewSubmit) {
            reviewSubmit.addEventListener('click', function() {
                const content = reviewTextarea.value.trim();
                
                if (content.length === 0) {
                    showMessage('评价内容不能为空', 'error');
                    reviewTextarea.focus();
                    return;
                }
                
                addReview(content);
                
                // 重置表单
                reviewTextarea.value = '';
                if (charCount) charCount.textContent = '0';
                reviewSubmit.disabled = true;
                reviewTextarea.style.borderColor = '';
                
                showMessage('评价发布成功！', 'success');
            });
        }

        // 回车提交评价 (Ctrl+Enter)
        if (reviewTextarea) {
            reviewTextarea.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'Enter') {
                    reviewSubmit?.click();
                }
            });
        }

        console.log('评价系统初始化完成');
    }

    // ========== 添加评价到列表 ==========
    function addReview(content) {
        const placeholder = document.querySelector('.review-placeholder');
        if (placeholder) placeholder.remove();
        
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        const reviewId = 'review-' + Date.now();
        reviewItem.setAttribute('data-review-id', reviewId);
        
        const now = new Date();
        const dateString = formatDate(now);
        
        // 使用模板字符串但避免重复创建
        reviewItem.innerHTML = `
            <div class="review-header">
                <span class="review-author">匿名用户</span>
                <span class="review-date">${dateString}</span>
            </div>
            <div class="review-content">${escapeHtml(content)}</div>
            <div class="review-stats">
                <span class="review-likes">0 人觉得有用</span>
            </div>
            <div class="review-actions">
                <button class="review-action like-btn" title="点赞">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" fill="currentColor"/>
                    </svg>
                    有用
                </button>
                <button class="review-action reply-btn" title="回复">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" fill="currentColor"/>
                    </svg>
                    回复
                </button>
            </div>
            <div class="reply-section">
                <textarea class="reply-textarea" placeholder="写下你的回复..."></textarea>
                <div class="reply-controls">
                    <span class="reply-counter">0</span>
                    <div>
                        <button class="reply-cancel">取消</button>
                        <button class="reply-submit" disabled>发布回复</button>
                    </div>
                </div>
            </div>
            <div class="replies-list"></div>
        `;
        
        const reviewsList = document.querySelector('.reviews-list');
        if (reviewsList) {
            reviewsList.insertBefore(reviewItem, reviewsList.firstChild);
        }
        
        initReviewInteractions(reviewItem);
        console.log(`添加新评价: ${content.substring(0, 50)}...`);
    }

    // ========== 初始化评价交互功能 ==========
    function initReviewInteractions(reviewItem) {
        // 使用事件委托优化
        reviewItem.addEventListener('click', function(e) {
            const likeBtn = e.target.closest('.like-btn');
            const replyBtn = e.target.closest('.reply-btn');
            const replyCancel = e.target.closest('.reply-cancel');
            const replySubmit = e.target.closest('.reply-submit');
            
            if (likeBtn) handleLikeClick(likeBtn, reviewItem);
            if (replyBtn) handleReplyClick(replyBtn, reviewItem);
            if (replyCancel) handleReplyCancel(replyCancel, reviewItem);
            if (replySubmit) handleReplySubmit(replySubmit, reviewItem);
        });
        
        // 输入事件使用防抖
        const replyTextarea = reviewItem.querySelector('.reply-textarea');
        if (replyTextarea) {
            replyTextarea.addEventListener('input', performanceUtils.debounce(function() {
                const length = this.value.length;
                const replyCounter = reviewItem.querySelector('.reply-counter');
                const replySubmit = reviewItem.querySelector('.reply-submit');
                
                if (replyCounter) replyCounter.textContent = length;
                if (replySubmit) replySubmit.disabled = length === 0;
                this.style.borderColor = length === 0 ? '#e74c3c' : '#4A6CF7';
            }, 100));
        }
    }

    // 评价交互处理函数
    function handleLikeClick(likeBtn, reviewItem) {
        const reviewLikes = reviewItem.querySelector('.review-likes');
        let likeCount = parseInt(reviewLikes.textContent) || 0;
        const hasLiked = likeBtn.classList.contains('liked');
        
        if (hasLiked) {
            likeCount--;
            likeBtn.classList.remove('liked');
        } else {
            likeCount++;
            likeBtn.classList.add('liked');
        }
        
        reviewLikes.textContent = `${likeCount} 人觉得有用`;
        likeBtn.style.transform = 'scale(1.2)';
        setTimeout(() => likeBtn.style.transform = 'scale(1)', 200);
    }

    function handleReplyClick(replyBtn, reviewItem) {
        const replySection = reviewItem.querySelector('.reply-section');
        const isVisible = replySection.style.display === 'block';
        replySection.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            const replyTextarea = reviewItem.querySelector('.reply-textarea');
            replyTextarea?.focus();
        }
    }

    function handleReplyCancel(replyCancel, reviewItem) {
        const replySection = reviewItem.querySelector('.reply-section');
        const replyTextarea = reviewItem.querySelector('.reply-textarea');
        const replyCounter = reviewItem.querySelector('.reply-counter');
        const replySubmit = reviewItem.querySelector('.reply-submit');
        
        replySection.style.display = 'none';
        replyTextarea.value = '';
        if (replyCounter) replyCounter.textContent = '0';
        if (replySubmit) replySubmit.disabled = true;
        replyTextarea.style.borderColor = '';
    }

    function handleReplySubmit(replySubmit, reviewItem) {
        const replyTextarea = reviewItem.querySelector('.reply-textarea');
        const repliesList = reviewItem.querySelector('.replies-list');
        const content = replyTextarea.value.trim();
        
        if (content.length === 0) {
            showMessage('回复内容不能为空', 'error');
            return;
        }
        
        addReply(repliesList, content);
        handleReplyCancel(replySubmit, reviewItem);
        showMessage('回复发布成功！', 'success');
    }

    // ========== 添加回复 ==========
    function addReply(repliesList, content) {
        const replyItem = document.createElement('div');
        replyItem.className = 'reply-item';
        
        const now = new Date();
        const dateString = formatDate(now);
        
        replyItem.innerHTML = `
            <div class="reply-header">
                <span class="reply-author">匿名用户</span>
                <span class="reply-date">${dateString}</span>
            </div>
            <div class="reply-content">${escapeHtml(content)}</div>
            <div class="reply-actions">
                <button class="reply-action like-reply-btn" title="点赞回复">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        `;
        
        // 使用事件委托优化回复点赞
        replyItem.addEventListener('click', function(e) {
            if (e.target.closest('.like-reply-btn')) {
                e.target.closest('.like-reply-btn').classList.toggle('liked');
            }
        });
        
        repliesList.appendChild(replyItem);
        console.log(`添加新回复: ${content.substring(0, 50)}...`);
    }

    // ========== 视频懒加载 ==========
    function initVideoLazyLoad() {
        const videos = document.querySelectorAll('iframe[data-src]');
        if (videos.length === 0) return;
        
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const iframe = entry.target;
                    iframe.src = iframe.dataset.src;
                    iframe.removeAttribute('data-src');
                    videoObserver.unobserve(iframe);
                }
            });
        }, {
            rootMargin: '100px',
            threshold: 0.1
        });

        videos.forEach(video => videoObserver.observe(video));
        console.log(`视频懒加载初始化完成，监控 ${videos.length} 个视频`);
    }

    // ========== 工具函数 ==========
    
    // 显示消息提示（优化版）
    const messageQueue = [];
    let isShowingMessage = false;

    function showMessage(message, type = 'info') {
        messageQueue.push({ message, type });
        if (!isShowingMessage) {
            processMessageQueue();
        }
    }

    function processMessageQueue() {
        if (messageQueue.length === 0) {
            isShowingMessage = false;
            return;
        }

        isShowingMessage = true;
        const { message, type } = messageQueue.shift();
        
        const messageEl = document.createElement('div');
        messageEl.className = `message-toast message-${type}`;
        messageEl.textContent = message;
        
        messageEl.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => messageEl.style.transform = 'translateX(0)', 100);
        
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                messageEl.remove();
                setTimeout(processMessageQueue, 100);
            }, 300);
        }, 3000);
    }

    // 格式化日期（缓存优化）
    const dateCache = new Map();
    function formatDate(date) {
        const cacheKey = date.getTime();
        if (dateCache.has(cacheKey)) {
            return dateCache.get(cacheKey);
        }

        const now = new Date();
        const diff = now - date;
        
        let result;
        if (diff < 60000) result = '刚刚';
        else if (diff < 3600000) result = `${Math.floor(diff / 60000)}分钟前`;
        else if (date.toDateString() === now.toDateString()) {
            result = `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (date.toDateString() === yesterday.toDateString()) {
                result = `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
            } else {
                result = date.toLocaleDateString('zh-CN') + ' ' + 
                         date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            }
        }

        dateCache.set(cacheKey, result);
        // 限制缓存大小
        if (dateCache.size > 100) {
            const firstKey = dateCache.keys().next().value;
            dateCache.delete(firstKey);
        }
        
        return result;
    }

    // HTML转义
    const escapeHtml = (function() {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;', 
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return function(unsafe) {
            return unsafe.replace(/[&<>"']/g, char => escapeMap[char]);
        };
    })();

    // ========== 初始化所有功能 ==========
    function initAll() {
        const initStartTime = performance.now();
        
        // 使用Promise.all并行初始化独立功能
        const initPromises = [
            Promise.resolve().then(initPageNavigation),
            Promise.resolve().then(initNavbarScroll),
            Promise.resolve().then(initImageLazyLoad),
            Promise.resolve().then(initCoverParallax),
            Promise.resolve().then(initImagePreview),
            Promise.resolve().then(initReviewSystem),
            Promise.resolve().then(initVideoLazyLoad),
            Promise.resolve().then(initVideoPlayer),
            Promise.resolve().then(initDownloadDropdown)
        ];

        Promise.all(initPromises).then(() => {
            const initTime = performance.now() - initStartTime;
            console.log(`🎮 游戏详情页所有功能初始化完成！耗时: ${initTime.toFixed(2)}ms`);
        }).catch(error => {
            console.error('初始化过程中出现错误:', error);
        });
    }

    // 启动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
});

// ========== 页面卸载前的清理 ==========
window.addEventListener('beforeunload', function() {
    // 清理缓存和事件监听器
    const reviewTextareas = document.querySelectorAll('.review-textarea, .reply-textarea');
    reviewTextareas.forEach(textarea => {
        textarea.replaceWith(textarea.cloneNode(true));
    });
});

// ========== 页面可见性变化处理 ==========
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // 页面重新可见时，重新初始化懒加载
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            if (img.getBoundingClientRect().top < window.innerHeight) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        });
    }
});