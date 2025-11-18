// 爬虫引擎类
// 动态获取 matchRule 函数，避免加载时序问题
function getMatchRule() {
  if (typeof window !== 'undefined' && window.matchRule) {
    return window.matchRule;
  } else if (typeof self !== 'undefined' && self.matchRule) {
    return self.matchRule;
  } else if (typeof require !== 'undefined') {
    return require('../rules/matcher').matchRule;
  } else {
    console.error('matchRule 未定义，请确保 matcher.js 已加载');
    // 提供一个默认的 matchRule 函数
    return function(url) {
      const RULES = (typeof window !== 'undefined' && window.RULES) 
        ? window.RULES 
        : (typeof self !== 'undefined' && self.RULES) ? self.RULES : null;
      if (RULES && RULES.default) {
        return RULES.default;
      }
      return { name: '默认规则', urlPattern: /.*/, type: 'custom', custom: {} };
    };
  }
}

// 执行爬取
class CrawlerEngine {
  constructor(url, rule = null) {
    this.url = url;
    // 在构造函数中动态获取 matchRule
    const matchRule = getMatchRule();
    this.rule = rule || matchRule(url);
    this.currentPage = 1;
  }
  
  // 爬取列表数据
  crawlList(customSelector = null) {
    const items = [];
    
    if (this.rule.type === 'list' && this.rule.list) {
      // 使用规则定义的列表爬取
      const selector = this.rule.list.itemSelector;
      const elements = document.querySelectorAll(selector);
      
      elements.forEach((element, index) => {
        try {
          const item = this.rule.list.extractItem(element, index);
          if (item) {
            items.push(item);
          }
        } catch (error) {
          console.error(`提取第${index}项失败:`, error);
        }
      });
      
    } else if (this.rule.type === 'custom' && this.rule.custom) {
      // 使用自定义选择器
      const selector = customSelector || this.rule.custom.selector;
      if (!selector) {
        throw new Error('请提供CSS选择器');
      }
      
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, index) => {
        try {
          const item = this.rule.custom.extractItem(element, index);
          if (item) {
            items.push(item);
          }
        } catch (error) {
          console.error(`提取第${index}项失败:`, error);
        }
      });
    }
    
    return items;
  }
  
  // 获取分页信息
  getPaginationInfo() {
    if (this.rule.type === 'list' && this.rule.list?.pagination) {
      const pagination = this.rule.list.pagination;
      const currentPageEl = document.querySelector(pagination.currentPageSelector);
      const nextPageEl = document.querySelector(pagination.nextPageSelector);
      
      return {
        currentPage: currentPageEl ? parseInt(currentPageEl.textContent) || 1 : 1,
        hasNext: nextPageEl !== null && !nextPageEl.classList.contains('disabled')
      };
    }
    return null;
  }
  
  // 获取规则信息
  getRuleInfo() {
    return {
      name: this.rule.name,
      type: this.rule.type,
      url: this.url
    };
  }
}

// 导出（支持多种环境）
if (typeof self !== 'undefined') {
  // Service Worker 环境
  self.CrawlerEngine = CrawlerEngine;
}
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.CrawlerEngine = CrawlerEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = CrawlerEngine;
}

