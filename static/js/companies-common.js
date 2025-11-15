// companies-common.js - 修复跳转延迟问题
document.addEventListener('DOMContentLoaded', function() {
    console.log('companies-common.js 加载成功');

    // 简化DOM查询 - 只缓存必要的元素
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

    // 简化状态管理
    let allWorks = [];
    let currentSortType = 'default';
    let currentPage = 1;
    let pageSize = parseInt(elements.pageSizeSelect?.value || 9);

    // 修复：移除复杂的防抖和节流，使用直接执行
    function initializeWorks() {
        const workCards = elements.worksGrid.querySelectorAll('.company-common-work-card');
        allWorks = Array.from(workCards);
        
        console.log('初始化作品数据:', allWorks.length, '个作品');
    }

    // 修复：简化比较函数
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
        'default': (a, b) => {
            // 保持原始顺序
            return 0;
        }
    };

    // 修复：简化排序函数，移除缓存
    function globalSortWorks(sortType) {
        console.log('开始排序, 方式:', sortType);
        
        const sortedWorks = [...allWorks];
        const comparator = sortComparators[sortType] || sortComparators.default;
        
        if (sortType !== 'default') {
            sortedWorks.sort(comparator);
        }
        
        return sortedWorks;
    }

    // 修复：简化显示函数，确保立即执行
    function displayPage(sortedWorks, page, pageSize) {
        const totalPages = Math.ceil(sortedWorks.length / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, sortedWorks.length);
        
        console.log(`显示第 ${page} 页: 作品 ${startIndex + 1}-${endIndex}`);
        
        // 获取当前页的作品（直接引用，不克隆）
        const currentPageWorks = sortedWorks.slice(startIndex, endIndex);
        
        // 使用文档片段但直接添加原节点
        const fragment = document.createDocumentFragment();
        currentPageWorks.forEach(work => {
            fragment.appendChild(work);
        });
        
        // 快速清空和插入
        elements.worksGrid.innerHTML = '';
        elements.worksGrid.appendChild(fragment);
        
        return totalPages;
    }

    // 修复：直接执行，无延迟
    function applySortAndPagination() {
        console.log('执行排序分页 - 方式:', currentSortType, '页码:', currentPage);
        
        const sortedWorks = globalSortWorks(currentSortType);
        const totalPages = displayPage(sortedWorks, currentPage, pageSize);
        updatePaginationControls(totalPages);
    }

    // 修复：简化分页控件更新
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

    // 修复：简化事件处理器
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
            applySortAndPagination(); // 直接调用，无延迟
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

    // 修复：确保事件绑定正确
    function initEventListeners() {
        console.log('初始化事件监听器...');
        
        // 排序选项
        elements.sortOptions.forEach(option => {
            option.addEventListener('click', eventHandlers.handleSortOptionClick);
        });

        // 分页按钮
        if (elements.prevPageBtn) {
            elements.prevPageBtn.addEventListener('click', eventHandlers.handlePrevPage);
        }

        if (elements.nextPageBtn) {
            elements.nextPageBtn.addEventListener('click', eventHandlers.handleNextPage);
        }

        // 页面大小
        if (elements.pageSizeSelect) {
            elements.pageSizeSelect.addEventListener('change', eventHandlers.handlePageSizeChange);
        }
        
        // 页码输入
        if (elements.pageInput) {
            elements.pageInput.addEventListener('keyup', eventHandlers.handlePageInputKeyup);
        }
        
        // 前往按钮
        if (elements.goToPageBtn) {
            elements.goToPageBtn.addEventListener('click', goToPage);
        }

        // 修复：确保作品卡片的点击事件不被阻止
        elements.worksGrid.addEventListener('click', function(e) {
            // 允许所有点击事件正常传播
            console.log('网格点击事件:', e.target);
        }, { passive: true });
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

    // 启动
    init();
});