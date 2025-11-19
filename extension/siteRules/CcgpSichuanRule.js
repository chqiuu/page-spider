// 四川政府采购网规则 (www.ccgp-sichuan.gov.cn)
// 该网站使用 Vue，通过拦截 AJAX 请求获取 JSON 数据

(function() {
  'use strict';
  
  if (typeof window.BaseSiteRule === 'undefined') {
    throw new Error('BaseSiteRule must be loaded before CcgpSichuanRule');
  }
  
  window.CcgpSichuanRule = class CcgpSichuanRule extends window.BaseSiteRule {
    constructor() {
      super();
      this.name = 'CcgpSichuanRule';
      this.domain = 'www.ccgp-sichuan.gov.cn';
      this.urlPatterns = [
        'www.ccgp-sichuan.gov.cn',
        'ccgp-sichuan.gov.cn'
      ];
      
      // 存储 AJAX 响应数据
      this.ajaxResponseData = null;
      this.ajaxResponsePromise = null;
      this.ajaxResponseResolve = null;
      this.ajaxResponseReject = null;
      this.hasClickedQuery = false; // 标记是否已点击过查询按钮
      
      // 初始化 AJAX 拦截器
      this.initAjaxInterceptor();
    }

    /**
     * 初始化 AJAX 拦截器，拦截 XMLHttpRequest 和 fetch 请求
     */
    initAjaxInterceptor() {
      // 拦截 XMLHttpRequest
      const self = this;
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._url = url;
        this._method = method;
        return originalXHROpen.apply(this, [method, url, ...args]);
      };
      
      XMLHttpRequest.prototype.send = function(...args) {
        const xhr = this;
        
        // 监听响应
        xhr.addEventListener('load', function() {
          try {
            // 检查是否是数据查询接口（根据实际接口URL调整）
            if (xhr._url && (
              xhr._url.includes('/api/') || 
              xhr._url.includes('/select') ||
              xhr._url.includes('/list')
            )) {
              const responseText = xhr.responseText;
              if (responseText) {
                try {
                  const jsonData = JSON.parse(responseText);
                  // 存储响应数据
                  self.ajaxResponseData = jsonData;
                  if (self.ajaxResponseResolve) {
                    self.ajaxResponseResolve(jsonData);
                    self.ajaxResponseResolve = null;
                    self.ajaxResponseReject = null;
                  }
                } catch (e) {
                  console.warn('解析 AJAX 响应 JSON 失败:', e);
                }
              }
            }
          } catch (error) {
            console.error('处理 AJAX 响应失败:', error);
          }
        });
        
        return originalXHRSend.apply(this, args);
      };
      
      // 拦截 fetch
      const originalFetch = window.fetch;
      window.fetch = function(url, options = {}) {
        return originalFetch.apply(this, arguments).then(response => {
          // 检查是否是数据查询接口
          const urlStr = typeof url === 'string' ? url : url.url || '';
          if (urlStr && (
            urlStr.includes('/api/') || 
            urlStr.includes('/select') ||
            urlStr.includes('/list')
          )) {
            // 克隆响应以便读取
            const clonedResponse = response.clone();
            clonedResponse.json().then(jsonData => {
              self.ajaxResponseData = jsonData;
              if (self.ajaxResponseResolve) {
                self.ajaxResponseResolve(jsonData);
                self.ajaxResponseResolve = null;
                self.ajaxResponseReject = null;
              }
            }).catch(e => {
              console.warn('解析 fetch 响应 JSON 失败:', e);
            });
          }
          return response;
        });
      };
    }

    /**
     * 获取查询按钮的选择器
     * @returns {string}
     */
    getQueryButtonSelector() {
      // 根据实际页面结构调整，可能的选择器：
      // 'button:contains("查询")', '.query-btn', '#search-btn', 'button[type="submit"]'
      return 'button.el-button.el-button--primary.el-button--medium, button:contains("查询"), .el-button--primary, [class*="query"], [class*="search"]';
    }

    /**
     * 点击查询按钮并等待 AJAX 响应
     */
    async clickQueryButton() {
      return new Promise((resolve, reject) => {
        // 查找查询按钮
        const queryButton = document.querySelector(this.getQueryButtonSelector()) ||
                           Array.from(document.querySelectorAll('button')).find(btn => 
                             btn.textContent && btn.textContent.includes('查询')
                           );
        
        if (!queryButton) {
          reject(new Error('未找到查询按钮'));
          return;
        }
        
        // 设置响应监听
        this.ajaxResponseResolve = resolve;
        this.ajaxResponseReject = reject;
        this.ajaxResponseData = null;
        
        // 点击查询按钮
        try {
          queryButton.click();
          
          // 超时保护（30秒）
          setTimeout(() => {
            if (this.ajaxResponseResolve === resolve) {
              this.ajaxResponseResolve = null;
              this.ajaxResponseReject = null;
              reject(new Error('等待 AJAX 响应超时'));
            }
          }, 30000);
        } catch (error) {
          this.ajaxResponseResolve = null;
          this.ajaxResponseReject = null;
          reject(error);
        }
      });
    }

    /**
     * 等待页面加载完成，并点击查询按钮获取数据
     */
    async waitForPageLoad() {
      // 先等待基础页面加载
      await super.waitForPageLoad();
      
      // 等待 Vue 应用初始化（延迟一下确保 Vue 已渲染）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 只在第一次调用时点击查询按钮
      if (!this.hasClickedQuery) {
        try {
          await this.clickQueryButton();
          this.hasClickedQuery = true;
          // 等待数据渲染到 DOM（可选，如果直接从 JSON 提取则不需要）
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.warn('点击查询按钮失败或等待响应超时:', error);
          // 继续执行，可能数据已经存在
        }
      }
    }

    getListItemSelector() {
      // 如果从 JSON 提取数据，这个选择器可能不需要
      // 但保留以兼容现有代码
      return 'div.is-scrolling-none > table > tbody > tr, .el-table__body tbody tr';
    }

    getNextPageButtonSelector() {
      // 分页按钮选择器
      return 'div.el-pagination button.btn-next, .el-pagination .el-pager li.next, button[aria-label="下一页"]';
    }

    /**
     * 从 JSON 数据中提取列表项
     * @param {Object} jsonData - AJAX 返回的 JSON 数据
     * @returns {Array} 提取的数据项数组
     */
    extractItemsFromJson(jsonData) {
      const items = [];
      
      try {
        // 根据实际 JSON 结构调整数据路径
        // 可能的路径：jsonData.data, jsonData.list, jsonData.records, jsonData.items, jsonData.result
        let dataList = null;
        
        if (jsonData.data) {
          dataList = Array.isArray(jsonData.data) ? jsonData.data : 
                    (jsonData.data.list || jsonData.data.records || jsonData.data.items || []);
        } else if (jsonData.list) {
          dataList = jsonData.list;
        } else if (jsonData.records) {
          dataList = jsonData.records;
        } else if (jsonData.items) {
          dataList = jsonData.items;
        } else if (jsonData.result) {
          dataList = Array.isArray(jsonData.result) ? jsonData.result : 
                    (jsonData.result.list || jsonData.result.records || []);
        } else if (Array.isArray(jsonData)) {
          dataList = jsonData;
        }
        
        if (!dataList || !Array.isArray(dataList)) {
          console.warn('未找到列表数据，JSON 结构:', jsonData);
          return items;
        }
        
        // 遍历数据项并提取
        for (const itemData of dataList) {
          const item = this.extractItemFromJsonData(itemData);
          if (item) {
            items.push(item);
          }
        }
      } catch (error) {
        console.error('从 JSON 提取数据失败:', error);
      }
      
      return items;
    }

    /**
     * 从单个 JSON 数据对象中提取字段
     * @param {Object} itemData - JSON 数据对象
     * @returns {Object|null}
     */
    extractItemFromJsonData(itemData) {
      try {
        // 根据实际 JSON 字段名调整映射
        // 这里提供常见的字段名映射，需要根据实际 API 响应调整
        
        const title = itemData.title || itemData.name || itemData.projectName || itemData.tenderTitle || '';
        const url = itemData.url || itemData.link || itemData.detailUrl || itemData.href || '';
        const releaseTime = itemData.releaseTime || itemData.publishTime || itemData.createTime || 
                           itemData.releaseDate || itemData.publishDate || '';
        const buyerName = itemData.buyerName || itemData.purchaser || itemData.buyer || '';
        const agentName = itemData.agentName || itemData.agency || itemData.agent || '';
        const provinceName = itemData.provinceName || itemData.province || '四川省';
        const afficheType = itemData.afficheType || itemData.announcementType || itemData.type || '';
        const projectDirectoryName = itemData.projectDirectoryName || itemData.directoryName || 
                                    itemData.category || itemData.projectCategory || '';
        const districtName = itemData.districtName || itemData.district || itemData.area || '';
        const projectPurchaseWay = itemData.projectPurchaseWay || itemData.purchaseWay || 
                                  itemData.purchaseMethod || '';
        const openTenderCode = itemData.openTenderCode || itemData.tenderCode || 
                              itemData.projectCode || itemData.code || '';
        const budget = itemData.budget || itemData.amount || itemData.totalAmount || '';
        const expireTime = itemData.expireTime || itemData.deadline || itemData.expireDate || '';
        
        // 生成完整 URL（如果是相对路径）
        let fullUrl = url;
        if (url && !url.startsWith('http')) {
          if (url.startsWith('/')) {
            fullUrl = window.location.origin + url;
          } else {
            fullUrl = new URL(url, window.location.origin).href;
          }
        }
        
        // 生成唯一ID
        const tenderId = fullUrl ? this.generateTenderId(fullUrl) : 
                        (itemData.id || itemData.tenderId || Date.now() + Math.random());
        
        if (!title && !fullUrl) {
          return null;
        }
        
        return {
          tenderId: tenderId,
          title: title,
          url: fullUrl || '',
          releaseTime: releaseTime,
          buyerName: buyerName,
          agentName: agentName,
          provinceName: provinceName,
          afficheType: afficheType,
          projectDirectoryName: projectDirectoryName,
          districtName: districtName,
          projectPurchaseWay: projectPurchaseWay,
          openTenderCode: openTenderCode,
          budget: budget,
          expireTime: expireTime,
          crawledAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('提取 JSON 数据项失败:', error);
        return null;
      }
    }

    /**
     * 从 DOM 元素提取数据（兼容方法，优先使用 JSON 数据）
     */
    extractItemData(element) {
      // 如果已有 JSON 数据，优先使用
      if (this.ajaxResponseData) {
        // 这个方法主要用于兼容，实际应该使用 extractItemsFromJson
        return null;
      }
      
      // 如果没有 JSON 数据，尝试从 DOM 提取（降级方案）
      try {
        const aElement = element.querySelector('a');
        if (!aElement) return null;
        
        const title = aElement?.textContent?.trim() || '';
        let link = aElement.href;
        if (link && !link.startsWith('http')) {
          link = new URL(link, window.location.origin).href;
        }
        
        const tenderId = this.generateTenderId(link);
        const provinceName = '四川省';
        
        if (title && link) {
          return {
            tenderId: tenderId,
            title: title,
            url: link,
            provinceName: provinceName,
            crawledAt: new Date().toISOString()
          };
        }
      } catch (error) {
        console.error('从 DOM 提取数据失败:', error);
      }
      return null;
    }

    /**
     * 等待页面导航完成（重写以支持 AJAX 分页）
     */
    async waitForPageNavigation() {
      return new Promise((resolve) => {
        // 如果使用 AJAX 分页，等待 AJAX 响应
        if (this.ajaxResponsePromise) {
          this.ajaxResponsePromise.then(() => {
            setTimeout(resolve, 500);
          }).catch(() => {
            setTimeout(resolve, 2000);
          });
        } else {
          // 降级到默认实现
          super.waitForPageNavigation().then(resolve);
        }
      });
    }

    /**
     * 点击下一页（重写以支持 AJAX 分页）
     */
    async clickNextPage(nextButton) {
      // 清空之前的响应数据，准备接收新数据
      this.ajaxResponseData = null;
      
      // 设置 AJAX 响应 Promise
      this.ajaxResponsePromise = new Promise((resolve, reject) => {
        this.ajaxResponseResolve = resolve;
        this.ajaxResponseReject = reject;
        
        // 超时保护
        setTimeout(() => {
          if (this.ajaxResponseResolve === resolve) {
            this.ajaxResponseResolve = null;
            this.ajaxResponseReject = null;
            reject(new Error('等待分页 AJAX 响应超时'));
          }
        }, 30000);
      });
      
      // 点击下一页按钮
      await super.clickNextPage(nextButton);
      
      // 等待 AJAX 响应
      try {
        await this.ajaxResponsePromise;
        this.ajaxResponsePromise = null;
        // 等待数据更新
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn('等待分页响应失败:', error);
        this.ajaxResponsePromise = null;
      }
    }

    generateTenderId(url) {
      // 为四川政府采购网生成唯一ID
      if (!url) return Date.now() + '_' + Math.random();
      
      return url.replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .replace(/ccgp-sichuan\.gov\.cn\//, '')
                .replace(/\.html?$/, '')
                .replace(/\//g, '_')
                .replace(/\?/g, '_')
                .replace(/=/g, '_');
    }
  };
})();
