// Content Script - 用于在目标网页中执行爬取逻辑

let isCrawling = false;
let controlPanel = null;

// 初始化浮动控制面板
function initControlPanel() {
  // 检查是否已经存在
  if (document.getElementById('page-spider-control')) {
    return;
  }

  // 确保 body 元素存在
  if (!document.body) {
    setTimeout(initControlPanel, 100);
    return;
  }

  // 创建控制面板容器
  controlPanel = document.createElement('div');
  controlPanel.id = 'page-spider-control';
  controlPanel.className = 'page-spider-control';
  
  // 创建头部
  const header = document.createElement('div');
  header.className = 'page-spider-control-header';
  
  const title = document.createElement('div');
  title.className = 'page-spider-control-title';
  title.textContent = '页面爬虫工具';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'page-spider-control-close';
  closeBtn.textContent = '×';
  closeBtn.title = '最小化';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    controlPanel.classList.toggle('minimized');
    if (controlPanel.classList.contains('minimized')) {
      closeBtn.textContent = '□';
      closeBtn.title = '展开';
    } else {
      closeBtn.textContent = '×';
      closeBtn.title = '最小化';
    }
  });
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // 创建按钮组
  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'page-spider-control-buttons';
  
  const startBtn = document.createElement('button');
  startBtn.id = 'page-spider-start-btn';
  startBtn.className = 'page-spider-control-btn page-spider-control-btn-primary';
  startBtn.textContent = '开始爬取';
  startBtn.addEventListener('click', handleStartCrawling);
  
  const stopBtn = document.createElement('button');
  stopBtn.id = 'page-spider-stop-btn';
  stopBtn.className = 'page-spider-control-btn page-spider-control-btn-danger';
  stopBtn.textContent = '停止';
  stopBtn.disabled = true;
  stopBtn.addEventListener('click', handleStopCrawling);
  
  buttonGroup.appendChild(startBtn);
  buttonGroup.appendChild(stopBtn);
  
  // 创建状态显示
  const status = document.createElement('div');
  status.id = 'page-spider-status';
  status.className = 'page-spider-control-status';
  status.textContent = '就绪';
  
  // 组装面板
  controlPanel.appendChild(header);
  controlPanel.appendChild(buttonGroup);
  controlPanel.appendChild(status);
  
  // 添加到页面
  document.body.appendChild(controlPanel);
  
  // 更新按钮状态
  updateControlButtons();
}

// 更新控制按钮状态
function updateControlButtons() {
  const startBtn = document.getElementById('page-spider-start-btn');
  const stopBtn = document.getElementById('page-spider-stop-btn');
  
  if (startBtn && stopBtn) {
    startBtn.disabled = isCrawling;
    stopBtn.disabled = !isCrawling;
  }
}

// 更新状态显示
function updateStatus(text, type = '') {
  const status = document.getElementById('page-spider-status');
  if (status) {
    status.textContent = text;
    status.className = 'page-spider-control-status ' + type;
  }
}

// 处理开始爬取
async function handleStartCrawling() {
  if (isCrawling) {
    return;
  }
  
  try {
    // 检查是否是目标页面
    if (window.location.hostname !== 'search.ccgp.gov.cn') {
      updateStatus('请打开目标页面: search.ccgp.gov.cn', 'error');
      return;
    }
    
    isCrawling = true;
    updateControlButtons();
    
    // 开始循环爬取所有分页
    await crawlAllPages();
  } catch (error) {
    console.error('爬取失败:', error);
    updateStatus('爬取失败: ' + error.message, 'error');
    isCrawling = false;
    updateControlButtons();
  }
}

// 循环爬取所有分页
async function crawlAllPages() {
  let totalCrawled = 0;
  let totalSaved = 0;
  let pageNumber = 1;
  
  try {
    while (isCrawling) {
      updateStatus(`正在爬取第 ${pageNumber} 页...`, 'crawling');
      
      // 等待页面加载完成
      await waitForPageLoad();
      
      // 执行爬取
      const data = await crawlData();
      
      if (data && data.items && data.items.length > 0) {
        totalCrawled += data.items.length;
        updateStatus(`第 ${pageNumber} 页爬取完成，找到 ${data.items.length} 条数据，正在保存...`, 'crawling');
        
        // 保存数据到后端
        const saveSuccess = await saveDataToBackend(data.items);
        
        if (saveSuccess) {
          totalSaved += data.items.length;
          updateStatus(`第 ${pageNumber} 页保存成功，累计: ${totalSaved} 条`, 'success');
        } else {
          updateStatus(`第 ${pageNumber} 页保存失败`, 'error');
        }
      } else {
        updateStatus(`第 ${pageNumber} 页未找到任何数据`, 'error');
      }
      
      // 检查是否有下一页
      const nextPageButton = document.querySelector('div > p.pager > a.next');
      
      if (!nextPageButton || !isNextPageAvailable(nextPageButton)) {
        // 没有下一页，爬取完成
        updateStatus(`所有分页爬取完成！共爬取 ${totalCrawled} 条，保存 ${totalSaved} 条`, 'success');
        isCrawling = false;
        updateControlButtons();
        break;
      }
      
      // 点击下一页
      updateStatus(`准备跳转到第 ${pageNumber + 1} 页...`, 'crawling');
      await clickNextPage(nextPageButton);
      
      // 等待页面加载
      await waitForPageNavigation();
      
      pageNumber++;
    }
  } catch (error) {
    console.error('循环爬取失败:', error);
    updateStatus('爬取失败: ' + error.message, 'error');
    isCrawling = false;
    updateControlButtons();
  }
}

