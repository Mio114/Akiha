// 游戏数据
const gamesData = [
    {
      id: 1,
      title: "樱花物语",
      description: "一段发生在樱花盛开的季节里的青春恋爱故事，充满温暖与感动。",
      image: "images/games/sakura-story.jpg",
      genre: ["visual-novel", "romance"],
      status: "released",
      tags: ["视觉小说", "恋爱", "校园"],
      rating: 4.8
    },
    {
      id: 2,
      title: "星空之约",
      description: "在星空下许下的约定，带你体验浪漫的校园恋爱冒险。",
      image: "images/games/starry-promise.jpg",
      genre: ["visual-novel", "romance", "adventure"],
      status: "released",
      tags: ["视觉小说", "恋爱", "校园", "科幻"],
      rating: 4.7
    },
    {
      id: 3,
      title: "时光回廊",
      description: "穿越时空的奇幻冒险，解开隐藏在历史中的秘密。",
      image: "images/games/time-corridor.jpg",
      genre: ["visual-novel", "adventure", "fantasy"],
      status: "released",
      tags: ["视觉小说", "冒险", "奇幻", "悬疑"],
      rating: 4.9
    },
    {
      id: 4,
      title: "梦境边缘",
      description: "在现实与梦境的边界探索，揭开内心深处的秘密。",
      image: "images/games/dream-edge.jpg",
      genre: ["visual-novel", "fantasy", "adventure"],
      status: "early-access",
      tags: ["视觉小说", "奇幻", "心理", "悬疑"],
      rating: 4.6
    },
    {
      id: 5,
      title: "夏日协奏曲",
      description: "海边小镇的夏日物语，谱写青春的协奏曲。",
      image: "images/games/summer-concerto.jpg",
      genre: ["visual-novel", "romance"],
      status: "released",
      tags: ["视觉小说", "恋爱", "日常", "治愈"],
      rating: 4.5
    },
    {
      id: 6,
      title: "魔法学院物语",
      description: "在魔法学院中学习、成长，与伙伴们共同面对挑战。",
      image: "images/games/magic-academy.jpg",
      genre: ["visual-novel", "fantasy", "rpg"],
      status: "coming-soon",
      tags: ["视觉小说", "奇幻", "校园", "RPG元素"],
      rating: 0
    },
    {
      id: 7,
      title: "都市传说",
      description: "探索现代都市中的神秘传说，揭开超自然现象背后的真相。",
      image: "images/games/urban-legend.jpg",
      genre: ["visual-novel", "adventure"],
      status: "released",
      tags: ["视觉小说", "悬疑", "恐怖", "都市"],
      rating: 4.4
    },
    {
      id: 8,
      title: "异世界餐厅",
      description: "经营一家异世界餐厅，用美食连接不同世界的人们。",
      image: "images/games/otherworld-restaurant.jpg",
      genre: ["visual-novel", "fantasy"],
      status: "early-access",
      tags: ["视觉小说", "奇幻", "经营", "治愈"],
      rating: 4.7
    }
  ];
  
  // 游戏展示应用
  class GamesApp {
    constructor() {
      this.games = [...gamesData];
      this.filteredGames = [...gamesData];
      this.visibleCount = 6;
      this.currentFilters = {
        genre: 'all',
        status: 'all',
        sort: 'newest'
      };
      
      this.init();
    }
    
    init() {
      this.setupEventListeners();
      this.renderGames();
    }
    
    setupEventListeners() {
      // 筛选器事件
      document.getElementById('genre-filter').addEventListener('change', (e) => {
        this.currentFilters.genre = e.target.value;
        this.applyFilters();
      });
      
      document.getElementById('status-filter').addEventListener('change', (e) => {
        this.currentFilters.status = e.target.value;
        this.applyFilters();
      });
      
      document.getElementById('sort-filter').addEventListener('change', (e) => {
        this.currentFilters.sort = e.target.value;
        this.applyFilters();
      });
      
      // 重置筛选按钮
      document.getElementById('reset-filters').addEventListener('click', () => {
        this.resetFilters();
      });
      
      // 加载更多按钮
      document.getElementById('load-more').addEventListener('click', () => {
        this.loadMoreGames();
      });
    }
    
    applyFilters() {
      this.filteredGames = [...this.games];
      
      // 类型筛选
      if (this.currentFilters.genre !== 'all') {
        this.filteredGames = this.filteredGames.filter(game => 
          game.genre.includes(this.currentFilters.genre)
        );
      }
      
      // 状态筛选
      if (this.currentFilters.status !== 'all') {
        this.filteredGames = this.filteredGames.filter(game => 
          game.status === this.currentFilters.status
        );
      }
      
      // 排序
      this.sortGames();
      
      // 重置可见数量
      this.visibleCount = 6;
      
      // 重新渲染
      this.renderGames();
    }
    
    sortGames() {
      switch (this.currentFilters.sort) {
        case 'newest':
          // 假设ID越大越新
          this.filteredGames.sort((a, b) => b.id - a.id);
          break;
        case 'popular':
          this.filteredGames.sort((a, b) => b.rating - a.rating);
          break;
        case 'alphabetical':
          this.filteredGames.sort((a, b) => a.title.localeCompare(b.title));
          break;
        default:
          // 默认按最新排序
          this.filteredGames.sort((a, b) => b.id - a.id);
      }
    }
    
    resetFilters() {
      document.getElementById('genre-filter').value = 'all';
      document.getElementById('status-filter').value = 'all';
      document.getElementById('sort-filter').value = 'newest';
      
      this.currentFilters = {
        genre: 'all',
        status: 'all',
        sort: 'newest'
      };
      
      this.filteredGames = [...this.games];
      this.visibleCount = 6;
      this.renderGames();
    }
    
    loadMoreGames() {
      this.visibleCount += 6;
      this.renderGames();
    }
    
    renderGames() {
      const gamesGrid = document.getElementById('games-grid');
      const loadMoreBtn = document.getElementById('load-more');
      
      // 清空当前内容
      gamesGrid.innerHTML = '';
      
      if (this.filteredGames.length === 0) {
        gamesGrid.innerHTML = `
          <div class="empty-state">
            <h3>没有找到匹配的游戏</h3>
            <p>请尝试调整筛选条件或重置筛选器</p>
          </div>
        `;
        loadMoreBtn.style.display = 'none';
        return;
      }
      
      // 显示可见的游戏
      const gamesToShow = this.filteredGames.slice(0, this.visibleCount);
      
      gamesToShow.forEach(game => {
        const gameCard = this.createGameCard(game);
        gamesGrid.appendChild(gameCard);
      });
      
      // 控制"加载更多"按钮的显示
      if (this.visibleCount >= this.filteredGames.length) {
        loadMoreBtn.style.display = 'none';
      } else {
        loadMoreBtn.style.display = 'block';
      }
    }
    
    createGameCard(game) {
      const card = document.createElement('div');
      card.className = 'game-card';
      
      // 状态标签
      let statusText = '';
      let statusClass = '';
      
      switch (game.status) {
        case 'released':
          statusText = '已发布';
          statusClass = 'status-released';
          break;
        case 'early-access':
          statusText = '抢先体验';
          statusClass = 'status-early-access';
          break;
        case 'coming-soon':
          statusText = '即将推出';
          statusClass = 'status-coming-soon';
          break;
      }
      
      // 游戏标签
      const tagsHTML = game.tags.map(tag => 
        `<span class="game-tag">${tag}</span>`
      ).join('');
      
      // 按钮文本
      let primaryBtnText = '查看详情';
      if (game.status === 'coming-soon') {
        primaryBtnText = '关注游戏';
      } else if (game.status === 'early-access') {
        primaryBtnText = '抢先体验';
      }
      
      card.innerHTML = `
        <div class="game-image">
          <img src="${game.image}" alt="${game.title}" loading="lazy">
          <div class="game-status ${statusClass}">${statusText}</div>
        </div>
        <div class="game-content">
          <h3>${game.title}</h3>
          <div class="game-meta">
            ${tagsHTML}
          </div>
          <p>${game.description}</p>
          <div class="game-actions">
            <a href="#" class="btn-game btn-primary">${primaryBtnText}</a>
            <a href="#" class="btn-game btn-secondary">加入愿望单</a>
          </div>
        </div>
      `;
      
      return card;
    }
  }
  
  // 页面加载完成后初始化
  document.addEventListener('DOMContentLoaded', () => {
    new GamesApp();
  });