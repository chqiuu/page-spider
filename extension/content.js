// Content Script - 用于在目标网页中执行爬取逻辑
// 注意：规则文件需要在manifest.json中按顺序加载

let isCrawling = false;
let controlPanel = null;
let currentRule = null; // 当前页面对应的规则

// 获取当前页面的规则
function getCurrentRule() {
  if (!currentRule && typeof window.siteRuleManager !== 'undefined') {
    currentRule = window.siteRuleManager.getRuleForUrl(window.location.href);
  }
  return currentRule;
}

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
  
  // 检查是否支持当前页面
  const rule = getCurrentRule();
  if (rule) {
    status.textContent = `就绪 (${rule.name})`;
  } else {
    status.textContent = '当前页面不支持';
    startBtn.disabled = true;
  }
  
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
    const rule = getCurrentRule();
    startBtn.disabled = isCrawling || !rule;
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
    // 获取当前页面的规则
    const rule = getCurrentRule();
    if (!rule) {
      updateStatus('当前页面不支持爬取', 'error');
      return;
    }
    
    isCrawling = true;
    updateControlButtons();
    
    // 开始循环爬取所有分页
    await crawlAllPages(rule);
  } catch (error) {
    console.error('爬取失败:', error);
    updateStatus('爬取失败: ' + error.message, 'error');
    isCrawling = false;
    updateControlButtons();
  }
}

// 循环爬取所有分页
async function crawlAllPages(rule) {
  let totalCrawled = 0;
  let totalSaved = 0;
  let pageNumber = 1;
  
  try {
    while (isCrawling) {
      updateStatus(`正在爬取第 ${pageNumber} 页...`, 'crawling');
      
      // 等待页面加载完成
      await rule.waitForPageLoad();
      
      // 执行爬取
      const data = await crawlData(rule);
      
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
      const nextPageButton = document.querySelector(rule.getNextPageButtonSelector());
      
      if (!nextPageButton || !rule.isNextPageAvailable(nextPageButton)) {
        // 没有下一页，爬取完成
        updateStatus(`所有分页爬取完成！共爬取 ${totalCrawled} 条，保存 ${totalSaved} 条`, 'success');
        isCrawling = false;
        updateControlButtons();
        break;
      }
      
      // 点击下一页
      updateStatus(`准备跳转到第 ${pageNumber + 1} 页...`, 'crawling');
      await rule.clickNextPage(nextPageButton);
      
      // 等待页面加载
      await rule.waitForPageNavigation();
      
      pageNumber++;
    }
  } catch (error) {
    console.error('循环爬取失败:', error);
    updateStatus('爬取失败: ' + error.message, 'error');
    isCrawling = false;
    updateControlButtons();
  }
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
    const rule = getCurrentRule();
    if (!rule) {
      sendResponse({ success: false, error: '当前页面不支持爬取' });
      return true;
    }
    
    crawlData(rule)
      .then(data => {
        console.log(`crawlData success`, data);
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放以支持异步响应
  }
  
  if (request.action === 'getPageInfo') {
    const rule = getCurrentRule();
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      isTargetPage: rule !== null,
      ruleName: rule ? rule.name : null
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
async function crawlData(rule) {
  try {
    // 如果规则支持API模式，优先使用API获取数据
    if (rule.useApiMode && typeof rule.crawlDataFromApi === 'function') {
      console.log('使用API模式获取数据...');
      return await rule.crawlDataFromApi();
    }
    
    // 否则使用传统的DOM提取方式
    // 等待页面加载完成
    await rule.waitForPageLoad();
    
    // 使用规则的选择器提取列表项
    const selector = rule.getListItemSelector();
    const elements = document.querySelectorAll(selector);
    let items = [];
    
    for (const element of elements) {
      let item = rule.extractItemData(element);
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
      crawlTime: new Date().toISOString(),
      ruleName: rule.name
    };
  } catch (error) {
    console.error('爬取数据失败:', error);
    throw error;
  }
}

// 页面加载完成后，初始化控制面板并向background发送就绪消息
function init() {
  // 重新获取规则（页面可能已改变）
  currentRule = null;
  const rule = getCurrentRule();
  
  // 初始化浮动控制面板
  initControlPanel();
  
  // 向background发送就绪消息
  chrome.runtime.sendMessage({ 
    action: 'contentReady', 
    url: window.location.href,
    ruleName: rule ? rule.name : null,
    supported: rule !== null
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
