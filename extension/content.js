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
    updateStatus('正在爬取...', 'crawling');
    
    // 执行爬取
    const data = await crawlData();
    
    if (data && data.items && data.items.length > 0) {
      updateStatus(`爬取完成，找到 ${data.items.length} 条数据，正在保存...`, 'crawling');
      
      // 保存数据到后端
      chrome.runtime.sendMessage({
        action: 'saveData',
        data: data.items
      }, (response) => {
        if (response && response.success) {
          updateStatus(`成功保存 ${data.items.length} 条数据`, 'success');
        } else {
          updateStatus('保存失败: ' + (response?.error || '未知错误'), 'error');
        }
        isCrawling = false;
        updateControlButtons();
      });
    } else {
      updateStatus('未找到任何数据', 'error');
      isCrawling = false;
      updateControlButtons();
    }
  } catch (error) {
    console.error('爬取失败:', error);
    updateStatus('爬取失败: ' + error.message, 'error');
    isCrawling = false;
    updateControlButtons();
  }
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

