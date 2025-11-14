// 游戏详情页交互功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('游戏详情页交互功能加载中...');

    // ========== 页面导航功能 ==========
    function initPageNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const pages = document.querySelectorAll('.page');
        
        navButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetPage = this.getAttribute('data-page');
                
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
                
                // 滚动到页面顶部
                window.scrollTo({
                    top: document.querySelector('.page-content').offsetTop - 100,
                    behavior: 'smooth'
                });
                
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
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > lastScrollY && window.scrollY > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            lastScrollY = window.scrollY;
            
            // 背景透明度变化
            const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            navbar.style.background = `rgba(255, 255, 255, ${Math.min(scrolled * 2, 0.9)})`;
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
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                    
                    // 加载完成后添加加载完成类
                    img.addEventListener('load', () => {
                        img.classList.add('loaded');
                    });
                }
            });
        }, {
            rootMargin: '50px'
        });

        images.forEach(img => imageObserver.observe(img));
        console.log(`图片懒加载初始化完成，监控 ${images.length} 张图片`);
    }

    // ========== 封面鼠标视差效果 ==========
    function initCoverParallax() {
        const gameCover = document.querySelector('.game-cover');
        if (!gameCover) return;
        
        document.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
            
            gameCover.style.transform = `translateY(-8px) rotate3d(${moveY}, ${moveX}, 0, 5deg)`;
        });

        // 鼠标离开时恢复
        document.addEventListener('mouseleave', () => {
            gameCover.style.transform = 'translateY(-8px)';
        });
        
        console.log('封面视差效果初始化完成');
    }

    // ========== 图片点击预览 ==========
    function initImagePreview() {
        document.querySelectorAll('.screenshot-image').forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', function() {
                const overlay = document.createElement('div');
                overlay.className = 'image-modal';
                overlay.style.cssText = `
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
                
                const enlargedImg = document.createElement('img');
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
                overlay.addEventListener('click', function(e) {
                    if (e.target === overlay || e.target === enlargedImg) {
                        document.body.removeChild(overlay);
                    }
                });
                
                // ESC键关闭
                const closeOnEsc = function(e) {
                    if (e.key === 'Escape') {
                        document.body.removeChild(overlay);
                        document.removeEventListener('keydown', closeOnEsc);
                    }
                };
                document.addEventListener('keydown', closeOnEsc);
                
                console.log('打开图片预览');
            });
        });
        
        console.log('图片预览功能初始化完成');
    }

    // ========== 视频点击播放功能 ==========
    function initVideoPlayer() {
        const videoPlaceholders = document.querySelectorAll('.video-placeholder');
        
        videoPlaceholders.forEach(placeholder => {
            placeholder.addEventListener('click', function() {
                // 如果已经在播放，点击不执行任何操作
                if (this.classList.contains('playing')) return;
                
                const videoSrc = this.getAttribute('data-src');
                if (!videoSrc) return;
                
                // 根据文件扩展名判断视频类型
                const videoExt = getFileExtension(videoSrc);
                
                if (isDirectVideoFormat(videoExt)) {
                    // 直接播放的视频格式（MP4、WebM、OGG等）
                    playDirectVideo(this, videoSrc);
                } else if (isEmbedVideo(videoSrc)) {
                    // 嵌入视频（YouTube、B站等）
                    playEmbedVideo(this, videoSrc);
                } else {
                    // 未知格式，使用通用处理
                    playGenericVideo(this, videoSrc);
                }
                
                console.log('开始播放视频，格式:', videoExt);
            });
        });
        
        console.log('视频播放器初始化完成');
    }

    // 获取文件扩展名
    function getFileExtension(url) {
        return url.split('.').pop().toLowerCase().split('?')[0];
    }

    // 判断是否为直接播放的视频格式
    function isDirectVideoFormat(ext) {
        const directFormats = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv'];
        return directFormats.includes(ext);
    }

    // 判断是否为嵌入视频
    function isEmbedVideo(url) {
        return url.includes('youtube.com') || 
               url.includes('youtu.be') || 
               url.includes('bilibili.com') ||
               url.includes('vimeo.com');
    }

    // 播放直接视频格式
    function playDirectVideo(container, src) {
        const video = document.createElement('video');
        video.src = src;
        video.controls = true;
        video.style.cssText = `
            width: 100%;
            height: auto;
            display: block;
            border-radius: 12px;
        `;
        
        // 替换占位符
        container.innerHTML = '';
        container.appendChild(video);
        container.classList.add('playing');
        
        // 自动播放
        video.play().catch(error => {
            console.log('自动播放被阻止:', error);
        });
    }

    // 播放嵌入视频
    function playEmbedVideo(container, src) {
        const iframe = document.createElement('iframe');
        
        let finalSrc = src;
        if (src.includes('youtube.com') || src.includes('youtu.be')) {
            // YouTube 视频
            finalSrc = `${src}${src.includes('?') ? '&' : '?'}autoplay=1&rel=0&modestbranding=1`;
        } else if (src.includes('bilibili.com')) {
            // B站视频
            finalSrc = `${src}${src.includes('?') ? '&' : '?'}autoplay=true`;
        } else {
            // 其他嵌入视频
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
        
        // 创建包装容器
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 56.25%;
        `;
        wrapper.appendChild(iframe);
        
        // 替换占位符
        container.innerHTML = '';
        container.appendChild(wrapper);
        container.classList.add('playing');
    }

    // 通用视频处理
    function playGenericVideo(container, src) {
        // 尝试使用 video 元素
        const video = document.createElement('video');
        video.src = src;
        video.controls = true;
        video.style.cssText = `
            width: 100%;
            height: auto;
            display: block;
            border-radius: 12px;
        `;
        
        video.onerror = function() {
            // 如果 video 元素不支持，尝试使用 iframe
            console.log('Video 元素不支持该格式，尝试使用 iframe');
            const iframe = document.createElement('iframe');
            iframe.src = src;
            iframe.style.cssText = `
                width: 100%;
                height: 400px;
                border: none;
                border-radius: 12px;
            `;
            
            container.innerHTML = '';
            container.appendChild(iframe);
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

    // 切换下拉菜单显示/隐藏
    mainButton.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = dropdownMenu.classList.contains('open');
        
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });

    // 点击下载选项
    downloadOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('data-url');
            const name = this.querySelector('.option-name').textContent;
            
            if (url) {
                // 打开下载链接
                window.open(url, '_blank');
                console.log(`开始下载: ${name}`);
                
                // 这里可以添加下载统计
                // gtag('event', 'download', {
                //     'event_category': 'game_download',
                //     'event_label': name
                // });
                
                // 关闭下拉菜单
                closeDropdown();
                
                // 显示下载提示
                showMessage(`开始下载: ${name}`, 'success');
            }
        });
    });

    // 点击页面其他区域关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (!downloadDropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    // ESC键关闭下拉菜单
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    function openDropdown() {
        dropdownMenu.classList.add('open');
        mainButton.classList.add('open');
    }

    function closeDropdown() {
        dropdownMenu.classList.remove('open');
        mainButton.classList.remove('open');
    }

    console.log(`下载下拉菜单初始化完成，找到 ${downloadOptions.length} 个下载选项`);
}

    // ========== 评价系统 ==========
    function initReviewSystem() {
        const reviewTextarea = document.querySelector('.review-textarea');
        const charCount = document.querySelector('.char-count');
        const reviewSubmit = document.querySelector('.review-submit');
        const reviewsList = document.querySelector('.reviews-list');

        // 字符计数功能（可选，但不再限制）
        if (reviewTextarea && charCount) {
            reviewTextarea.addEventListener('input', function() {
                const length = this.value.length;
                charCount.textContent = length;
                
                // 启用/禁用提交按钮 - 只要不为空即可
                if (reviewSubmit) {
                    reviewSubmit.disabled = length === 0;
                    
                    // 实时样式反馈
                    if (length === 0) {
                        this.style.borderColor = '#e74c3c';
                    } else {
                        this.style.borderColor = '#4A6CF7';
                    }
                }
            });

            // 初始状态
            charCount.textContent = '0';
        }

        // 提交评价功能
        if (reviewSubmit) {
            reviewSubmit.addEventListener('click', function() {
                const content = reviewTextarea.value.trim();
                
                // 移除10字最小限制，只要不为空即可
                if (content.length === 0) {
                    showMessage('评价内容不能为空', 'error');
                    reviewTextarea.focus();
                    return;
                }
                
                // 添加评价
                addReview(content);
                
                // 重置表单
                reviewTextarea.value = '';
                if (charCount) {
                    charCount.textContent = '0';
                }
                reviewSubmit.disabled = true;
                reviewTextarea.style.borderColor = '';
                
                // 成功提示
                showMessage('评价发布成功！', 'success');
            });
        }

        // 回车提交评价 (Ctrl+Enter)
        if (reviewTextarea) {
            reviewTextarea.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'Enter') {
                    reviewSubmit.click();
                }
            });
        }

        console.log('评价系统初始化完成');
    }

    // ========== 添加评价到列表 ==========
    function addReview(content) {
        // 移除占位符
        const placeholder = document.querySelector('.review-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // 创建评价元素
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        const reviewId = 'review-' + Date.now();
        reviewItem.setAttribute('data-review-id', reviewId);
        
        const now = new Date();
        const dateString = formatDate(now);
        
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
        
        // 添加到列表顶部
        const reviewsList = document.querySelector('.reviews-list');
        if (reviewsList) {
            reviewsList.insertBefore(reviewItem, reviewsList.firstChild);
        }
        
        // 初始化评价交互
        initReviewInteractions(reviewItem);
        
        console.log(`添加新评价: ${content.substring(0, 50)}...`);
    }

    // ========== 初始化评价交互功能 ==========
    function initReviewInteractions(reviewItem) {
        const likeBtn = reviewItem.querySelector('.like-btn');
        const reviewLikes = reviewItem.querySelector('.review-likes');
        const replyBtn = reviewItem.querySelector('.reply-btn');
        const replySection = reviewItem.querySelector('.reply-section');
        const replyTextarea = reviewItem.querySelector('.reply-textarea');
        const replyCancel = reviewItem.querySelector('.reply-cancel');
        const replySubmit = reviewItem.querySelector('.reply-submit');
        const replyCounter = reviewItem.querySelector('.reply-counter');
        const repliesList = reviewItem.querySelector('.replies-list');

        let likeCount = 0;
        let hasLiked = false;

        // 点赞功能
        if (likeBtn && reviewLikes) {
            likeBtn.addEventListener('click', function() {
                if (hasLiked) {
                    likeCount--;
                    hasLiked = false;
                    this.classList.remove('liked');
                } else {
                    likeCount++;
                    hasLiked = true;
                    this.classList.add('liked');
                }
                
                reviewLikes.textContent = `${likeCount} 人觉得有用`;
                
                // 点赞动画
                this.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 200);
                
                console.log(`评价点赞: ${likeCount}`);
            });
        }

        // 回复功能
        if (replyBtn && replySection) {
            // 显示/隐藏回复框
            replyBtn.addEventListener('click', function() {
                const isVisible = replySection.style.display === 'block';
                replySection.style.display = isVisible ? 'none' : 'block';
                if (!isVisible) {
                    replyTextarea.focus();
                }
            });

            // 回复内容变化 - 移除字数限制
            replyTextarea.addEventListener('input', function() {
                const content = this.value;
                const length = content.length;
                
                // 只显示当前字数
                if (replyCounter) {
                    replyCounter.textContent = `${length}`;
                }
                
                // 只要不为空即可提交
                replySubmit.disabled = length === 0;
                
                // 样式反馈
                if (length === 0) {
                    this.style.borderColor = '#e74c3c';
                } else {
                    this.style.borderColor = '#4A6CF7';
                }
            });

            // 取消回复
            replyCancel.addEventListener('click', function() {
                replySection.style.display = 'none';
                replyTextarea.value = '';
                if (replyCounter) {
                    replyCounter.textContent = '0';
                }
                replySubmit.disabled = true;
                replyTextarea.style.borderColor = '';
            });

            // 提交回复
            replySubmit.addEventListener('click', function() {
                const content = replyTextarea.value.trim();
                
                // 移除字数限制，只要不为空即可
                if (content.length === 0) {
                    showMessage('回复内容不能为空', 'error');
                    return;
                }
                
                addReply(repliesList, content);
                replySection.style.display = 'none';
                replyTextarea.value = '';
                if (replyCounter) {
                    replyCounter.textContent = '0';
                }
                replySubmit.disabled = true;
                replyTextarea.style.borderColor = '';
                
                showMessage('回复发布成功！', 'success');
            });

            // 回车提交回复 (Ctrl+Enter)
            replyTextarea.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'Enter') {
                    replySubmit.click();
                }
            });
        }
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
        
        // 初始化回复点赞功能
        const likeReplyBtn = replyItem.querySelector('.like-reply-btn');
        if (likeReplyBtn) {
            let replyLiked = false;
            likeReplyBtn.addEventListener('click', function() {
                replyLiked = !replyLiked;
                this.classList.toggle('liked', replyLiked);
            });
        }
        
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
            rootMargin: '100px'
        });

        videos.forEach(video => videoObserver.observe(video));
        console.log(`视频懒加载初始化完成，监控 ${videos.length} 个视频`);
    }

    // ========== 工具函数 ==========
    
    // 显示消息提示
    function showMessage(message, type = 'info') {
        // 移除现有消息
        const existingMessage = document.querySelector('.message-toast');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `message-toast message-${type}`;
        messageEl.textContent = message;
        
        // 添加样式
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
        
        // 显示动画
        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, 300);
        }, 3000);
    }

    // 格式化日期
    function formatDate(date) {
        const now = new Date();
        const diff = now - date;
        
        // 1分钟内
        if (diff < 60000) {
            return '刚刚';
        }
        
        // 1小时内
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}分钟前`;
        }
        
        // 今天内
        if (date.toDateString() === now.toDateString()) {
            return `今天 ${date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        }
        
        // 昨天
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `昨天 ${date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        }
        
        // 更早的日期
        return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // HTML转义
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ========== 初始化所有功能 ==========
    function initAll() {
        initPageNavigation();
        initNavbarScroll();
        initImageLazyLoad();
        initCoverParallax();
        initImagePreview();
        initReviewSystem();
        initVideoLazyLoad();
        initVideoPlayer();
        initDownloadDropdown(); 
        
        console.log('🎮 游戏详情页所有功能初始化完成！');
    }

    // 启动初始化
    initAll();
});

// ========== 页面卸载前的清理 ==========
window.addEventListener('beforeunload', function() {
    // 清理可能的事件监听器
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