// 四川政府采购网规则 (www.ccgp-sichuan.gov.cn)

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
      this.useApiMode = true; // 使用API模式获取数据
      this.queryButtonSelector = 'button:contains("查询"), button[type="submit"], .el-button--primary, button.el-button'; // 查询按钮选择器，可根据实际页面调整
    }

    /**
     * 获取查询按钮选择器
     * @returns {string}
     */
    getQueryButtonSelector() {
      // 可以根据实际页面结构调整，尝试多个可能的选择器
      return 'button.el-button--primary, button[type="submit"], .search-btn, .query-btn, button:contains("查询")';
    }

    /**
     * 查找查询按钮
     * @returns {Element|null}
     */
    findQueryButton() {
      const selectors = this.getQueryButtonSelector().split(',');
      for (const selector of selectors) {
        const trimmedSelector = selector.trim();
        // 处理 :contains() 伪类（jQuery语法，需要手动实现）
        if (trimmedSelector.includes(':contains(')) {
          const baseSelector = trimmedSelector.split(':contains')[0].trim();
          const textMatch = trimmedSelector.match(/:contains\(["']?([^"']+)["']?\)/);
          if (textMatch) {
            const buttons = document.querySelectorAll(baseSelector);
            for (const btn of buttons) {
              if (btn.textContent.includes(textMatch[1])) {
                return btn;
              }
            }
          }
        } else {
          const button = document.querySelector(trimmedSelector);
          if (button) return button;
        }
      }
      // 如果都找不到，尝试通过文本内容查找
      const allButtons = document.querySelectorAll('button');
      for (const btn of allButtons) {
        const text = btn.textContent.trim();
        if (text === '查询' || text === '搜索' || text.includes('查询')) {
          return btn;
        }
      }
      return null;
    }

    /**
     * 拦截XMLHttpRequest并获取请求信息
     * @returns {Promise<{url: string, method: string, body: any, headers: object}>}
     */
    interceptXHRRequest() {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('等待请求超时'));
        }, 30000); // 30秒超时

        // 保存原始的XMLHttpRequest
        const OriginalXHR = window.XMLHttpRequest;
        let requestInfo = null;

        // 重写XMLHttpRequest
        window.XMLHttpRequest = function() {
          const xhr = new OriginalXHR();
          const originalOpen = xhr.open;
          const originalSend = xhr.send;
          let requestUrl = '';
          let requestMethod = '';
          let requestBody = null;
          let requestHeaders = {};

          // 拦截open方法
          xhr.open = function(method, url, ...args) {
            requestMethod = method;
            requestUrl = url;
            // 处理相对URL
            if (url && !url.startsWith('http')) {
              requestUrl = new URL(url, window.location.origin).href;
            }
            return originalOpen.apply(this, [method, url, ...args]);
          };

          // 拦截setRequestHeader（需要在open之后才能设置）
          const originalSetRequestHeader = xhr.setRequestHeader;
          xhr.setRequestHeader = function(header, value) {
            requestHeaders[header] = value;
            return originalSetRequestHeader.apply(this, [header, value]);
          };

          // 拦截send方法
          xhr.send = function(body) {
            requestBody = body;
            
            // 检查Content-Type（可能在setRequestHeader中设置）
            const contentType = requestHeaders['Content-Type'] || 
                               requestHeaders['content-type'] || '';
            
            // 只拦截application/json请求，或者请求体是JSON格式
            if (contentType.includes('application/json') || 
                (requestBody && typeof requestBody === 'string' && requestBody.trim().startsWith('{'))) {
              
              // 拦截响应
              xhr.addEventListener('load', function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                  clearTimeout(timeout);
                  try {
                    const responseText = xhr.responseText;
                    const responseData = JSON.parse(responseText);
                    
                    requestInfo = {
                      url: requestUrl,
                      method: requestMethod,
                      body: requestBody ? (typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody) : null,
                      headers: requestHeaders,
                      response: responseData
                    };
                    
                    // 恢复原始XMLHttpRequest
                    window.XMLHttpRequest = OriginalXHR;
                    resolve(requestInfo);
                  } catch (error) {
                    console.error('解析响应失败:', error);
                    // 即使解析失败，也返回请求信息
                    requestInfo = {
                      url: requestUrl,
                      method: requestMethod,
                      body: requestBody ? (typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody) : null,
                      headers: requestHeaders,
                      response: null
                    };
                    window.XMLHttpRequest = OriginalXHR;
                    resolve(requestInfo);
                  }
                }
              }, { once: true });

              xhr.addEventListener('error', function() {
                clearTimeout(timeout);
                window.XMLHttpRequest = OriginalXHR;
                reject(new Error('请求失败'));
              }, { once: true });
            }

            return originalSend.apply(this, [body]);
          };

          return xhr;
        };

        // 如果30秒内没有请求，恢复原始XHR
        setTimeout(() => {
          if (!requestInfo) {
            window.XMLHttpRequest = OriginalXHR;
          }
        }, 30000);
      });
    }

    /**
     * 通过API获取数据（重写crawlData方法）
     * @returns {Promise<{items: Array, total: number, pageUrl: string, crawlTime: string, ruleName: string}>}
     */
    async crawlDataFromApi() {
      try {
        // 等待页面加载完成
        await this.waitForPageLoad();

        // 查找查询按钮
        const queryButton = this.findQueryButton();
        if (!queryButton) {
          throw new Error('未找到查询按钮，请检查页面结构或选择器');
        }

        console.log('找到查询按钮，准备拦截请求...');

        // 开始拦截XHR请求
        const interceptPromise = this.interceptXHRRequest();

        // 点击查询按钮
        console.log('点击查询按钮...');
        queryButton.click();

        // 等待请求完成
        const requestInfo = await interceptPromise;
        console.log('获取到请求信息:', requestInfo);

        if (!requestInfo || !requestInfo.url) {
          throw new Error('未能获取到请求URL');
        }

        // 方法1: 直接使用拦截到的响应数据
        if (requestInfo.response) {
          const items = this.extractItemsFromJsonResponse(requestInfo.response);
          return {
            items: items,
            total: items.length,
            pageUrl: window.location.href,
            crawlTime: new Date().toISOString(),
            ruleName: this.name
          };
        }

        // 方法2: 如果拦截失败，使用获取到的URL重新请求
        console.log('使用获取到的URL重新请求:', requestInfo.url);
        const response = await fetch(requestInfo.url, {
          method: requestInfo.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...requestInfo.headers
          },
          body: requestInfo.body ? JSON.stringify(requestInfo.body) : null,
          credentials: 'include' // 包含cookies
        });

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        }

        const jsonData = await response.json();
        const items = this.extractItemsFromJsonResponse(jsonData);

        if (items.length === 0) {
          throw new Error('未找到任何数据项');
        }

        return {
          items: items,
          total: items.length,
          pageUrl: window.location.href,
          crawlTime: new Date().toISOString(),
          ruleName: this.name
        };
      } catch (error) {
        console.error('通过API获取数据失败:', error);
        throw error;
      }
    }

    /**
     * 从JSON响应中提取数据项
     * @param {Object} jsonResponse - API返回的JSON数据
     * @returns {Array} - 提取的数据项数组
     */
    extractItemsFromJsonResponse(jsonResponse) {
      const items = [];
      
      try {
        // 根据实际API响应结构调整
        // 常见的响应结构可能是：
        // - { data: { list: [...] } }
        // - { result: { records: [...] } }
        // - { rows: [...] }
        // - { list: [...] }
        // - 直接是数组 [...]
        
        let dataList = null;
        
        if (Array.isArray(jsonResponse)) {
          dataList = jsonResponse;
        } else if (jsonResponse.data) {
          if (Array.isArray(jsonResponse.data)) {
            dataList = jsonResponse.data;
          } else if (jsonResponse.data.list && Array.isArray(jsonResponse.data.list)) {
            dataList = jsonResponse.data.list;
          } else if (jsonResponse.data.records && Array.isArray(jsonResponse.data.records)) {
            dataList = jsonResponse.data.records;
          } else if (jsonResponse.data.rows && Array.isArray(jsonResponse.data.rows)) {
            dataList = jsonResponse.data.rows;
          }
        } else if (jsonResponse.result) {
          if (Array.isArray(jsonResponse.result)) {
            dataList = jsonResponse.result;
          } else if (jsonResponse.result.list && Array.isArray(jsonResponse.result.list)) {
            dataList = jsonResponse.result.list;
          } else if (jsonResponse.result.records && Array.isArray(jsonResponse.result.records)) {
            dataList = jsonResponse.result.records;
          }
        } else if (jsonResponse.list && Array.isArray(jsonResponse.list)) {
          dataList = jsonResponse.list;
        } else if (jsonResponse.records && Array.isArray(jsonResponse.records)) {
          dataList = jsonResponse.records;
        } else if (jsonResponse.rows && Array.isArray(jsonResponse.rows)) {
          dataList = jsonResponse.rows;
        }

        if (!dataList || !Array.isArray(dataList)) {
          console.warn('无法从响应中提取数据列表，响应结构:', jsonResponse);
          return [];
        }

        // 遍历数据项并提取
        for (const item of dataList) {
          const extractedItem = this.extractItemFromJson(item);
          if (extractedItem) {
            items.push(extractedItem);
          }
        }

        console.log(`从JSON响应中提取了 ${items.length} 条数据`);
      } catch (error) {
        console.error('提取JSON数据失败:', error);
      }

      return items;
    }

    /**
     * 从单个JSON对象中提取数据项
     * @param {Object} jsonItem - JSON数据项
     * @returns {Object|null} - 提取的数据对象
     */
    extractItemFromJson(jsonItem) {
      try {
        // 根据实际API返回的字段结构调整
        // 这里需要根据实际API响应格式来映射字段
        
        // 尝试多种可能的字段名
        const title = jsonItem.title || jsonItem.tenderTitle || jsonItem.name || jsonItem.projectName || '';
        const url = jsonItem.url || jsonItem.link || jsonItem.detailUrl || jsonItem.href || '';
        const releaseTime = jsonItem.releaseTime || jsonItem.publishTime || jsonItem.createTime || jsonItem.time || '';
        const buyerName = jsonItem.buyerName || jsonItem.purchaser || jsonItem.buyer || '';
        const agentName = jsonItem.agentName || jsonItem.agent || jsonItem.agency || '';
        const provinceName = jsonItem.provinceName || jsonItem.province || '四川省';
        const afficheType = jsonItem.afficheType || jsonItem.announcementType || jsonItem.type || '';
        const projectDirectoryName = jsonItem.projectDirectoryName || jsonItem.directory || jsonItem.category || '';
        const openTenderCode = jsonItem.openTenderCode || jsonItem.tenderCode || jsonItem.code || '';
        const budget = jsonItem.budget || jsonItem.amount || '';
        const districtName = jsonItem.districtName || jsonItem.district || '';
        const projectPurchaseWay = jsonItem.projectPurchaseWay || jsonItem.purchaseWay || '';
        const expireTime = jsonItem.expireTime || jsonItem.deadline || '';

        // 处理URL（可能是相对路径）
        let fullUrl = url;
        if (url && !url.startsWith('http')) {
          fullUrl = new URL(url, window.location.origin).href;
        }

        // 生成唯一ID
        const tenderId = fullUrl ? this.generateTenderId(fullUrl) : 
                       (openTenderCode || title.replace(/\s+/g, '_'));

        if (!title && !fullUrl) {
          return null;
        }

        return {
          tenderId: tenderId,
          flag: 0,
          title: title,
          url: fullUrl,
          releaseTime: releaseTime,
          buyerName: buyerName,
          agentName: agentName,
          provinceName: provinceName || '四川省',
          afficheType: afficheType,
          projectDirectoryName: projectDirectoryName,
          openTenderCode: openTenderCode,
          budget: budget,
          districtName: districtName,
          projectPurchaseWay: projectPurchaseWay,
          expireTime: expireTime,
          crawledAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('提取JSON项失败:', error, jsonItem);
        return null;
      }
    }

    getListItemSelector() {
      // API模式下可能不需要这个选择器，但保留以兼容
      return 'div.is-scrolling-none > table > tbody > tr';
    }

    getNextPageButtonSelector() {
      // 根据实际页面结构调整选择器
      return 'div.el-pagination > button.btn-next';
    }

    extractItemData(element) {
      // 保留原有的DOM提取方法作为备用
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
        console.error('提取数据失败:', error);
      }
      return null;
    }

    generateTenderId(url) {
      // 为四川政府采购网生成唯一ID
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