// 检查下一页按钮是否可用
function isNextPageAvailable(nextButton) {
  // 检查按钮是否存在且可见
  if (!nextButton) {
    return false;
  }
  
  // 检查按钮是否被禁用
  if (nextButton.disabled || nextButton.classList.contains('disabled')) {
    return false;
  }
  
  // 检查按钮是否隐藏
  const style = window.getComputedStyle(nextButton);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  
  // 检查按钮是否有href属性或onclick事件
  if (!nextButton.href && !nextButton.onclick) {
    return false;
  }
  
  return true;
}

// 点击下一页按钮
async function clickNextPage(nextButton) {
  return new Promise((resolve) => {
    try {
      // 获取按钮的href属性值（使用getAttribute避免浏览器自动解析）
      const hrefAttr = nextButton.getAttribute('href');
      const href = nextButton.href;
      const isJavaScriptLink = (hrefAttr && hrefAttr.trim().toLowerCase().startsWith('javascript:')) ||
                               (href && href.trim().toLowerCase().startsWith('javascript:'));

      // 方法1: 如果是普通HTTP链接，直接导航（最可靠且安全）
      if (href && !isJavaScriptLink && href !== window.location.href && 
          (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/'))) {
        // 处理相对路径
        if (href.startsWith('/')) {
          window.location.href = new URL(href, window.location.origin).href;
        } else {
          window.location.href = href;
        }
        setTimeout(resolve, 200);
        return;
      }
      
      // 方法2: 对于javascript:链接或其他情况，使用事件触发（避免CSP错误）
      // 如果href是javascript:链接，临时移除它以避免CSP错误
      let originalHref = null;
      let isHrefRemoved = false;
      
      if (isJavaScriptLink && hrefAttr) {
        originalHref = hrefAttr;
        nextButton.removeAttribute('href');
        isHrefRemoved = true;
      }
      
      // 先尝试触发mousedown和mouseup事件（更接近真实点击）
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
      
      // 触发事件序列
      nextButton.dispatchEvent(mouseDownEvent);
      setTimeout(() => {
        nextButton.dispatchEvent(mouseUpEvent);
        setTimeout(() => {
          // 先触发click事件
          nextButton.dispatchEvent(clickEvent);
          
          // 对于javascript:链接，不调用click()方法以避免CSP错误
          // 只触发事件，让事件监听器处理
          if (!isJavaScriptLink) {
            // 对于普通链接，可以安全地调用click方法
            try {
              nextButton.click();
            } catch (clickError) {
              console.warn('调用click方法失败:', clickError);
            }
          } else {
            // 对于javascript:链接，只依赖事件触发
            // 如果按钮有onclick事件监听器，事件触发应该已经调用了它
            console.log('使用事件触发方式处理javascript:链接，避免CSP错误');
          }
          
          // 恢复原始href（如果之前移除了）
          if (isHrefRemoved && originalHref) {
            nextButton.setAttribute('href', originalHref);
            isHrefRemoved = false;
          }
          
          setTimeout(resolve, 2000);
        }, 50);
      }, 50);
    } catch (error) {
      console.error('点击下一页失败:', error);
      // 最后的备用方案：检查是否是javascript:链接，如果是则只触发事件
      const hrefAttr = nextButton.getAttribute('href');
      const isJavaScriptLink = (hrefAttr && hrefAttr.trim().toLowerCase().startsWith('javascript:'));
      
      if (!isJavaScriptLink) {
        // 对于普通链接，可以尝试直接调用click方法
        try {
          nextButton.click();
        } catch (e) {
          console.error('直接调用click方法也失败:', e);
        }
      } else {
        // 对于javascript:链接，只触发事件避免CSP错误
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 0
        });
        nextButton.dispatchEvent(clickEvent);
      }
      setTimeout(resolve, 2000);
    }
  });
}

