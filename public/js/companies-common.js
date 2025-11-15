// companies-common.js - 性能优化版
document.addEventListener('DOMContentLoaded', function() {
    console.log('companies-common.js 加载成功');

    // 使用缓存DOM查询
    const elements = {
        sortOptions: document.querySelectorAll('.company-common-sort-option'),
        worksGrid: document.getElementById('works-grid'),
        sortStatus: document.querySelector('.company-common-sort-status'),
        prevPageBtn: document.getElementById('prev-page'),
        nextPageBtn: document.getElementById('next-page'),
        currentPageSpan: document.getElementById('current-page'),
        totalPagesSpan: document.getElementById('total-pages'),
        pageSizeSelect: document.getElementById('page-size-select'),
        pageInput: document.getElementById('page-input'),
        goToPageBtn: document.getElementById('go-to-page')
    };

    // 检查必要元素是否存在
    if (!elements.worksGrid) {
        console.error('错误: 找不到 works-grid 元素');
        return;
    }

    // 状态变量 - 使用Map缓存排序结果
    let allWorks = [];
    let currentSortType = 'default';
    let currentPage = 1;
    let pageSize = parseInt(elements.pageSizeSelect?.value || 9);
    let sortCache = new Map(); // 缓存排序结果

    // 防抖函数 - 优化高频操作
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数 - 优化滚动等高频事件
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 优化DOM操作 - 使用文档片段
    function createDocumentFragment(nodes) {
        const fragment = document.createDocumentFragment();
        nodes.forEach(node => fragment.appendChild(node.cloneNode(true)));
        return fragment;
    }

    // 初始化：收集所有作品 - 优化数据提取
    function initializeWorks() {
        const workCards = elements.worksGrid.querySelectorAll('.company-common-work-card');
        allWorks = Array.from(workCards);
        
        // 预提取数据属性，减少后续DOM访问
        allWorks.forEach((work, index) => {
            work._cachedData = {
                name: work.getAttribute('data-name') || '',
                year: parseInt(work.getAttribute('data-year')) || 0,
                index: index
            };
        });
        
        console.log('初始化作品数据:', allWorks.length, '个作品');
        
        // 生产环境可关闭调试日志
        if (process.env.NODE_ENV !== 'production') {
            allWorks.forEach((work, index) => {
                const data = work._cachedData;
                console.log(`初始作品 ${index + 1}: ${data.name} - ${data.year}年`);
            });
        }
    }

    // 优化的比较函数 - 避免重复创建函数
    const sortComparators = {
        'name-asc': (a, b) => a._cachedData.name.localeCompare(b._cachedData.name, 'zh-CN'),
        'name-desc': (a, b) => b._cachedData.name.localeCompare(a._cachedData.name, 'zh-CN'),
        'year-asc': (a, b) => a._cachedData.year - b._cachedData.year,
        'year-desc': (a, b) => b._cachedData.year - a._cachedData.year,
        'default': (a, b) => a._cachedData.index - b._cachedData.index
    };

    // 全局排序函数 - 使用缓存优化
    function globalSortWorks(sortType) {
        // 检查缓存
        const cacheKey = `${sortType}-${allWorks.length}`;
        if (sortCache.has(cacheKey)) {
            console.log('使用缓存排序结果');
            return sortCache.get(cacheKey);
        }
        
        console.log('开始全局排序, 方式:', sortType);
        
        // 使用扩展运算符创建新数组（比slice稍快）
        const sortedWorks = [...allWorks];
        
        // 获取比较函数
        const comparator = sortComparators[sortType] || sortComparators.default;
        
        // 使用优化的排序
        if (sortType !== 'default') {
            sortedWorks.sort(comparator);
        }
        
        // 缓存结果
        sortCache.set(cacheKey, sortedWorks);
        
        // 限制缓存大小
        if (sortCache.size > 5) {
            const firstKey = sortCache.keys().next().value;
            sortCache.delete(firstKey);
        }
        
        return sortedWorks;
    }

    // 显示指定页面的作品 - 优化DOM操作
    function displayPage(sortedWorks, page, pageSize) {
        // 使用requestAnimationFrame优化渲染
        requestAnimationFrame(() => {
            // 计算分页范围
            const totalPages = Math.ceil(sortedWorks.length / pageSize);
            const startIndex = (page - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, sortedWorks.length);
            
            console.log(`显示第 ${page} 页: 作品 ${startIndex + 1}-${endIndex}, 共 ${sortedWorks.length} 个作品`);
            
            // 使用文档片段批量更新DOM
            const currentPageWorks = sortedWorks.slice(startIndex, endIndex);
            const fragment = createDocumentFragment(currentPageWorks);
            
            // 清空并插入新内容（减少重绘）
            elements.worksGrid.innerHTML = '';
            elements.worksGrid.appendChild(fragment);
            
            return totalPages;
        });
    }

    // 应用排序和分页 - 添加防抖
    const applySortAndPagination = debounce(function() {
        console.log('执行排序分页 - 方式:', currentSortType, '页码:', currentPage);
        
        // 1. 全局排序所有作品
        const sortedWorks = globalSortWorks(currentSortType);
        
        // 生产环境可关闭调试日志
        if (process.env.NODE_ENV !== 'production') {
            console.log('=== 排序结果 ===');
            sortedWorks.forEach((work, index) => {
                const data = work._cachedData;
                console.log(`${index + 1}. ${data.name} - ${data.year}年`);
            });
            console.log('===============');
        }
        
        // 2. 显示当前页
        const totalPages = displayPage(sortedWorks, currentPage, pageSize);
        
        // 3. 更新分页控件
        updatePaginationControls(totalPages);
    }, 16); // 约60fps

    // 更新分页控件
    function updatePaginationControls(totalPages) {
        requestAnimationFrame(() => {
            if (elements.totalPagesSpan) elements.totalPagesSpan.textContent = totalPages;
            if (elements.currentPageSpan) elements.currentPageSpan.textContent = currentPage;
            
            if (elements.prevPageBtn) elements.prevPageBtn.disabled = currentPage === 1;
            if (elements.nextPageBtn) {
                elements.nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
            }
            
            // 更新页码输入框的最大值
            if (elements.pageInput) {
                elements.pageInput.max = totalPages;
                elements.pageInput.value = currentPage;
            }
            
            console.log(`分页状态: 第 ${currentPage} 页 / 共 ${totalPages} 页`);
        });
    }

    // 跳转到指定页面
    function goToPage() {
        if (!elements.pageInput) return;
        
        const targetPage = parseInt(elements.pageInput.value);
        const sortedWorks = globalSortWorks(currentSortType);
        const totalPages = Math.ceil(sortedWorks.length / pageSize);
        
        if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPages) {
            // 输入无效，重置为当前页
            alert(`请输入有效的页码 (1-${totalPages})`);
            elements.pageInput.value = currentPage;
            return;
        }
        
        currentPage = targetPage;
        applySortAndPagination();
    }

    // 更新页码输入框的值
    function updatePageInput() {
        if (elements.pageInput) {
            elements.pageInput.value = currentPage;
        }
    }

    // 事件处理器 - 避免重复创建函数
    const eventHandlers = {
        handleSortOptionClick: function() {
            // 更新活动状态
            elements.sortOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            // 更新排序状态显示
            if (elements.sortStatus) {
                elements.sortStatus.textContent = `当前排序: ${this.textContent}`;
            }
            
            // 应用新排序
            currentSortType = this.getAttribute('data-sort');
            currentPage = 1;
            updatePageInput();
            applySortAndPagination();
        },
        
        handlePrevPage: function() {
            if (currentPage > 1) {
                currentPage--;
                updatePageInput();
                applySortAndPagination();
            }
        },
        
        handleNextPage: function() {
            const sortedWorks = globalSortWorks(currentSortType);
            const totalPages = Math.ceil(sortedWorks.length / pageSize);
            
            if (currentPage < totalPages) {
                currentPage++;
                updatePageInput();
                applySortAndPagination();
            }
        },
        
        handlePageSizeChange: function() {
            pageSize = parseInt(this.value);
            currentPage = 1;
            updatePageInput();
            applySortAndPagination();
        },
        
        handlePageInputKeyup: function(e) {
            if (e.key === 'Enter') {
                goToPage();
            }
        }
    };

    // 初始化事件监听 - 使用事件委托优化
    function initEventListeners() {
        // 排序选项点击事件
        elements.sortOptions.forEach(option => {
            option.addEventListener('click', eventHandlers.handleSortOptionClick);
        });

        // 分页按钮事件
        if (elements.prevPageBtn) {
            elements.prevPageBtn.addEventListener('click', eventHandlers.handlePrevPage);
        }

        if (elements.nextPageBtn) {
            elements.nextPageBtn.addEventListener('click', eventHandlers.handleNextPage);
        }

        // 每页数量更改事件
        if (elements.pageSizeSelect) {
            elements.pageSizeSelect.addEventListener('change', eventHandlers.handlePageSizeChange);
        }
        
        // 页码输入框事件
        if (elements.pageInput) {
            elements.pageInput.addEventListener('keyup', eventHandlers.handlePageInputKeyup);
        }
        
        // 前往按钮事件
        if (elements.goToPageBtn) {
            elements.goToPageBtn.addEventListener('click', goToPage);
        }
    }

    // 清理函数 - 避免内存泄漏
    function cleanup() {
        sortCache.clear();
        allWorks = [];
        
        // 移除事件监听器
        elements.sortOptions.forEach(option => {
            option.removeEventListener('click', eventHandlers.handleSortOptionClick);
        });
        
        if (elements.prevPageBtn) {
            elements.prevPageBtn.removeEventListener('click', eventHandlers.handlePrevPage);
        }
        
        if (elements.nextPageBtn) {
            elements.nextPageBtn.removeEventListener('click', eventHandlers.handleNextPage);
        }
        
        if (elements.pageSizeSelect) {
            elements.pageSizeSelect.removeEventListener('change', eventHandlers.handlePageSizeChange);
        }
        
        if (elements.pageInput) {
            elements.pageInput.removeEventListener('keyup', eventHandlers.handlePageInputKeyup);
        }
        
        if (elements.goToPageBtn) {
            elements.goToPageBtn.removeEventListener('click', goToPage);
        }
    }

    // 主初始化函数
    function init() {
        console.log('初始化分页排序系统...');
        
        try {
            // 1. 收集作品数据
            initializeWorks();
            
            // 2. 设置事件监听
            initEventListeners();
            
            // 3. 初始显示
            applySortAndPagination();
            
            console.log('分页排序系统初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }

    // 启动系统
    init();

    // 页面卸载时清理
    window.addEventListener('beforeunload', cleanup);
});