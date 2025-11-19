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
      this.queryButtonSelector = 'button:contains("查询"), button[type="button"]:contains("查询"), .el-button:contains("查询")';
      this.currentPage = 1;
      this.pageSize = 20; // 根据实际API调整
    }

    /**
     * 获取查询按钮选择器
     * @returns {string}
     */
    getQueryButtonSelector() {
      return 'div > button.el-button.el-button--primary.el-button--medium';
    }

    /**
     * 拦截并获取API请求的响应数据
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {Promise<Object>} - API返回的JSON数据
     */
    interceptApiRequest(timeout = 10000) {
      return new Promise((resolve, reject) => {
        let intercepted = false;
        let originalFetch = window.fetch;
        let originalXHR = window.XMLHttpRequest;

        // 拦截 fetch 请求
        window.fetch = function(...args) {
          const url = typeof args[0] === 'string' ? args[0] : args[0].url;
          const options = args[1] || {};

          console.log('拦截到 fetch 请求:', url, options);
          // 检查是否是目标API请求（application/json）
          const contentType = options.headers && (
            options.headers['Content-Type'] || 
            options.headers['content-type'] ||
            (options.headers.get && options.headers.get('Content-Type')) ||
            (options.headers.get && options.headers.get('content-type'))
          );
          
          const isJsonRequest = contentType && contentType.includes('application/json');
          const isPostRequest = (options.method || 'GET').toUpperCase() === 'POST';
          
          if (isPostRequest && isJsonRequest) {
            console.log('拦截到 fetch 请求:', url, options);
            
            return originalFetch.apply(this, args)
              .then(response => {
                // 克隆响应以便读取
                const clonedResponse = response.clone();
                
                // 检查响应类型
                const responseContentType = response.headers.get('content-type') || 
                                          response.headers.get('Content-Type') || '';
                if (responseContentType.includes('application/json')) {
                  clonedResponse.json().then(data => {
                    if (!intercepted) {
                      intercepted = true;
                      console.log('获取到API响应数据:', data);
                      resolve(data);
                      // 恢复原始fetch
                      window.fetch = originalFetch;
                      window.XMLHttpRequest = originalXHR;
                    }
                  }).catch(err => {
                    console.error('解析JSON失败:', err);
                  });
                }
                
                return response;
              })
              .catch(error => {
                console.error('fetch请求失败:', error);
                if (!intercepted) {
                  intercepted = true;
                  window.fetch = originalFetch;
                  window.XMLHttpRequest = originalXHR;
                  reject(error);
                }
              });
          }
          
          // 非目标请求，正常处理
          return originalFetch.apply(this, args);
        };

        // 拦截 XMLHttpRequest
        const XHRInterceptor = function() {
          const xhr = new originalXHR();
          const originalOpen = xhr.open;
          const originalSend = xhr.send;
          const originalSetRequestHeader = xhr.setRequestHeader;

          let requestUrl = '';
          let requestMethod = '';
          let requestHeaders = {};

          xhr.open = function(method, url, ...rest) {
            requestMethod = method;
            requestUrl = url;
            return originalOpen.apply(this, [method, url, ...rest]);
          };

          xhr.setRequestHeader = function(header, value) {
            requestHeaders[header] = value;
            return originalSetRequestHeader.apply(this, arguments);
          };

          xhr.send = function(data) {
            // 检查是否是目标API请求
            const contentType = requestHeaders['Content-Type'] || requestHeaders['content-type'];
            const isJsonRequest = contentType && contentType.includes('application/json');
            const isPostRequest = requestMethod.toUpperCase() === 'POST';
            
            if (isPostRequest && isJsonRequest) {
              console.log('拦截到 XHR 请求:', requestUrl, requestHeaders);
              
              xhr.addEventListener('load', function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                  const responseContentType = xhr.getResponseHeader('content-type') || 
                                            xhr.getResponseHeader('Content-Type') || '';
                  if (responseContentType.includes('application/json')) {
                    try {
                      const data = JSON.parse(xhr.responseText);
                      if (!intercepted) {
                        intercepted = true;
                        console.log('获取到API响应数据:', data);
                        resolve(data);
                        // 恢复原始XHR
                        window.fetch = originalFetch;
                        window.XMLHttpRequest = originalXHR;
                      }
                    } catch (err) {
                      console.error('解析JSON失败:', err);
                    }
                  }
                }
              });

              xhr.addEventListener('error', function() {
                if (!intercepted) {
                  intercepted = true;
                  window.fetch = originalFetch;
                  window.XMLHttpRequest = originalXHR;
                  reject(new Error('XHR请求失败'));
                }
              });
            }

            return originalSend.apply(this, arguments);
          };

          return xhr;
        };
        XHRInterceptor.prototype = originalXHR.prototype;
        window.XMLHttpRequest = XHRInterceptor;

        // 超时处理
        setTimeout(() => {
          if (!intercepted) {
            intercepted = true;
            window.fetch = originalFetch;
            window.XMLHttpRequest = originalXHR;
            reject(new Error('拦截请求超时'));
          }
        }, timeout);
      });
    }

    /**
     * 点击查询按钮并获取数据
     * @returns {Promise<Object>} - 包含items数组的数据对象
     */
    async clickQueryAndGetData() {
      // 等待页面加载
      await this.waitForPageLoad();
      
      // 查找查询按钮
      const queryButton = document.querySelector(this.getQueryButtonSelector());
      if (!queryButton) {
        throw new Error('未找到查询按钮，请检查选择器: ' + this.getQueryButtonSelector());
      }

      // 设置拦截器
      const interceptPromise = this.interceptApiRequest(15000);

      // 点击查询按钮
      console.log('点击查询按钮...');
      queryButton.click();

      // 等待并获取API响应
      const apiData = await interceptPromise;
      
      // 从API响应中提取数据
      return this.extractDataFromApiResponse(apiData);
    }

    /**
     * 从API响应中提取数据
     * @param {Object} apiResponse - API返回的JSON数据
     * @returns {Object} - 包含items数组的数据对象
     */
    extractDataFromApiResponse(apiResponse) {
      // 根据实际API响应结构调整
      // 常见的响应结构可能是：
      // { data: { list: [...] }, records: [...], result: { data: [...] } } 等
      
      let items = [];
      
      // 尝试多种可能的响应结构
      if (apiResponse.data) {
        if (Array.isArray(apiResponse.data)) {
          items = apiResponse.data;
        } else if (apiResponse.data.list && Array.isArray(apiResponse.data.list)) {
          items = apiResponse.data.list;
        } else if (apiResponse.data.records && Array.isArray(apiResponse.data.records)) {
          items = apiResponse.data.records;
        } else if (apiResponse.data.data && Array.isArray(apiResponse.data.data)) {
          items = apiResponse.data.data;
        }
      } else if (Array.isArray(apiResponse)) {
        items = apiResponse;
      } else if (apiResponse.records && Array.isArray(apiResponse.records)) {
        items = apiResponse.records;
      } else if (apiResponse.list && Array.isArray(apiResponse.list)) {
        items = apiResponse.list;
      }

      // 转换数据格式
      const convertedItems = items.map(item => this.convertApiItemToTenderInfo(item));

      return {
        items: convertedItems,
        total: convertedItems.length,
        pageUrl: window.location.href,
        crawlTime: new Date().toISOString(),
        ruleName: this.name,
        apiResponse: apiResponse // 保留原始响应以便调试
      };
    }

    /**
     * 将API返回的数据项转换为招标信息格式
     * @param {Object} apiItem - API返回的单个数据项
     * @returns {Object} - 转换后的招标信息对象
     */
    convertApiItemToTenderInfo(apiItem) {
      // 根据实际API返回的字段名进行映射
      // 这里需要根据实际API响应结构调整字段映射
      
      const title = apiItem.title || apiItem.name || apiItem.projectName || '';
      const url = apiItem.url || apiItem.link || apiItem.detailUrl || '';
      const releaseTime = apiItem.releaseTime || apiItem.publishTime || apiItem.createTime || '';
      const buyerName = apiItem.buyerName || apiItem.purchaser || apiItem.buyer || '';
      const agentName = apiItem.agentName || apiItem.agency || apiItem.agent || '';
      const provinceName = apiItem.provinceName || apiItem.province || '四川省';
      const afficheType = apiItem.afficheType || apiItem.announcementType || apiItem.type || '';
      const projectDirectoryName = apiItem.projectDirectoryName || apiItem.category || apiItem.directory || '';
      const districtName = apiItem.districtName || apiItem.district || apiItem.area || '';
      const projectPurchaseWay = apiItem.projectPurchaseWay || apiItem.purchaseWay || apiItem.method || '';
      const openTenderCode = apiItem.openTenderCode || apiItem.tenderCode || apiItem.code || '';
      const budget = apiItem.budget || apiItem.amount || '';
      const expireTime = apiItem.expireTime || apiItem.deadline || apiItem.endTime || '';

      // 生成唯一ID
      const tenderId = url ? this.generateTenderId(url) : 
                      (apiItem.id ? String(apiItem.id) : 
                      (apiItem.tenderId || this.generateTenderId(window.location.href + '_' + title)));

      return {
        tenderId: tenderId,
        flag: 0,
        title: title,
        url: url,
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
    }

    getListItemSelector() {
      // 由于使用API数据，这个选择器可能不再需要，但保留以兼容
      return 'div.is-scrolling-none > table > tbody > tr';
    }

    getNextPageButtonSelector() {
      // 根据实际页面结构调整选择器
      return 'div.el-pagination > button.btn-next, .el-pagination .btn-next';
    }

    /**
     * 重写爬取数据方法，使用API拦截方式
     */
    async crawlDataFromApi() {
      return await this.clickQueryAndGetData();
    }

    extractItemData(element) {
      // 保留此方法以兼容DOM提取方式，但主要使用API方式
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
            releaseTime: '',
            buyerName: '',
            agentName: '',
            provinceName: provinceName,
            afficheType: '',
            projectDirectoryName: '',
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
