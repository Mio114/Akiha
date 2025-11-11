document.addEventListener('DOMContentLoaded', function() {
    const gamesGrid = document.getElementById('games-grid');
    const gamesEmpty = document.getElementById('games-empty');
    const companyFilter = document.getElementById('company-filter');
    const sortSelect = document.getElementById('sort-select');
    const searchInput = document.getElementById('search-input');
    
    const gameCards = Array.from(gamesGrid.querySelectorAll('.game-card'));
    
    // 初始隐藏空状态
    gamesEmpty.style.display = 'none';
    
    function filterAndSortGames() {
        const companyValue = companyFilter.value;
        const searchValue = searchInput.value.toLowerCase().trim();
        const sortValue = sortSelect.value;
        
        let filteredGames = gameCards.filter(card => {
            const company = card.dataset.company || '';
            const name = (card.dataset.name || '').toLowerCase();
            const year = card.dataset.year || '';
            const rating = card.dataset.rating || '0';
            
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
        
        // 排序
        filteredGames.sort((a, b) => {
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
        
        // 更新显示
        gamesGrid.innerHTML = '';
        
        if (filteredGames.length > 0) {
            filteredGames.forEach(card => gamesGrid.appendChild(card));
            gamesEmpty.style.display = 'none';
            gamesGrid.style.display = 'grid';
        } else {
            gamesGrid.style.display = 'none';
            gamesEmpty.style.display = 'block';
        }
    }
    
    // 事件监听
    companyFilter.addEventListener('change', filterAndSortGames);
    sortSelect.addEventListener('change', filterAndSortGames);
    searchInput.addEventListener('input', filterAndSortGames);
    
    // 防抖搜索
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAndSortGames, 300);
    });
    
    // 初始显示
    filterAndSortGames();
    
    // 添加加载动画
    gameCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});