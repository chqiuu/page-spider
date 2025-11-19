// Background Service Worker - 处理数据保存和消息传递

// 默认后端API地址
const DEFAULT_API_URL = 'http://localhost:3000/api/tender';

// 监听扩展安装
chrome.runtime.onInstalled.addListener(() => {
  console.log('页面爬虫工具已安装');
  
  // 初始化存储
  chrome.storage.local.set({
    apiUrl: DEFAULT_API_URL,
    crawlDelay: 1000
  });
});

// 监听来自content script和popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveData') {
    saveDataToBackend(request.data)
      .then(result => {
        sendResponse({ success: true, result: result });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放
  }
  
  if (request.action === 'getApiUrl') {
    chrome.storage.local.get(['apiUrl'], (result) => {
      sendResponse({ apiUrl: result.apiUrl || DEFAULT_API_URL });
    });
    return true;
  }
  
  if (request.action === 'setApiUrl') {
    chrome.storage.local.set({ apiUrl: request.apiUrl }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// 保存数据到后端
async function saveDataToBackend(data) {
  try {
    // 获取API地址
    const storage = await chrome.storage.local.get(['apiUrl']);
    const apiUrl = storage.apiUrl || DEFAULT_API_URL;
    
    // 如果是单个对象，转换为数组
    const items = Array.isArray(data) ? data : [data];
    
    if (items.length === 0) {
      throw new Error('没有数据需要保存');
    }
    
    // 批量保存
    const response = await fetch(`${apiUrl}/saveBatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items: items })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP错误: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('保存数据失败:', error);
    throw error;
  }
}

// 检查后端连接
async function checkBackendConnection() {
  try {
    const storage = await chrome.storage.local.get(['apiUrl']);
    const apiUrl = storage.apiUrl || DEFAULT_API_URL;
    const baseUrl = apiUrl.replace('/api/tender', '');
    
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { connected: true, data: data };
    } else {
      return { connected: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

// 导出函数供popup使用
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // 在popup中可以通过chrome.runtime.sendMessage调用
}

