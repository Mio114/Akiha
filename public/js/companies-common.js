// companies-common.js - 完全修复跳转问题
document.addEventListener('DOMContentLoaded', function() {
    console.log('companies-common.js 加载成功');

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

    if (!elements.worksGrid) {
        console.error('错误: 找不到 works-grid 元素');
        return;
    }

    let allWorks = [];
    let currentSortType = 'default';
    let currentPage = 1;
    let pageSize = parseInt(elements.pageSizeSelect?.value || 9);

    function initializeWorks() {
        const workCards = elements.worksGrid.querySelectorAll('.company-common-work-card');
        allWorks = Array.from(workCards);
        
        // 关键修复：在初始化时就保存每个作品的原始HTML和链接信息
        allWorks.forEach((work, index) => {
            work._originalHTML = work.outerHTML; // 保存原始HTML
            work._originalHref = work.querySelector('a')?.getAttribute('href') || '';
            work._dataGame = work.querySelector('a')?.getAttribute('data-game') || '';
            
            console.log(`作品 ${index + 1}:`, {
                href: work._originalHref,
                dataGame: work._dataGame,
                hasLink: !!work.querySelector('a')
            });
        });
        
        console.log('初始化作品数据:', allWorks.length, '个作品');
    }

    const sortComparators = {
        'name-asc': (a, b) => {
            const nameA = a.getAttribute('data-name') || '';
            const nameB = b.getAttribute('data-name') || '';
            return nameA.localeCompare(nameB, 'zh-CN');
        },
        'name-desc': (a, b) => {
            const nameA = a.getAttribute('data-name') || '';
            const nameB = b.getAttribute('data-name') || '';
            return nameB.localeCompare(nameA, 'zh-CN');
        },
        'year-asc': (a, b) => {
            const yearA = parseInt(a.getAttribute('data-year')) || 0;
            const yearB = parseInt(b.getAttribute('data-year')) || 0;
            return yearA - yearB;
        },
        'year-desc': (a, b) => {
            const yearA = parseInt(a.getAttribute('data-year')) || 0;
            const yearB = parseInt(b.getAttribute('data-year')) || 0;
            return yearB - yearA;
        },
        'default': (a, b) => 0
    };

    function globalSortWorks(sortType) {
        console.log('开始排序, 方式:', sortType);
        const sortedWorks = [...allWorks];
        const comparator = sortComparators[sortType] || sortComparators.default;
        
        if (sortType !== 'default') {
            sortedWorks.sort(comparator);
        }
        
        return sortedWorks;
    }

    function displayPage(sortedWorks, page, pageSize) {
        const totalPages = Math.ceil(sortedWorks.length / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, sortedWorks.length);
        
        console.log(`显示第 ${page} 页: 作品 ${startIndex + 1}-${endIndex}`);
        
        // 关键修复：使用原始HTML重新创建元素，确保链接完整
        const fragment = document.createDocumentFragment();
        
        for (let i = startIndex; i < endIndex; i++) {
            const work = sortedWorks[i];
            
            // 使用原始HTML重新创建元素，确保所有属性和事件都完整
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = work._originalHTML;
            const newWork = tempDiv.firstElementChild;
            
            // 确保数据属性也正确设置
            if (work._dataGame) {
                const link = newWork.querySelector('a');
                if (link) {
                    link.setAttribute('data-game', work._dataGame);
                    // 确保href正确
                    if (!link.getAttribute('href') || link.getAttribute('href') === '#') {
                        link.setAttribute('href', work._originalHref || `/games/${work._dataGame}/`);
                    }
                }
            }
            
            fragment.appendChild(newWork);
        }
        
        elements.worksGrid.innerHTML = '';
        elements.worksGrid.appendChild(fragment);
        
        // 调试：检查渲染后的链接状态
        setTimeout(() => {
            const renderedLinks = elements.worksGrid.querySelectorAll('a.company-common-work-link');
            console.log('渲染后链接状态:');
            renderedLinks.forEach((link, index) => {
                console.log(`链接 ${index + 1}:`, {
                    href: link.getAttribute('href'),
                    dataGame: link.getAttribute('data-game'),
                    text: link.textContent.trim()
                });
            });
        }, 0);
        
        return totalPages;
    }

    function applySortAndPagination() {
        console.log('执行排序分页 - 方式:', currentSortType, '页码:', currentPage);
        const sortedWorks = globalSortWorks(currentSortType);
        const totalPages = displayPage(sortedWorks, currentPage, pageSize);
        updatePaginationControls(totalPages);
    }

    function updatePaginationControls(totalPages) {
        if (elements.totalPagesSpan) elements.totalPagesSpan.textContent = totalPages;
        if (elements.currentPageSpan) elements.currentPageSpan.textContent = currentPage;
        
        if (elements.prevPageBtn) elements.prevPageBtn.disabled = currentPage === 1;
        if (elements.nextPageBtn) {
            elements.nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        }
        
        if (elements.pageInput) {
            elements.pageInput.max = totalPages;
            elements.pageInput.value = currentPage;
        }
    }

    function goToPage() {
        if (!elements.pageInput) return;
        
        const targetPage = parseInt(elements.pageInput.value);
        const sortedWorks = globalSortWorks(currentSortType);
        const totalPages = Math.ceil(sortedWorks.length / pageSize);
        
        if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPages) {
            alert(`请输入有效的页码 (1-${totalPages})`);
            elements.pageInput.value = currentPage;
            return;
        }
        
        currentPage = targetPage;
        applySortAndPagination();
    }

    function updatePageInput() {
        if (elements.pageInput) {
            elements.pageInput.value = currentPage;
        }
    }

    const eventHandlers = {
        handleSortOptionClick: function() {
            console.log('排序选项点击:', this.textContent);
            
            elements.sortOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            if (elements.sortStatus) {
                elements.sortStatus.textContent = `当前排序: ${this.textContent}`;
            }
            
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

    function initEventListeners() {
        console.log('初始化事件监听器...');
        
        elements.sortOptions.forEach(option => {
            option.addEventListener('click', eventHandlers.handleSortOptionClick);
        });

        if (elements.prevPageBtn) {
            elements.prevPageBtn.addEventListener('click', eventHandlers.handlePrevPage);
        }

        if (elements.nextPageBtn) {
            elements.nextPageBtn.addEventListener('click', eventHandlers.handleNextPage);
        }

        if (elements.pageSizeSelect) {
            elements.pageSizeSelect.addEventListener('change', eventHandlers.handlePageSizeChange);
        }
        
        if (elements.pageInput) {
            elements.pageInput.addEventListener('keyup', eventHandlers.handlePageInputKeyup);
        }
        
        if (elements.goToPageBtn) {
            elements.goToPageBtn.addEventListener('click', goToPage);
        }

        // 备用方案：如果链接仍然有问题，使用全局点击委托
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a.company-common-work-link');
            if (link) {
                const href = link.getAttribute('href');
                const dataGame = link.getAttribute('data-game');
                
                console.log('全局点击捕获:', { href, dataGame });
                
                // 如果链接无效，使用data-game生成正确链接
                if (!href || href === '#' || href === 'javascript:void(0)') {
                    if (dataGame) {
                        e.preventDefault();
                        const correctHref = `/games/${dataGame}/`;
                        console.log('强制跳转到:', correctHref);
                        window.location.href = correctHref;
                    }
                }
                // 否则允许正常跳转
            }
        });
    }

    function init() {
        console.log('初始化分页排序系统...');
        
        try {
            initializeWorks();
            initEventListeners();
            applySortAndPagination();
            
            console.log('分页排序系统初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }

    init();
});