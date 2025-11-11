// static/js/companies-common.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('companies-common.js 加载成功');

    // 获取所有元素
    const sortOptions = document.querySelectorAll('.company-common-sort-option');
    const worksGrid = document.getElementById('works-grid');
    const sortStatus = document.querySelector('.company-common-sort-status');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const pageSizeSelect = document.getElementById('page-size-select');

    // 检查必要元素是否存在
    if (!worksGrid) {
        console.error('错误: 找不到 works-grid 元素');
        return;
    }

    // 状态变量
    let allWorks = []; // 存储所有作品DOM元素
    let currentSortType = 'default';
    let currentPage = 1;
    let pageSize = parseInt(pageSizeSelect?.value || 9);

    // 初始化：收集所有作品
    function initializeWorks() {
        allWorks = Array.from(worksGrid.querySelectorAll('.company-common-work-card'));
        console.log('初始化作品数据:', allWorks.length, '个作品');
        
        // 打印所有作品的初始信息用于调试
        allWorks.forEach((work, index) => {
            const name = work.getAttribute('data-name');
            const year = work.getAttribute('data-year');
            console.log(`初始作品 ${index + 1}: ${name} - ${year}年`);
        });
    }

    // 全局排序函数
    function globalSortWorks(sortType) {
        let sortedWorks = [...allWorks];
        
        console.log('开始全局排序, 方式:', sortType);
        
        switch(sortType) {
            case 'name-asc':
                sortedWorks.sort((a, b) => {
                    const nameA = a.getAttribute('data-name') || '';
                    const nameB = b.getAttribute('data-name') || '';
                    return nameA.localeCompare(nameB, 'zh-CN');
                });
                break;
                
            case 'name-desc':
                sortedWorks.sort((a, b) => {
                    const nameA = a.getAttribute('data-name') || '';
                    const nameB = b.getAttribute('data-name') || '';
                    return nameB.localeCompare(nameA, 'zh-CN');
                });
                break;
                
            case 'year-asc':
                sortedWorks.sort((a, b) => {
                    const yearA = parseInt(a.getAttribute('data-year')) || 0;
                    const yearB = parseInt(b.getAttribute('data-year')) || 0;
                    return yearA - yearB; // 旧→新
                });
                break;
                
            case 'year-desc':
                sortedWorks.sort((a, b) => {
                    const yearA = parseInt(a.getAttribute('data-year')) || 0;
                    const yearB = parseInt(b.getAttribute('data-year')) || 0;
                    return yearB - yearA; // 新→旧
                });
                break;
                
            default: // 默认排序 - 按原始DOM顺序
                // 保持原始顺序，不需要排序
                console.log('使用默认排序（原始顺序）');
                break;
        }
        
        return sortedWorks;
    }

    // 显示指定页面的作品
    function displayPage(sortedWorks, page, pageSize) {
        // 清空当前显示
        worksGrid.innerHTML = '';
        
        // 计算分页范围
        const totalPages = Math.ceil(sortedWorks.length / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, sortedWorks.length);
        
        console.log(`显示第 ${page} 页: 作品 ${startIndex + 1}-${endIndex}, 共 ${sortedWorks.length} 个作品`);
        
        // 显示当前页的作品
        for (let i = startIndex; i < endIndex; i++) {
            const work = sortedWorks[i];
            worksGrid.appendChild(work.cloneNode(true)); // 使用clone避免引用问题
        }
        
        return totalPages;
    }

    // 应用排序和分页
    function applySortAndPagination() {
        console.log('执行排序分页 - 方式:', currentSortType, '页码:', currentPage);
        
        // 1. 全局排序所有作品
        const sortedWorks = globalSortWorks(currentSortType);
        
        // 打印排序结果用于调试
        console.log('=== 排序结果 ===');
        sortedWorks.forEach((work, index) => {
            const name = work.getAttribute('data-name');
            const year = work.getAttribute('data-year');
            console.log(`${index + 1}. ${name} - ${year}年`);
        });
        console.log('===============');
        
        // 2. 显示当前页
        const totalPages = displayPage(sortedWorks, currentPage, pageSize);
        
        // 3. 更新分页控件
        updatePaginationControls(totalPages);
    }

    // 更新分页控件
    function updatePaginationControls(totalPages) {
        if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
        if (currentPageSpan) currentPageSpan.textContent = currentPage;
        
        if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        
        console.log(`分页状态: 第 ${currentPage} 页 / 共 ${totalPages} 页`);
    }

    // 初始化事件监听
    function initEventListeners() {
        // 排序选项点击事件
        sortOptions.forEach(option => {
            option.addEventListener('click', function() {
                // 更新活动状态
                sortOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                // 更新排序状态显示
                if (sortStatus) {
                    sortStatus.textContent = `当前排序: ${this.textContent}`;
                }
                
                // 应用新排序
                currentSortType = this.getAttribute('data-sort');
                currentPage = 1; // 重置到第一页
                applySortAndPagination();
            });
        });

        // 分页按钮事件
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    applySortAndPagination();
                }
            });
        }

        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', function() {
                // 重新计算总页数（基于当前排序后的作品）
                const sortedWorks = globalSortWorks(currentSortType);
                const totalPages = Math.ceil(sortedWorks.length / pageSize);
                
                if (currentPage < totalPages) {
                    currentPage++;
                    applySortAndPagination();
                }
            });
        }

        // 每页数量更改事件
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', function() {
                pageSize = parseInt(this.value);
                currentPage = 1; // 重置到第一页
                applySortAndPagination();
            });
        }
    }

    // 主初始化函数
    function init() {
        console.log('初始化分页排序系统...');
        
        // 1. 收集作品数据
        initializeWorks();
        
        // 2. 设置事件监听
        initEventListeners();
        
        // 3. 初始显示
        applySortAndPagination();
        
        console.log('分页排序系统初始化完成');
    }

    // 启动系统
    init();
});