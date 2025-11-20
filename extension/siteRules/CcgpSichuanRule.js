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
      console.log('[查找按钮] 开始查找查询按钮...');
      const selectors = this.getQueryButtonSelector().split(',');
      console.log('[查找按钮] 尝试的选择器数量:', selectors.length);
      
      for (let i = 0; i < selectors.length; i++) {
        const selector = selectors[i];
        const trimmedSelector = selector.trim();
        console.log(`[查找按钮] 尝试选择器 [${i+1}/${selectors.length}]: "${trimmedSelector}"`);
        
        // 处理 :contains() 伪类（jQuery语法，需要手动实现）
        if (trimmedSelector.includes(':contains(')) {
          const baseSelector = trimmedSelector.split(':contains')[0].trim();
          const textMatch = trimmedSelector.match(/:contains\(["']?([^"']+)["']?\)/);
          if (textMatch) {
            console.log(`[查找按钮] 使用:contains()查找，基础选择器: "${baseSelector}", 文本: "${textMatch[1]}"`);
            const buttons = document.querySelectorAll(baseSelector);
            console.log(`[查找按钮] 找到 ${buttons.length} 个匹配基础选择器的元素`);
            for (const btn of buttons) {
              if (btn.textContent.includes(textMatch[1])) {
                console.log('[查找按钮] 找到匹配的按钮:', btn.textContent.trim());
                return btn;
              }
            }
          }
        } else {
          const button = document.querySelector(trimmedSelector);
          if (button) {
            console.log(`[查找按钮] 通过选择器找到按钮: "${trimmedSelector}"`);
            return button;
          } else {
            console.log(`[查找按钮] 选择器未找到元素: "${trimmedSelector}"`);
          }
        }
      }
      
      // 如果都找不到，尝试通过文本内容查找
      console.log('[查找按钮] 所有选择器都未找到，尝试通过文本内容查找...');
      const allButtons = document.querySelectorAll('button');
      console.log(`[查找按钮] 页面上共有 ${allButtons.length} 个按钮`);
      for (const btn of allButtons) {
        const text = btn.textContent.trim();
        if (text === '查询' || text === '搜索' || text.includes('查询')) {
          console.log(`[查找按钮] 通过文本内容找到按钮: "${text}"`);
          return btn;
        }
      }
      
      console.error('[查找按钮] 未找到查询按钮');
      return null;
    }

    /**
     * 拦截所有网络请求（包括XMLHttpRequest和fetch）
     * @returns {Promise<{url: string, method: string, body: any, headers: object, response: any}>}
     */
    interceptAllRequests() {
      return new Promise((resolve, reject) => {
        console.log('[拦截请求] 开始拦截所有网络请求（XHR + Fetch + PerformanceObserver）...');
        const startTime = Date.now();
        let xhrCreatedCount = 0;
        let xhrSentCount = 0;
        let fetchCallCount = 0;
        let interceptedCount = 0;
        let performanceEntries = [];
        let requestInfo = null;
        
        // ========== 使用 PerformanceObserver 监听网络请求 ==========
        let performanceObserver = null;
        let detectedApiUrl = null; // 检测到的API URL
        
        // 尝试从检测到的URL重新请求的函数
        const tryRequestDetectedUrl = async (url, method = 'GET', body = null) => {
          if (requestInfo) return; // 已经有请求信息了，不需要重新请求
          
          console.log(`[PerformanceObserver] 尝试使用检测到的URL重新请求: ${method} ${url}`);
          try {
            // 等待一小段时间确保原请求完成
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 准备请求选项
            const fetchOptions = {
              method: method,
              credentials: 'include',
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
              }
            };
            
            // 如果是POST请求，尝试从页面获取可能的请求体
            if (method === 'POST' && !body) {
              // 尝试从表单获取数据
              const forms = document.querySelectorAll('form');
              for (const form of forms) {
                const formData = new FormData(form);
                const formObj = {};
                for (const [key, value] of formData.entries()) {
                  formObj[key] = value;
                }
                if (Object.keys(formObj).length > 0) {
                  body = formObj;
                  console.log('[PerformanceObserver] 从表单获取到请求参数:', formObj);
                  break;
                }
              }
              
              // 如果没有表单，尝试构造一个基本的请求体
              if (!body) {
                body = { page: 1, pageSize: 20 }; // 默认分页参数
                console.log('[PerformanceObserver] 使用默认请求参数:', body);
              }
            }
            
            if (body) {
              fetchOptions.body = JSON.stringify(body);
            }
            
            // 尝试使用fetch重新请求
            const response = await fetch(url, fetchOptions);
            
            console.log(`[PerformanceObserver] 重新请求响应: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
              const contentType = response.headers.get('content-type') || '';
              let responseData = null;
              
              if (contentType.includes('application/json')) {
                responseData = await response.json();
              } else {
                const text = await response.text();
                try {
                  responseData = JSON.parse(text);
                } catch (e) {
                  responseData = text;
                }
              }
              
              if (responseData && !requestInfo) {
                requestInfo = {
                  url: url,
                  method: method,
                  body: body,
                  headers: fetchOptions.headers,
                  response: responseData
                };
                
                console.log('[PerformanceObserver] 成功通过重新请求获取数据:', {
                  url: requestInfo.url,
                  method: requestInfo.method,
                  responseType: typeof responseData,
                  responseKeys: responseData && typeof responseData === 'object' ? Object.keys(responseData) : null
                });
                
                clearTimeout(timeout);
                // 清理拦截器
                if (performanceObserver) {
                  try {
                    performanceObserver.disconnect();
                  } catch (e) {}
                }
                // 恢复原始函数
                if (window._OriginalXHR) {
                  window.XMLHttpRequest = window._OriginalXHR;
                  delete window._OriginalXHR;
                }
                if (window._OriginalFetch) {
                  window.fetch = window._OriginalFetch;
                  delete window._OriginalFetch;
                }
                resolve(requestInfo);
                return true;
              }
            } else {
              console.warn(`[PerformanceObserver] 重新请求失败: ${response.status} ${response.statusText}`);
            }
          } catch (error) {
            console.error(`[PerformanceObserver] 重新请求异常: ${url}`, error);
          }
          return false;
        };
        
        try {
          if ('PerformanceObserver' in window) {
            performanceObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              entries.forEach(entry => {
                if (entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch') {
                  const url = entry.name;
                  console.log(`[PerformanceObserver] 检测到网络请求: ${entry.initiatorType} ${url}`);
                  performanceEntries.push({
                    type: entry.initiatorType,
                    url: url,
                    duration: entry.duration,
                    startTime: entry.startTime
                  });
                  
                  // 如果是API请求，立即尝试获取响应
                  if (url.includes('api') || url.includes('query') || url.includes('search') || 
                      url.includes('list') || url.includes('page') || url.includes('data') ||
                      url.includes('getList') || url.includes('getData')) {
                    console.log(`[PerformanceObserver] 检测到可能的API请求: ${url}`);
                    if (!detectedApiUrl) {
                      detectedApiUrl = url;
                      // 延迟一点时间后尝试重新请求，确保原请求完成
                      setTimeout(async () => {
                        if (!requestInfo) {
                          // 先尝试 GET 请求
                          const success = await tryRequestDetectedUrl(url, 'GET');
                          // 如果 GET 失败，尝试 POST
                          if (!success && !requestInfo) {
                            console.log(`[PerformanceObserver] GET 请求失败，尝试 POST 请求: ${url}`);
                            await tryRequestDetectedUrl(url, 'POST');
                          }
                        }
                      }, 1500);
                    }
                  }
                }
              });
            });
            
            try {
              performanceObserver.observe({ entryTypes: ['resource'] });
              console.log('[拦截请求] PerformanceObserver 已启动');
            } catch (e) {
              console.warn('[拦截请求] PerformanceObserver 启动失败:', e);
            }
          }
        } catch (e) {
          console.warn('[拦截请求] 无法创建 PerformanceObserver:', e);
        }
        
        const timeout = setTimeout(async () => {
          console.error('[拦截请求] 等待请求超时 (30秒)');
          console.error('[拦截请求] 统计信息:', {
            XHR创建次数: xhrCreatedCount,
            XHR发送次数: xhrSentCount,
            Fetch调用次数: fetchCallCount,
            拦截成功次数: interceptedCount,
            PerformanceObserver检测到的请求数: performanceEntries.length,
            已用时间: Date.now() - startTime + 'ms'
          });
          
          // 输出 PerformanceObserver 检测到的请求
          if (performanceEntries.length > 0) {
            console.log('[拦截请求] PerformanceObserver 检测到的请求列表:');
            performanceEntries.forEach((entry, index) => {
              console.log(`  [${index + 1}] ${entry.type}: ${entry.url}`);
            });
            
            // 如果检测到了请求但没拦截到响应，尝试使用检测到的URL重新请求
            if (!requestInfo && detectedApiUrl) {
              console.log('[拦截请求] 检测到请求但未拦截到响应，尝试使用检测到的URL重新请求...');
              try {
                // 先尝试 GET
                let success = await tryRequestDetectedUrl(detectedApiUrl, 'GET');
                // 如果 GET 失败，尝试 POST
                if (!success && !requestInfo) {
                  console.log('[拦截请求] GET 请求失败，尝试 POST 请求');
                  success = await tryRequestDetectedUrl(detectedApiUrl, 'POST');
                }
                // 如果成功，resolve 会在 tryRequestDetectedUrl 中调用，这里不需要 reject
                if (success) return;
              } catch (error) {
                console.error('[拦截请求] 重新请求失败:', error);
              }
            } else if (!requestInfo && performanceEntries.length > 0) {
              // 尝试使用第一个检测到的请求URL
              const firstEntry = performanceEntries.find(e => 
                e.url.includes('api') || e.url.includes('query') || 
                e.url.includes('search') || e.url.includes('list') ||
                e.url.includes('page') || e.url.includes('data') ||
                e.url.includes('getList') || e.url.includes('getData')
              );
              if (firstEntry) {
                console.log('[拦截请求] 尝试使用第一个检测到的请求URL重新请求:', firstEntry.url);
                try {
                  // 先尝试 GET
                  let success = await tryRequestDetectedUrl(firstEntry.url, 'GET');
                  // 如果 GET 失败，尝试 POST
                  if (!success && !requestInfo) {
                    console.log('[拦截请求] GET 请求失败，尝试 POST 请求');
                    success = await tryRequestDetectedUrl(firstEntry.url, 'POST');
                  }
                  if (success) return;
                } catch (error) {
                  console.error('[拦截请求] 重新请求失败:', error);
                }
              }
            }
          }
          
          // 清理 PerformanceObserver
          if (performanceObserver) {
            try {
              performanceObserver.disconnect();
              console.log('[拦截请求] PerformanceObserver 已断开');
            } catch (e) {
              console.warn('[拦截请求] 断开 PerformanceObserver 失败:', e);
            }
          }
          
          // 恢复原始函数
          if (window._OriginalXHR) {
            window.XMLHttpRequest = window._OriginalXHR;
            delete window._OriginalXHR;
          }
          if (window._OriginalFetch) {
            window.fetch = window._OriginalFetch;
            delete window._OriginalFetch;
          }
          reject(new Error('等待请求超时'));
        }, 30000);

        // ========== 拦截 XMLHttpRequest ==========
        const OriginalXHR = window.XMLHttpRequest;
        window._OriginalXHR = OriginalXHR;

        window.XMLHttpRequest = function() {
          xhrCreatedCount++;
          console.log(`[拦截XHR] 创建新的XHR实例 (总计: ${xhrCreatedCount})`);
          
          const xhr = new OriginalXHR();
          const originalOpen = xhr.open;
          const originalSend = xhr.send;
          let requestUrl = '';
          let requestMethod = '';
          let requestBody = null;
          let requestHeaders = {};

          xhr.open = function(method, url, ...args) {
            requestMethod = method;
            requestUrl = url;
            if (url && !url.startsWith('http')) {
              requestUrl = new URL(url, window.location.origin).href;
            }
            console.log(`[拦截XHR] XHR.open() 被调用: ${method} ${requestUrl}`);
            return originalOpen.apply(this, [method, url, ...args]);
          };

          const originalSetRequestHeader = xhr.setRequestHeader;
          xhr.setRequestHeader = function(header, value) {
            requestHeaders[header] = value;
            console.log(`[拦截XHR] XHR.setRequestHeader() 被调用: ${header} = ${value}`);
            return originalSetRequestHeader.apply(this, [header, value]);
          };

          xhr.send = function(body) {
            xhrSentCount++;
            requestBody = body;
            
            const contentType = requestHeaders['Content-Type'] || 
                               requestHeaders['content-type'] || '';
            
            console.log(`[拦截XHR] XHR.send() 被调用 (总计: ${xhrSentCount})`);
            console.log(`[拦截XHR] 请求详情:`, {
              method: requestMethod,
              url: requestUrl,
              contentType: contentType,
              bodyType: typeof body,
              bodyPreview: body ? (typeof body === 'string' ? body.substring(0, 100) : JSON.stringify(body).substring(0, 100)) : 'null'
            });
            
            // 放宽拦截条件：拦截所有请求，不仅仅是JSON
            const shouldIntercept = true; // 拦截所有请求以便调试
            
            if (shouldIntercept) {
              interceptedCount++;
              console.log(`[拦截XHR] 开始拦截此请求 (拦截次数: ${interceptedCount})`);
              
              xhr.addEventListener('load', function() {
                console.log(`[拦截XHR] XHR.load 事件触发, status: ${xhr.status}`);
                if (xhr.status >= 200 && xhr.status < 300) {
                  clearTimeout(timeout);
                  try {
                    const responseText = xhr.responseText;
                    console.log(`[拦截XHR] 响应文本长度: ${responseText.length} 字符`);
                    console.log(`[拦截XHR] 响应文本预览: ${responseText.substring(0, 200)}`);
                    
                    let responseData = null;
                    try {
                      responseData = JSON.parse(responseText);
                    } catch (e) {
                      console.warn('[拦截XHR] 响应不是JSON格式，保存为文本');
                      responseData = responseText;
                    }
                    
                    requestInfo = {
                      url: requestUrl,
                      method: requestMethod,
                      body: requestBody ? (typeof requestBody === 'string' ? (requestBody.trim().startsWith('{') ? JSON.parse(requestBody) : requestBody) : requestBody) : null,
                      headers: requestHeaders,
                      response: responseData
                    };
                    
                    console.log('[拦截XHR] 成功拦截并解析响应:', {
                      url: requestInfo.url,
                      method: requestInfo.method,
                      responseType: typeof responseData
                    });
                    
                    // 清理拦截器
                    if (performanceObserver) {
                      try {
                        performanceObserver.disconnect();
                      } catch (e) {}
                    }
                    // 恢复原始函数
                    window.XMLHttpRequest = OriginalXHR;
                    delete window._OriginalXHR;
                    if (window._OriginalFetch) {
                      window.fetch = window._OriginalFetch;
                      delete window._OriginalFetch;
                    }
                    resolve(requestInfo);
                  } catch (error) {
                    console.error('[拦截XHR] 处理响应失败:', error);
                    requestInfo = {
                      url: requestUrl,
                      method: requestMethod,
                      body: requestBody,
                      headers: requestHeaders,
                      response: null
                    };
                    window.XMLHttpRequest = OriginalXHR;
                    delete window._OriginalXHR;
                    if (window._OriginalFetch) {
                      window.fetch = window._OriginalFetch;
                      delete window._OriginalFetch;
                    }
                    resolve(requestInfo);
                  }
                }
              }, { once: true });

              xhr.addEventListener('error', function() {
                console.error('[拦截XHR] XHR.error 事件触发');
              }, { once: true });
            }

            return originalSend.apply(this, [body]);
          };

          return xhr;
        };

        // ========== 拦截 Fetch API ==========
        const OriginalFetch = window.fetch;
        window._OriginalFetch = OriginalFetch;

        window.fetch = function(input, init = {}) {
          fetchCallCount++;
          const url = typeof input === 'string' ? input : input.url;
          const method = init.method || 'GET';
          const headers = init.headers || {};
          const body = init.body;
          
          console.log(`[拦截Fetch] Fetch调用 (总计: ${fetchCallCount}): ${method} ${url}`);
          console.log(`[拦截Fetch] 请求详情:`, {
            method: method,
            url: url,
            headers: headers,
            body: body ? (typeof body === 'string' ? body.substring(0, 100) : String(body).substring(0, 100)) : 'null'
          });
          
          // 调用原始fetch
          return OriginalFetch.apply(this, arguments).then(response => {
            console.log(`[拦截Fetch] Fetch响应: ${response.status} ${response.status} ${url}`);
            
            // 克隆响应以便读取（原始响应只能读取一次）
            const responseClone = response.clone();
            
            // 检查Content-Type
            const contentType = response.headers.get('content-type') || '';
            const isJson = contentType.includes('application/json');
            
            // 放宽拦截条件：拦截所有请求以便调试
            const shouldIntercept = true; // 拦截所有请求
            
            if (shouldIntercept) {
              interceptedCount++;
              console.log(`[拦截Fetch] 开始拦截此Fetch请求 (拦截次数: ${interceptedCount})`);
              console.log(`[拦截Fetch] Content-Type: ${contentType}, URL: ${url}`);
              
              // 读取响应体
              responseClone.text().then(text => {
                console.log(`[拦截Fetch] 响应文本长度: ${text.length} 字符`);
                console.log(`[拦截Fetch] 响应文本预览: ${text.substring(0, 200)}`);
                
                try {
                  let responseData = null;
                  if (isJson) {
                    responseData = JSON.parse(text);
                  } else {
                    // 尝试解析为JSON
                    try {
                      responseData = JSON.parse(text);
                    } catch (e) {
                      responseData = text;
                    }
                  }
                  
                  if (!requestInfo) {
                    requestInfo = {
                      url: url,
                      method: method,
                      body: body ? (typeof body === 'string' ? (body.trim().startsWith('{') ? JSON.parse(body) : body) : body) : null,
                      headers: headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers,
                      response: responseData
                    };
                    
                    console.log('[拦截Fetch] 成功拦截并解析响应:', {
                      url: requestInfo.url,
                      method: requestInfo.method,
                      responseType: typeof responseData
                    });
                    
                    clearTimeout(timeout);
                    // 清理拦截器
                    if (performanceObserver) {
                      try {
                        performanceObserver.disconnect();
                      } catch (e) {}
                    }
                    // 恢复原始函数
                    window.XMLHttpRequest = OriginalXHR;
                    delete window._OriginalXHR;
                    window.fetch = OriginalFetch;
                    delete window._OriginalFetch;
                    resolve(requestInfo);
                  }
                } catch (error) {
                  console.error('[拦截Fetch] 解析响应失败:', error);
                }
              }).catch(err => {
                console.error('[拦截Fetch] 读取响应失败:', err);
              });
            }
            
            return response;
          }).catch(error => {
            console.error('[拦截Fetch] Fetch请求失败:', error);
            return Promise.reject(error);
          });
        };

        // 30秒后恢复原始函数
        setTimeout(() => {
          if (!requestInfo) {
            console.warn('[拦截请求] 30秒内未获取到请求信息，恢复原始函数');
            // 清理 PerformanceObserver
            if (performanceObserver) {
              try {
                performanceObserver.disconnect();
              } catch (e) {}
            }
            window.XMLHttpRequest = OriginalXHR;
            delete window._OriginalXHR;
            window.fetch = OriginalFetch;
            delete window._OriginalFetch;
          }
        }, 30000);
      });
    }

    /**
     * 拦截XMLHttpRequest并获取请求信息（保留旧方法以兼容）
     * @returns {Promise<{url: string, method: string, body: any, headers: object}>}
     */
    interceptXHRRequest() {
      return new Promise((resolve, reject) => {
        console.log('[拦截XHR] 开始拦截XMLHttpRequest请求...');
        const startTime = Date.now();
        let xhrCreatedCount = 0;
        let xhrSentCount = 0;
        let interceptedCount = 0;
        
        const timeout = setTimeout(() => {
          console.error('[拦截XHR] 等待请求超时 (30秒)');
          console.error('[拦截XHR] 统计信息:', {
            XHR创建次数: xhrCreatedCount,
            XHR发送次数: xhrSentCount,
            拦截成功次数: interceptedCount,
            已用时间: Date.now() - startTime + 'ms'
          });
          window.XMLHttpRequest = OriginalXHR;
          reject(new Error('等待请求超时'));
        }, 30000); // 30秒超时

        // 保存原始的XMLHttpRequest
        const OriginalXHR = window.XMLHttpRequest;
        let requestInfo = null;

        // 重写XMLHttpRequest
        window.XMLHttpRequest = function() {
          xhrCreatedCount++;
          console.log(`[拦截XHR] 创建新的XHR实例 (总计: ${xhrCreatedCount})`);
          
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
            console.log(`[拦截XHR] XHR.open() 被调用: ${method} ${requestUrl}`);
            return originalOpen.apply(this, [method, url, ...args]);
          };

          // 拦截setRequestHeader（需要在open之后才能设置）
          const originalSetRequestHeader = xhr.setRequestHeader;
          xhr.setRequestHeader = function(header, value) {
            requestHeaders[header] = value;
            console.log(`[拦截XHR] XHR.setRequestHeader() 被调用: ${header} = ${value}`);
            return originalSetRequestHeader.apply(this, [header, value]);
          };

          // 拦截send方法
          xhr.send = function(body) {
            xhrSentCount++;
            requestBody = body;
            
            // 检查Content-Type（可能在setRequestHeader中设置）
            const contentType = requestHeaders['Content-Type'] || 
                               requestHeaders['content-type'] || '';
            
            console.log(`[拦截XHR] XHR.send() 被调用 (总计: ${xhrSentCount})`);
            console.log(`[拦截XHR] 请求详情:`, {
              method: requestMethod,
              url: requestUrl,
              contentType: contentType,
              bodyType: typeof body,
              bodyPreview: body ? (typeof body === 'string' ? body.substring(0, 100) : JSON.stringify(body).substring(0, 100)) : 'null',
              headers: requestHeaders
            });
            
            // 检查是否是JSON请求
            const isJsonContentType = contentType.includes('application/json');
            const isJsonBody = requestBody && typeof requestBody === 'string' && requestBody.trim().startsWith('{');
            const shouldIntercept = isJsonContentType || isJsonBody;
            
            console.log(`[拦截XHR] 拦截判断:`, {
              isJsonContentType: isJsonContentType,
              isJsonBody: isJsonBody,
              shouldIntercept: shouldIntercept
            });
            
            // 只拦截application/json请求，或者请求体是JSON格式
            if (shouldIntercept) {
              interceptedCount++;
              console.log(`[拦截XHR] 开始拦截此请求 (拦截次数: ${interceptedCount})`);
              
              // 拦截响应
              xhr.addEventListener('load', function() {
                console.log(`[拦截XHR] XHR.load 事件触发, status: ${xhr.status}`);
                if (xhr.status >= 200 && xhr.status < 300) {
                  clearTimeout(timeout);
                  try {
                    const responseText = xhr.responseText;
                    console.log(`[拦截XHR] 响应文本长度: ${responseText.length} 字符`);
                    console.log(`[拦截XHR] 响应文本预览: ${responseText.substring(0, 200)}`);
                    const responseData = JSON.parse(responseText);
                    
                    requestInfo = {
                      url: requestUrl,
                      method: requestMethod,
                      body: requestBody ? (typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody) : null,
                      headers: requestHeaders,
                      response: responseData
                    };
                    
                    console.log('[拦截XHR] 成功拦截并解析响应:', {
                      url: requestInfo.url,
                      method: requestInfo.method,
                      responseKeys: responseData ? Object.keys(responseData) : null
                    });
                    
                    // 恢复原始XMLHttpRequest
                    window.XMLHttpRequest = OriginalXHR;
                    resolve(requestInfo);
                  } catch (error) {
                    console.error('[拦截XHR] 解析响应失败:', error);
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
                } else {
                  console.warn(`[拦截XHR] 响应状态码不是成功: ${xhr.status}`);
                }
              }, { once: true });

              xhr.addEventListener('error', function() {
                console.error('[拦截XHR] XHR.error 事件触发');
                clearTimeout(timeout);
                window.XMLHttpRequest = OriginalXHR;
                reject(new Error('请求失败'));
              }, { once: true });
              
              xhr.addEventListener('timeout', function() {
                console.error('[拦截XHR] XHR.timeout 事件触发');
              }, { once: true });
            } else {
              console.log(`[拦截XHR] 跳过拦截此请求 (不是JSON请求)`);
            }

            return originalSend.apply(this, [body]);
          };

          return xhr;
        };

        // 如果30秒内没有请求，恢复原始XHR
        setTimeout(() => {
          if (!requestInfo) {
            console.warn('[拦截XHR] 30秒内未获取到请求信息，恢复原始XHR');
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
        console.log('[API爬取] 开始通过API获取数据...');
        console.log('[API爬取] 当前页面URL:', window.location.href);
        
        // 等待页面加载完成
        console.log('[API爬取] 等待页面加载完成...');
        await this.waitForPageLoad();
        console.log('[API爬取] 页面加载完成');

        // 查找查询按钮
        console.log('[API爬取] 开始查找查询按钮...');
        console.log('[API爬取] 查询按钮选择器:', this.getQueryButtonSelector());
        const queryButton = this.findQueryButton();
        
        if (!queryButton) {
          console.error('[API爬取] 未找到查询按钮');
          console.error('[API爬取] 尝试查找所有按钮:', document.querySelectorAll('button').length, '个');
          // 输出所有按钮的信息以便调试
          const allButtons = document.querySelectorAll('button');
          console.log('[API爬取] 页面上的所有按钮:');
          allButtons.forEach((btn, index) => {
            console.log(`  [${index}] 文本: "${btn.textContent.trim()}", 类名: "${btn.className}", type: "${btn.type}"`);
          });
          throw new Error('未找到查询按钮，请检查页面结构或选择器');
        }

        console.log('[API爬取] 找到查询按钮:', {
          text: queryButton.textContent.trim(),
          className: queryButton.className,
          type: queryButton.type,
          disabled: queryButton.disabled,
          visible: window.getComputedStyle(queryButton).display !== 'none'
        });

        // 开始拦截所有网络请求（必须在点击按钮之前）
        console.log('[API爬取] 开始拦截所有网络请求（XHR + Fetch + PerformanceObserver）...');
        const interceptPromise = this.interceptAllRequests();

        // 等待拦截器完全设置好
        console.log('[API爬取] 等待拦截器设置完成...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 验证拦截器是否已设置
        const isXHRIntercepted = window.XMLHttpRequest !== window._OriginalXHR || window._OriginalXHR !== undefined;
        const isFetchIntercepted = window.fetch !== window._OriginalFetch || window._OriginalFetch !== undefined;
        console.log('[API爬取] 拦截器状态检查:', {
          XHR已拦截: isXHRIntercepted || window._OriginalXHR !== undefined,
          Fetch已拦截: isFetchIntercepted || window._OriginalFetch !== undefined,
          PerformanceObserver可用: 'PerformanceObserver' in window
        });

        // 点击查询按钮
        console.log('[API爬取] 点击查询按钮...');
        try {
          // 尝试多种点击方式
          if (queryButton.onclick) {
            console.log('[API爬取] 按钮有onclick事件，直接调用');
            queryButton.onclick();
          } else {
            // 创建并触发点击事件
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            queryButton.dispatchEvent(clickEvent);
            // 也尝试直接调用click方法
            queryButton.click();
          }
          console.log('[API爬取] 查询按钮已点击');
        } catch (clickError) {
          console.error('[API爬取] 点击按钮时出错:', clickError);
          throw new Error('点击查询按钮失败: ' + clickError.message);
        }

        // 等待请求完成
        console.log('[API爬取] 等待请求完成...');
        const requestInfo = await interceptPromise;
        console.log('[API爬取] 获取到请求信息:', {
          url: requestInfo.url,
          method: requestInfo.method,
          hasResponse: !!requestInfo.response,
          responseType: requestInfo.response ? typeof requestInfo.response : null
        });

        if (!requestInfo || !requestInfo.url) {
          throw new Error('未能获取到请求URL');
        }

        // 方法1: 直接使用拦截到的响应数据
        if (requestInfo.response) {
          console.log('[API爬取] 使用拦截到的响应数据');
          const items = this.extractItemsFromJsonResponse(requestInfo.response);
          console.log(`[API爬取] 从响应中提取了 ${items.length} 条数据`);
          return {
            items: items,
            total: items.length,
            pageUrl: window.location.href,
            crawlTime: new Date().toISOString(),
            ruleName: this.name
          };
        }

        // 方法2: 如果拦截失败，使用获取到的URL重新请求
        console.log('[API爬取] 拦截的响应为空，使用获取到的URL重新请求:', requestInfo.url);
        const response = await fetch(requestInfo.url, {
          method: requestInfo.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...requestInfo.headers
          },
          body: requestInfo.body ? JSON.stringify(requestInfo.body) : null,
          credentials: 'include' // 包含cookies
        });

        console.log('[API爬取] 重新请求响应状态:', response.status, response.statusText);

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        }

        const jsonData = await response.json();
        console.log('[API爬取] 重新请求获取的JSON数据:', {
          keys: Object.keys(jsonData),
          dataType: typeof jsonData
        });
        
        const items = this.extractItemsFromJsonResponse(jsonData);
        console.log(`[API爬取] 从重新请求的响应中提取了 ${items.length} 条数据`);

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
        console.error('[API爬取] 通过API获取数据失败:', error);
        console.error('[API爬取] 错误堆栈:', error.stack);
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
          console.log('extractedItem',extractedItem);
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
        const url = `https://www.ccgp-sichuan.gov.cn/maincms-web/article?type=notice&id=${jsonItem.id}&planId=${jsonItem.planId}`;
        const releaseTime =  jsonItem.noticeTime || '';
        const buyerName = jsonItem.buyerName || jsonItem.purchaser || jsonItem.buyer || '';
        const agentName = jsonItem.agentName || jsonItem.agent || jsonItem.agency || '';
        const provinceName = jsonItem.provinceName || jsonItem.province || '四川省';
        const noticeType = jsonItem.noticeType || '';
        let afficheType ='';
        if(noticeType.includes('00101')){
          afficheType = '招标公告';
        }else if(noticeType.includes('001052') || noticeType.includes('001053') || noticeType.includes('00105B')){
          afficheType = '资格预审公告';
        }else if(noticeType.includes('00102')){
          afficheType = '中标公告';
        }else if(noticeType.includes('00103')){
          afficheType = '更正公告';
        }else if(noticeType.includes('001004') || noticeType.includes('001006')){
          afficheType = '废标（终止）公告';
        }
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
        const tenderId ='sichuan_'+ jsonItem.id;

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
