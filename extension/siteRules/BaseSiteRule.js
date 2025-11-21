// 基础网站规则类 - 所有网站规则都应继承此类
// 注意：浏览器扩展不支持ES6模块，使用全局变量方式

(function() {
  'use strict';
  
  window.BaseSiteRule = class BaseSiteRule {
    constructor() {
      this.name = 'BaseSiteRule';
      this.domain = '';
      this.urlPatterns = [];
    }

    /**
     * 检查当前页面是否匹配此规则
     * @param {string} url - 当前页面URL
     * @returns {boolean}
     */
    matches(url) {
      if (!url) return false;
      return this.urlPatterns.some(pattern => {
        if (typeof pattern === 'string') {
          return url.includes(pattern);
        }
        if (pattern instanceof RegExp) {
          return pattern.test(url);
        }
        return false;
      });
    }

    /**
     * 获取列表项的选择器
     * @returns {string}
     */
    getListItemSelector() {
      throw new Error('getListItemSelector() must be implemented by subclass');
    }

    /**
     * 提取单个列表项的数据
     * @param {Element} element - 列表项DOM元素
     * @returns {Object|null} - 提取的数据对象，失败返回null
     */
    extractItemData(element) {
      throw new Error('extractItemData() must be implemented by subclass');
    }

    /**
     * 获取下一页按钮的选择器
     * @returns {string}
     */
    getNextPageButtonSelector() {
      throw new Error('getNextPageButtonSelector() must be implemented by subclass');
    }

    /**
     * 检查下一页按钮是否可用
     * @param {Element} nextButton - 下一页按钮元素
     * @returns {boolean}
     */
    isNextPageAvailable(nextButton) {
      if (!nextButton) return false;
      
      // 检查按钮是否被禁用
      if (nextButton.disabled || nextButton.classList.contains('disabled')) {
        return false;
      }
      
      // 检查按钮是否隐藏
      const style = window.getComputedStyle(nextButton);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }
      
      return true;
    }

    /**
     * 点击下一页按钮
     * @param {Element} nextButton - 下一页按钮元素
     * @returns {Promise}
     */
    async clickNextPage(nextButton) {
      return new Promise((resolve) => {
        try {
          const hrefAttr = nextButton.getAttribute('href');
          const href = nextButton.href;
          const isJavaScriptLink = (hrefAttr && hrefAttr.trim().toLowerCase().startsWith('javascript:')) ||
                                   (href && href.trim().toLowerCase().startsWith('javascript:'));

          // 方法1: 如果是普通HTTP链接，直接导航
          if (href && !isJavaScriptLink && href !== window.location.href && 
              (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/'))) {
            if (href.startsWith('/')) {
              window.location.href = new URL(href, window.location.origin).href;
            } else {
              window.location.href = href;
            }
            setTimeout(resolve, 200);
            return;
          }
          
          // 方法2: 对于javascript:链接或其他情况，使用事件触发
          // 对于普通链接，直接调用click方法即可，避免重复触发
          if (!isJavaScriptLink) {
            try {
              nextButton.click();
              setTimeout(resolve, 2000);
              return;
            } catch (clickError) {
              console.warn('调用click方法失败，尝试使用事件触发:', clickError);
              // 如果click方法失败，继续使用事件触发方式
            }
          }
          
          // 对于javascript:链接或click方法失败的情况，使用事件触发
          let originalHref = null;
          let isHrefRemoved = false;
          
          if (isJavaScriptLink && hrefAttr) {
            originalHref = hrefAttr;
            nextButton.removeAttribute('href');
            isHrefRemoved = true;
          }
          
          const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0
          });
          
          const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0
          });
          
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0
          });
          
          nextButton.dispatchEvent(mouseDownEvent);
          setTimeout(() => {
            nextButton.dispatchEvent(mouseUpEvent);
            setTimeout(() => {
              nextButton.dispatchEvent(clickEvent);
              
              if (isHrefRemoved && originalHref) {
                nextButton.setAttribute('href', originalHref);
              }
              
              setTimeout(resolve, 2000);
            }, 50);
          }, 50);
        } catch (error) {
          console.error('点击下一页失败:', error);
          setTimeout(resolve, 2000);
        }
      });
    }

    /**
     * 等待页面导航完成（可被子类重写以自定义检测逻辑）
     * @returns {Promise}
     */
    async waitForPageNavigation() {
      return new Promise((resolve) => {
        const startUrl = window.location.href;
        const firstListItem = document.querySelector(this.getListItemSelector());
        const startContent = firstListItem ? firstListItem.textContent.trim() : '';
        
        let checkCount = 0;
        const maxChecks = 100;
        
        const checkInterval = setInterval(() => {
          checkCount++;
          
          // 检查URL是否改变
          if (window.location.href !== startUrl) {
            clearInterval(checkInterval);
            this.waitForPageLoad().then(() => {
              setTimeout(resolve, 1000);
            });
            return;
          }
          
          // 检查列表内容是否已更新
          const currentFirstItem = document.querySelector(this.getListItemSelector());
          const currentContent = currentFirstItem ? currentFirstItem.textContent.trim() : '';
          
          if (startContent && currentContent && currentContent !== startContent) {
            clearInterval(checkInterval);
            setTimeout(resolve, 1000);
            return;
          }
          
          // 检查列表项数量
          const listItems = document.querySelectorAll(this.getListItemSelector());
          if (listItems.length > 0 && checkCount > 10) {
            clearInterval(checkInterval);
            setTimeout(resolve, 1000);
            return;
          }
          
          // 超时保护
          if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            console.warn('等待页面导航超时，继续执行');
            resolve();
          }
        }, 100);
      });
    }

    /**
     * 等待页面加载完成
     * @returns {Promise}
     */
    waitForPageLoad() {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', resolve);
          setTimeout(resolve, 5000);
        }
      });
    }

    /**
     * 生成唯一ID（可被子类重写）
     * @param {string} url - 链接URL
     * @returns {string}
     */
    generateTenderId(url) {
      return url.replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .replace(/\.html?$/, '')
                .replace(/\//g, '_');
    }
  };
})();
