document.addEventListener('DOMContentLoaded', function() {
    const sortOptions = document.querySelectorAll('.company-common-sort-option');
    const worksGrid = document.getElementById('works-grid');
    const sortStatus = document.querySelector('.company-common-sort-status');
    let works = Array.from(worksGrid.children);
    
    // 保存原始顺序，用于默认排序
    const originalOrder = [...works];
    
    // 为每个排序选项添加点击事件
    sortOptions.forEach(option => {
      option.addEventListener('click', function() {
        // 更新活动状态
        sortOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
        
        // 更新排序状态显示
        sortStatus.textContent = `当前排序: ${this.textContent}`;
        
        // 根据选择的排序方式排序
        const sortType = this.getAttribute('data-sort');
        sortWorks(sortType);
      });
    });
    
    // 排序函数
    function sortWorks(sortType) {
      let sortedWorks;
      
      switch(sortType) {
        case 'name-asc':
          sortedWorks = [...works].sort((a, b) => {
            const nameA = a.getAttribute('data-name');
            const nameB = b.getAttribute('data-name');
            return nameA.localeCompare(nameB, 'zh-CN');
          });
          break;
          
        case 'name-desc':
          sortedWorks = [...works].sort((a, b) => {
            const nameA = a.getAttribute('data-name');
            const nameB = b.getAttribute('data-name');
            return nameB.localeCompare(nameA, 'zh-CN');
          });
          break;
          
        case 'year-asc':
          sortedWorks = [...works].sort((a, b) => {
            const yearA = parseInt(a.getAttribute('data-year'));
            const yearB = parseInt(b.getAttribute('data-year'));
            return yearA - yearB;
          });
          break;
          
        case 'year-desc':
          sortedWorks = [...works].sort((a, b) => {
            const yearA = parseInt(a.getAttribute('data-year'));
            const yearB = parseInt(b.getAttribute('data-year'));
            return yearB - yearA;
          });
          break;
          
        default: // 默认排序
          sortedWorks = [...originalOrder];
          break;
      }
      
      // 清空网格并重新添加排序后的作品
      worksGrid.innerHTML = '';
      sortedWorks.forEach(work => {
        worksGrid.appendChild(work);
      });
      
      // 更新works数组
      works = sortedWorks;
    }
  });
  // 分页功能脚本
document.addEventListener('DOMContentLoaded', function() {
    // 分页相关元素
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const pageSizeSelect = document.getElementById('page-size-select');
    
    // 分页状态
    let currentPage = 1;
    let pageSize = parseInt(pageSizeSelect.value);
    let totalPages = 1;
    let currentWorks = [];
    
    // 初始化分页
    function initPagination() {
      currentWorks = Array.from(document.querySelectorAll('.company-common-work-card'));
      updatePagination();
    }
    
    // 更新分页
    function updatePagination() {
      // 计算总页数
      totalPages = Math.ceil(currentWorks.length / pageSize);
      totalPagesSpan.textContent = totalPages;
      
      // 更新按钮状态
      prevPageBtn.disabled = currentPage === 1;
      nextPageBtn.disabled = currentPage === totalPages;
      
      // 显示当前页的作品
      showCurrentPage();
    }
    
    // 显示当前页的作品
    function showCurrentPage() {
      // 隐藏所有作品
      currentWorks.forEach(work => {
        work.style.display = 'none';
      });
      
      // 计算当前页的作品范围
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      // 显示当前页的作品
      for (let i = startIndex; i < endIndex && i < currentWorks.length; i++) {
        currentWorks[i].style.display = 'block';
      }
      
      // 更新当前页码显示
      currentPageSpan.textContent = currentPage;
    }
    
    // 事件监听器
    prevPageBtn.addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage--;
        updatePagination();
      }
    });
    
    nextPageBtn.addEventListener('click', function() {
      if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
      }
    });
    
    pageSizeSelect.addEventListener('change', function() {
      pageSize = parseInt(this.value);
      currentPage = 1; // 重置到第一页
      updatePagination();
    });
    
    // 修改排序功能，使其与分页兼容
    const originalSortWorks = window.sortWorks;
    window.sortWorks = function(sortType) {
      // 调用原始排序函数
      originalSortWorks(sortType);
      
      // 更新当前作品列表并重置分页
      setTimeout(() => {
        currentWorks = Array.from(document.querySelectorAll('.company-common-work-card'));
        currentPage = 1;
        updatePagination();
      }, 0);
    };
    
    // 初始化分页
    initPagination();
  });