document.addEventListener('DOMContentLoaded', function() {
    const gamesGrid = document.getElementById('games-grid');
    const gamesEmpty = document.getElementById('games-empty');
    const companyFilter = document.getElementById('company-filter');
    const sortSelect = document.getElementById('sort-select');
    const searchInput = document.getElementById('search-input');
    
    // 分页元素
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const pageSizeSelect = document.getElementById('page-size-select');
    const pageInput = document.getElementById('page-input');
    const goToPageBtn = document.getElementById('go-to-page');
    
    // 状态变量
    let allGameCards = Array.from(gamesGrid.querySelectorAll('.game-card'));
    const originalGameCards = [...allGameCards]; // 保存原始引用
    let currentPage = 1;
    let pageSize = parseInt(pageSizeSelect?.value || 9);
    
    // 性能优化缓存
    const filterCache = new Map();
    const sortCache = new Map();
    let lastFilterState = '';
    
    // 初始隐藏空状态
    gamesEmpty.style.display = 'none';
    
    // 性能优化工具函数
    const perfUtils = {
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
        batchDOMUpdate: function(callback) {
            requestAnimationFrame(callback);
        }
    };
    
    // 检查主题状态
    function checkThemeState() {
        return document.documentElement.getAttribute('data-theme');
    }
    
    // 优化的排序比较器
    const sortComparators = {
        'year-desc': (a, b) => (parseInt(b.dataset.year) || 0) - (parseInt(a.dataset.year) || 0),
        'year-asc': (a, b) => (parseInt(a.dataset.year) || 0) - (parseInt(b.dataset.year) || 0),
        'name-asc': (a, b) => (a.dataset.name || '').localeCompare(b.dataset.name || '', 'zh-CN'),
        'name-desc': (a, b) => (b.dataset.name || '').localeCompare(a.dataset.name || '', 'zh-CN'),
        'rating-desc': (a, b) => (parseFloat(b.dataset.rating) || 0) - (parseFloat(a.dataset.rating) || 0)
    };
    
    // 全局排序函数（优化版）
    function sortGames(games, sortValue) {
        const cacheKey = `${sortValue}-${games.length}`;
        
        // 检查缓存
        if (sortCache.has(cacheKey)) {
            return sortCache.get(cacheKey);
        }
        
        const sortedGames = [...games];
        const comparator = sortComparators[sortValue];
        
        if (comparator) {
            sortedGames.sort(comparator);
        }
        
        // 缓存结果
        sortCache.set(cacheKey, sortedGames);
        
        // 限制缓存大小
        if (sortCache.size > 10) {
            const firstKey = sortCache.keys().next().value;
            sortCache.delete(firstKey);
        }
        
        return sortedGames;
    }
    
    // 优化的筛选函数
    function filterGames() {
        const companyValue = companyFilter.value;
        const searchValue = searchInput.value.toLowerCase().trim();
        const filterKey = `${companyValue}-${searchValue}`;
        
        // 检查缓存
        if (filterCache.has(filterKey) && lastFilterState === filterKey) {
            return filterCache.get(filterKey);
        }
        
        const filteredGames = allGameCards.filter(card => {
            const company = card.dataset.company || '';
            const name = (card.dataset.name || '').toLowerCase();
            
            // 会社筛选
            if (companyValue && company !== companyValue) {
                return false;
            }
            
            // 搜索筛选
            if (searchValue && !name.includes(searchValue)) {
                return false;
            }
            
            return true;
        });
        
        // 缓存结果
        filterCache.set(filterKey, filteredGames);
        lastFilterState = filterKey;
        
        // 限制缓存大小
        if (filterCache.size > 10) {
            const firstKey = filterCache.keys().next().value;
            filterCache.delete(firstKey);
        }
        
        return filteredGames;
    }
    
    // 显示指定页面的游戏（优化版）
    function displayPage(games, page, pageSize) {
        return new Promise(resolve => {
            perfUtils.batchDOMUpdate(() => {
                // 使用文档片段优化DOM操作
                const fragment = document.createDocumentFragment();
                const totalPages = Math.ceil(games.length / pageSize);
                const startIndex = (page - 1) * pageSize;
                const endIndex = Math.min(startIndex + pageSize, games.length);
                
                console.log(`显示第 ${page} 页: 游戏 ${startIndex + 1}-${endIndex}, 共 ${games.length} 个游戏`);
                
                // 显示当前页的游戏 - 使用原始元素
                for (let i = startIndex; i < endIndex; i++) {
                    const originalIndex = allGameCards.indexOf(games[i]);
                    if (originalIndex !== -1) {
                        fragment.appendChild(originalGameCards[originalIndex].cloneNode(true));
                    }
                }
                
                // 批量更新DOM
                gamesGrid.innerHTML = '';
                gamesGrid.appendChild(fragment);
                
                // 确保应用当前主题
                const currentTheme = checkThemeState();
                gamesGrid.setAttribute('data-theme', currentTheme);
                
                resolve(totalPages);
            });
        });
    }
    
    // 更新分页控件
    function updatePaginationControls(totalPages) {
        perfUtils.batchDOMUpdate(() => {
            if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
            if (currentPageSpan) currentPageSpan.textContent = currentPage;
            
            if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
            if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
            
            if (pageInput) {
                pageInput.max = totalPages;
                pageInput.value = currentPage;
            }
            
            console.log(`分页状态: 第 ${currentPage} 页 / 共 ${totalPages} 页`);
        });
    }
    
    // 添加卡片动画（优化版）
    function animateCards() {
        const currentCards = gamesGrid.querySelectorAll('.game-card');
        
        perfUtils.batchDOMUpdate(() => {
            currentCards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    card.style.transition = 'all 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 50); // 减少延迟时间
            });
        });
    }
    
    // 主筛选排序分页函数（优化版）
    async function filterSortAndPaginate() {
        const companyValue = companyFilter.value;
        const searchValue = searchInput.value.toLowerCase().trim();
        const sortValue = sortSelect.value;
        
        console.log('执行筛选排序 - 会社:', companyValue, '搜索:', searchValue, '排序:', sortValue);
        
        try {
            // 并行执行筛选和排序
            const [filteredGames, sortedGames] = await Promise.all([
                Promise.resolve(filterGames()),
                Promise.resolve().then(() => {
                    const filtered = filterGames();
                    return sortGames(filtered, sortValue);
                })
            ]);
            
            console.log('筛选后游戏数量:', filteredGames.length);
            
            // 分页显示
            const totalPages = await displayPage(sortedGames, currentPage, pageSize);
            
            // 更新分页控件
            updatePaginationControls(totalPages);
            
            // 显示/隐藏空状态
            perfUtils.batchDOMUpdate(() => {
                if (filteredGames.length > 0) {
                    gamesEmpty.style.display = 'none';
                    gamesGrid.style.display = 'grid';
                    animateCards();
                } else {
                    gamesGrid.style.display = 'none';
                    gamesEmpty.style.display = 'block';
                }
            });
            
        } catch (error) {
            console.error('筛选排序分页过程中出错:', error);
        }
    }
    
    // 跳转到指定页面（优化版）
    async function goToPage() {
        if (!pageInput) return;
        
        const targetPage = parseInt(pageInput.value);
        const filteredGames = filterGames();
        const sortedGames = sortGames(filteredGames, sortSelect.value);
        const totalPages = Math.ceil(sortedGames.length / pageSize);
        
        if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPages) {
            alert(`请输入有效的页码 (1-${totalPages})`);
            pageInput.value = currentPage;
            return;
        }
        
        currentPage = targetPage;
        await filterSortAndPaginate();
    }
    
    // 重置到原始状态
    function resetToOriginal() {
        // 重新获取原始元素引用
        allGameCards = [...originalGameCards];
        currentPage = 1;
        
        // 清空缓存
        filterCache.clear();
        sortCache.clear();
        lastFilterState = '';
        
        if (pageInput) pageInput.value = '1';
        if (companyFilter) companyFilter.value = '';
        if (sortSelect) sortSelect.value = 'year-desc';
        if (searchInput) searchInput.value = '';
    }
    
    // 事件监听器（优化版）
    function initEventListeners() {
        // 使用防抖优化频繁事件
        const debouncedFilter = perfUtils.debounce(() => {
            currentPage = 1;
            filterSortAndPaginate();
        }, 150);
        
        // 筛选器事件
        companyFilter.addEventListener('change', debouncedFilter);
        sortSelect.addEventListener('change', debouncedFilter);
        
        // 搜索事件
        searchInput.addEventListener('input', debouncedFilter);
        
        // 分页事件
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', perfUtils.throttle(function() {
                if (currentPage > 1) {
                    currentPage--;
                    filterSortAndPaginate();
                }
            }, 500));
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', perfUtils.throttle(function() {
                currentPage++;
                filterSortAndPaginate();
            }, 500));
        }
        
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', function() {
                pageSize = parseInt(this.value);
                currentPage = 1;
                filterSortAndPaginate();
            });
        }
        
        if (pageInput) {
            pageInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    goToPage();
                }
            });
        }
        
        if (goToPageBtn) {
            goToPageBtn.addEventListener('click', perfUtils.throttle(goToPage, 500));
        }
        
        // 监听主题变化（优化版）
        const themeToggle = document.getElementById('theme');
        if (themeToggle) {
            themeToggle.addEventListener('change', perfUtils.debounce(function() {
                console.log('主题切换事件触发');
                filterSortAndPaginate();
            }, 100));
        }
        
        // 监听窗口焦点变化（处理浏览器返回等情况）
        window.addEventListener('focus', perfUtils.throttle(function() {
            const currentTheme = checkThemeState();
            const lastKnownTheme = window.lastKnownTheme;
            
            if (lastKnownTheme !== currentTheme) {
                console.log('检测到主题变化，重新渲染');
                filterSortAndPaginate();
            }
            
            window.lastKnownTheme = currentTheme;
        }, 1000));
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', perfUtils.throttle(function() {
            if (document.visibilityState === 'visible') {
                const currentTheme = checkThemeState();
                if (window.lastKnownTheme !== currentTheme) {
                    console.log('页面重新可见，检测到主题变化');
                    filterSortAndPaginate();
                }
                window.lastKnownTheme = currentTheme;
            }
        }, 1000));
    }
    
    // 清理函数
    function cleanup() {
        filterCache.clear();
        sortCache.clear();
        allGameCards = [];
    }
    
    // 初始化
    async function init() {
        console.log('初始化游戏页面筛选排序系统...');
        console.log('初始游戏数量:', allGameCards.length);
        
        // 保存初始主题状态
        window.lastKnownTheme = checkThemeState();
        
        initEventListeners();
        await filterSortAndPaginate();
        
        console.log('游戏页面筛选排序系统初始化完成');
    }
    
    // 启动
    init();
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', cleanup);
});