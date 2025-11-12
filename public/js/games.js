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
    
    // 初始隐藏空状态
    gamesEmpty.style.display = 'none';
    
    // 检查主题状态
    function checkThemeState() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        console.log('当前主题状态:', currentTheme);
        return currentTheme;
    }
    
    // 全局排序函数
    function sortGames(games, sortValue) {
        const sortedGames = [...games];
        
        sortedGames.sort((a, b) => {
            const nameA = a.dataset.name || '';
            const nameB = b.dataset.name || '';
            const yearA = parseInt(a.dataset.year) || 0;
            const yearB = parseInt(b.dataset.year) || 0;
            const ratingA = parseFloat(a.dataset.rating) || 0;
            const ratingB = parseFloat(b.dataset.rating) || 0;
            
            switch (sortValue) {
                case 'year-desc':
                    return yearB - yearA;
                case 'year-asc':
                    return yearA - yearB;
                case 'name-asc':
                    return nameA.localeCompare(nameB, 'zh-CN');
                case 'name-desc':
                    return nameB.localeCompare(nameA, 'zh-CN');
                case 'rating-desc':
                    return ratingB - ratingA;
                default:
                    return 0;
            }
        });
        
        return sortedGames;
    }
    
    // 显示指定页面的游戏
    function displayPage(games, page, pageSize) {
        gamesGrid.innerHTML = '';
        
        const totalPages = Math.ceil(games.length / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, games.length);
        
        console.log(`显示第 ${page} 页: 游戏 ${startIndex + 1}-${endIndex}, 共 ${games.length} 个游戏`);
        
        // 显示当前页的游戏 - 使用原始元素
        for (let i = startIndex; i < endIndex; i++) {
            // 找到在原始数组中的索引
            const originalIndex = allGameCards.indexOf(games[i]);
            if (originalIndex !== -1) {
                gamesGrid.appendChild(originalGameCards[originalIndex]);
            }
        }
        
        // 确保应用当前主题
        const currentTheme = checkThemeState();
        gamesGrid.setAttribute('data-theme', currentTheme);
        
        return totalPages;
    }
    
    // 更新分页控件
    function updatePaginationControls(totalPages) {
        if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
        if (currentPageSpan) currentPageSpan.textContent = currentPage;
        
        if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        
        if (pageInput) {
            pageInput.max = totalPages;
            pageInput.value = currentPage;
        }
        
        console.log(`分页状态: 第 ${currentPage} 页 / 共 ${totalPages} 页`);
    }
    
    // 主筛选排序分页函数
    function filterSortAndPaginate() {
        const companyValue = companyFilter.value;
        const searchValue = searchInput.value.toLowerCase().trim();
        const sortValue = sortSelect.value;
        
        console.log('执行筛选排序 - 会社:', companyValue, '搜索:', searchValue, '排序:', sortValue);
        
        // 筛选
        let filteredGames = allGameCards.filter(card => {
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
        
        console.log('筛选后游戏数量:', filteredGames.length);
        
        // 排序
        const sortedGames = sortGames(filteredGames, sortValue);
        
        // 分页显示
        const totalPages = displayPage(sortedGames, currentPage, pageSize);
        
        // 更新分页控件
        updatePaginationControls(totalPages);
        
        // 显示/隐藏空状态
        if (filteredGames.length > 0) {
            gamesEmpty.style.display = 'none';
            gamesGrid.style.display = 'grid';
        } else {
            gamesGrid.style.display = 'none';
            gamesEmpty.style.display = 'block';
        }
        
        // 添加动画效果
        const currentCards = gamesGrid.querySelectorAll('.game-card');
        currentCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    // 跳转到指定页面
    function goToPage() {
        if (!pageInput) return;
        
        const targetPage = parseInt(pageInput.value);
        const companyValue = companyFilter.value;
        const searchValue = searchInput.value.toLowerCase().trim();
        const sortValue = sortSelect.value;
        
        // 重新计算筛选后的游戏
        let filteredGames = allGameCards.filter(card => {
            const company = card.dataset.company || '';
            const name = (card.dataset.name || '').toLowerCase();
            
            if (companyValue && company !== companyValue) return false;
            if (searchValue && !name.includes(searchValue)) return false;
            return true;
        });
        
        const sortedGames = sortGames(filteredGames, sortValue);
        const totalPages = Math.ceil(sortedGames.length / pageSize);
        
        if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPages) {
            alert(`请输入有效的页码 (1-${totalPages})`);
            pageInput.value = currentPage;
            return;
        }
        
        currentPage = targetPage;
        filterSortAndPaginate();
    }
    
    // 重置到原始状态
    function resetToOriginal() {
        // 重新获取原始元素引用
        allGameCards = [...originalGameCards];
        currentPage = 1;
        if (pageInput) pageInput.value = '1';
        if (companyFilter) companyFilter.value = '';
        if (sortSelect) sortSelect.value = 'year-desc';
        if (searchInput) searchInput.value = '';
    }
    
    // 事件监听器
    function initEventListeners() {
        // 筛选器事件
        companyFilter.addEventListener('change', function() {
            currentPage = 1;
            filterSortAndPaginate();
        });
        
        sortSelect.addEventListener('change', function() {
            currentPage = 1;
            filterSortAndPaginate();
        });
        
        // 搜索防抖
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                filterSortAndPaginate();
            }, 300);
        });
        
        // 分页事件
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    filterSortAndPaginate();
                }
            });
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', function() {
                currentPage++;
                filterSortAndPaginate();
            });
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
            goToPageBtn.addEventListener('click', goToPage);
        }
        
        // 监听主题变化
        const themeToggle = document.getElementById('theme');
        if (themeToggle) {
            themeToggle.addEventListener('change', function() {
                console.log('主题切换事件触发');
                // 主题切换后短暂延迟然后重新应用筛选分页
                setTimeout(() => {
                    filterSortAndPaginate();
                }, 50);
            });
        }
        
        // 监听窗口焦点变化（处理浏览器返回等情况）
        window.addEventListener('focus', function() {
            // 检查主题状态是否变化
            const currentTheme = checkThemeState();
            const lastKnownTheme = window.lastKnownTheme;
            
            if (lastKnownTheme !== currentTheme) {
                console.log('检测到主题变化，重新渲染');
                filterSortAndPaginate();
            }
            
            window.lastKnownTheme = currentTheme;
        });
    }
    
    // 初始化
    function init() {
        console.log('初始化游戏页面筛选排序系统...');
        console.log('初始游戏数量:', allGameCards.length);
        
        // 保存初始主题状态
        window.lastKnownTheme = checkThemeState();
        
        initEventListeners();
        filterSortAndPaginate();
        
        console.log('游戏页面筛选排序系统初始化完成');
    }
    
    // 启动
    init();
});