// 等待页面导航完成
async function waitForPageNavigation() {
  return new Promise((resolve) => {
    const startUrl = window.location.href;
    
    // 记录当前页面的第一个列表项内容，用于检测内容是否更新
    const firstListItem = document.querySelector('.vT-srch-result-list ul li');
    const startContent = firstListItem ? firstListItem.textContent.trim() : '';
    
    let checkCount = 0;
    const maxChecks = 100; // 最多等待10秒（100 * 100ms）
    
    const checkInterval = setInterval(() => {
      checkCount++;
      
      // 检查URL是否改变（传统页面跳转）
      if (window.location.href !== startUrl) {
        clearInterval(checkInterval);
        // URL已改变，等待页面加载完成
        waitForPageLoad().then(() => {
          // 额外等待确保DOM完全更新
          setTimeout(resolve, 1000);
        });
        return;
      }
      
      // 检查列表内容是否已更新（AJAX加载）
      const currentFirstItem = document.querySelector('.vT-srch-result-list ul li');
      const currentContent = currentFirstItem ? currentFirstItem.textContent.trim() : '';
      
      // 如果第一个列表项的内容改变了，说明新页面已加载
      if (startContent && currentContent && currentContent !== startContent) {
        clearInterval(checkInterval);
        // 额外等待确保DOM完全更新
        setTimeout(resolve, 1000);
        return;
      }
      
      // 检查列表项数量是否变化（作为备用检测方法）
      const listItems = document.querySelectorAll('.vT-srch-result-list ul li');
      if (listItems.length > 0) {
        // 如果列表项存在，等待一小段时间后检查内容是否稳定
        if (checkCount > 10) { // 至少等待1秒
          clearInterval(checkInterval);
          setTimeout(resolve, 1000);
          return;
        }
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

// 保存数据到后端（Promise版本）
function saveDataToBackend(items) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'saveData',
      data: items
    }, (response) => {
      if (response && response.success) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

// 处理停止爬取
function handleStopCrawling() {
  isCrawling = false;
  updateControlButtons();
  updateStatus('已停止', '');
}

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'crawl') {
    crawlData()
      .then(data => {
        console.log(`crawlData success`,data);
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放以支持异步响应
  }
  
  if (request.action === 'getPageInfo') {
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      isTargetPage: window.location.hostname === 'search.ccgp.gov.cn'
    };
    sendResponse({ success: true, pageInfo: pageInfo });
    return true;
  }
  
  // 同步爬取状态
  if (request.action === 'getCrawlStatus') {
    sendResponse({ isCrawling: isCrawling });
    return true;
  }
});

// 爬取页面数据
async function crawlData() {
  try {
    // 等待页面加载完成
    await waitForPageLoad();
    
    // 提取列表项
    const elements = document.querySelectorAll('.vT-srch-result-list ul li');
    let items = [];
    for (const element of elements) {
      let item = extractItemData(element)
      if (item) {
        items.push(item);
      }
    }

    if (items.length === 0) {
      throw new Error('未找到任何数据项');
    }
    
    return {
      items: items,
      total: items.length,
      pageUrl: window.location.href,
      crawlTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('爬取数据失败:', error);
    throw error;
  }
}

// 等待页面加载
function waitForPageLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
      // 超时保护
      setTimeout(resolve, 5000);
    }
  });
}

// 提取单个列表项的数据
function extractItemData(element) {
  try {
    const aElement = element.querySelector('a');
    if (!aElement) return null;
    
    // 尝试多种可能的字段位置
    const title = aElement?.textContent?.trim() || '';
    let link = aElement.href;
    if (link && !link.startsWith('http')) {
      link = new URL(link, window.location.origin).href;
    }
    let content = element.querySelector('span')?.textContent?.trim() || '';
    if (!content) return null;
    
    const tenderId = link.replace("http://", "").replace("https://", "").replace("www.ccgp.gov.cn/", "").replace(".html", "").replace(".htm", "").replace("/", "_");
    let releaseTimeStr = "";
    let provinceName = "";
    let projectDirectoryName = "";
    let buyerName = "";
    let agentName = "";
    let afficheType = "";
    content = content.replaceAll('|', '');
    console.log(`content [${content}]`);
    let strs = content.split(/\n/);
    console.log(`strs`,strs);
    if (strs.length > 7) {
      releaseTimeStr = strs[0].trim();
      buyerName = strs[1].trim();
      agentName = strs[2].trim();
      afficheType = strs[7].trim();
      if (strs.length > 10) {
          provinceName = strs[10].trim();
      }
      if (strs.length > 11) {
          projectDirectoryName = strs[11].trim();
      }
      return {
        tenderId: tenderId,
        title: title,
        url: link,
        releaseTime: releaseTimeStr,
        buyerName: buyerName,
        agentName: agentName,
        provinceName: provinceName,
        afficheType: afficheType,
        projectDirectoryName: projectDirectoryName,
        crawledAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error(`提取第${index}项失败:`, error);
  }
  return null;
}

// 页面加载完成后，初始化控制面板并向background发送就绪消息
function init() {
  // 初始化浮动控制面板
  initControlPanel();
  
  // 向background发送就绪消息
  chrome.runtime.sendMessage({ action: 'contentReady', url: window.location.href });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

