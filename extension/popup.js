// Popup Script - 控制爬虫的UI逻辑

let isCrawling = false;
let crawledCount = 0;
let savedCount = 0;

// DOM元素
const elements = {
  statusBar: document.getElementById('statusBar'),
  statusText: document.getElementById('statusText'),
  statusIndicator: document.getElementById('statusIndicator'),
  apiUrl: document.getElementById('apiUrl'),
  testConnection: document.getElementById('testConnection'),
  crawlBtn: document.getElementById('crawlBtn'),
  stopBtn: document.getElementById('stopBtn'),
  currentPage: document.getElementById('currentPage'),
  crawledCount: document.getElementById('crawledCount'),
  savedCount: document.getElementById('savedCount'),
  logContent: document.getElementById('logContent'),
  clearLog: document.getElementById('clearLog')
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await updateCurrentPage();
  await checkBackendConnection();
  
  // 绑定事件
  elements.crawlBtn.addEventListener('click', startCrawling);
  elements.stopBtn.addEventListener('click', stopCrawling);
  elements.testConnection.addEventListener('click', testConnection);
  elements.clearLog.addEventListener('click', clearLog);
  elements.apiUrl.addEventListener('change', saveApiUrl);
});

// 加载设置
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['apiUrl']);
    if (result.apiUrl) {
      elements.apiUrl.value = result.apiUrl;
    }
  } catch (error) {
    log('加载设置失败: ' + error.message, 'error');
  }
}

// 保存API地址
async function saveApiUrl() {
  const apiUrl = elements.apiUrl.value.trim();
  if (apiUrl) {
    try {
      await chrome.runtime.sendMessage({
        action: 'setApiUrl',
        apiUrl: apiUrl
      });
      log('API地址已保存', 'success');
    } catch (error) {
      log('保存API地址失败: ' + error.message, 'error');
    }
  }
}

// 更新当前页面信息
async function updateCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      elements.currentPage.textContent = tab.url || '-';
      
      // 检查是否是目标页面
      if (tab.url && tab.url.includes('search.ccgp.gov.cn')) {
        updateStatus('ready', '目标页面已就绪');
      } else {
        updateStatus('ready', '请打开目标页面');
      }
    }
  } catch (error) {
    log('获取当前页面失败: ' + error.message, 'error');
  }
}

// 检查后端连接
async function checkBackendConnection() {
  try {
    const storage = await chrome.storage.local.get(['apiUrl']);
    const apiUrl = storage.apiUrl || 'http://localhost:3000/api/tender';
    const baseUrl = apiUrl.replace('/api/tender', '');
    
    const response = await fetch(`${baseUrl}/api/health`);
    if (response.ok) {
      const data = await response.json();
      updateStatus('ready', '后端连接正常');
      log('后端连接成功', 'success');
    } else {
      updateStatus('error', '后端连接失败');
      log('后端连接失败: HTTP ' + response.status, 'error');
    }
  } catch (error) {
    updateStatus('error', '后端连接失败');
    log('后端连接失败: ' + error.message, 'error');
  }
}

// 测试连接
async function testConnection() {
  await saveApiUrl();
  await checkBackendConnection();
}

// 开始爬取
async function startCrawling() {
  if (isCrawling) {
    return;
  }
  
  try {
    // 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      log('未找到活动标签页', 'error');
      return;
    }
    
    // 检查是否是目标页面
    if (!tab.url || !tab.url.includes('search.ccgp.gov.cn')) {
      log('请先打开目标页面: https://search.ccgp.gov.cn', 'error');
      return;
    }
    
    isCrawling = true;
    crawledCount = 0;
    savedCount = 0;
    updateUI();
    updateStatus('crawling', '正在爬取...');
    log('开始爬取数据...', 'info');
    
    // 注入content script并执行爬取
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // 发送爬取消息
    chrome.tabs.sendMessage(tab.id, { action: 'crawl' }, async (response) => {
      if (chrome.runtime.lastError) {
        log('执行爬取失败: ' + chrome.runtime.lastError.message, 'error');
        stopCrawling();
        return;
      }
      
      if (response && response.success) {
        const data = response.data;
        crawledCount = data.items ? data.items.length : 0;
        log(`爬取完成，共找到 ${crawledCount} 条数据`, 'success');
        
        // 保存数据到后端
        if (data.items && data.items.length > 0) {
          await saveData(data.items);
        } else {
          log('未找到任何数据', 'error');
          stopCrawling();
        }
      } else {
        log('爬取失败: ' + (response?.error || '未知错误'), 'error');
        stopCrawling();
      }
    });
    
  } catch (error) {
    log('开始爬取失败: ' + error.message, 'error');
    stopCrawling();
  }
}

// 停止爬取
function stopCrawling() {
  isCrawling = false;
  updateUI();
  updateStatus('ready', '已停止');
  log('爬取已停止', 'info');
}

// 保存数据
async function saveData(items) {
  try {
    updateStatus('crawling', '正在保存数据...');
    log(`正在保存 ${items.length} 条数据到后端...`, 'info');
    
    const response = await chrome.runtime.sendMessage({
      action: 'saveData',
      data: items
    });
    
    if (response && response.success) {
      savedCount = items.length;
      log(`成功保存 ${savedCount} 条数据`, 'success');
      updateStatus('ready', '保存完成');
    } else {
      log('保存失败: ' + (response?.error || '未知错误'), 'error');
      updateStatus('error', '保存失败');
    }
    
    stopCrawling();
  } catch (error) {
    log('保存数据失败: ' + error.message, 'error');
    updateStatus('error', '保存失败');
    stopCrawling();
  }
}

// 更新UI状态
function updateUI() {
  elements.crawlBtn.disabled = isCrawling;
  elements.stopBtn.disabled = !isCrawling;
  elements.crawledCount.textContent = crawledCount;
  elements.savedCount.textContent = savedCount;
}

// 更新状态
function updateStatus(status, text) {
  elements.statusText.textContent = text;
  elements.statusIndicator.className = 'status-indicator ' + status;
}

// 记录日志
function log(message, type = 'info') {
  const time = new Date().toLocaleTimeString();
  const logItem = document.createElement('div');
  logItem.className = `log-item ${type}`;
  logItem.innerHTML = `<span class="log-time">[${time}]</span>${message}`;
  elements.logContent.appendChild(logItem);
  elements.logContent.scrollTop = elements.logContent.scrollHeight;
}

// 清空日志
function clearLog() {
  elements.logContent.innerHTML = '';
}

