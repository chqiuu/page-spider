// 内容脚本 - 在网页中运行
console.log('=== Content Script 开始加载 ===', window.location.href);

let isCrawling = false;
let crawlInterval = null;
let crawlerEngine = null;
let currentRule = null;

// 初始化爬虫引擎
function initCrawler() {
  const url = window.location.href;
  currentRule = matchRule(url);
  crawlerEngine = new CrawlerEngine(url, currentRule);
  
  // 通知popup当前规则
  chrome.runtime.sendMessage({
    type: 'ruleDetected',
    rule: {
      name: currentRule.name,
      type: currentRule.type,
      url: url
    }
  });
  
  console.log('已匹配规则:', currentRule.name);
}

// 监听来自popup的消息
console.log('=== 注册消息监听器 ===');
const messageListener = (message, sender, sendResponse) => {
  console.log('=== 收到消息 ===', {
    type: message?.type,
    message: message,
    sender: sender,
    timestamp: new Date().toISOString()
  });
  
  // 处理 ping 消息（用于检查 content script 是否准备好）
  if (message && message.type === 'ping') {
    console.log('处理 ping 消息');
    sendResponse({ success: true, ready: true });
    return true;
  }
  
  if (message && message.type === 'startCrawl') {
    console.log('处理 startCrawl 消息', message);
    try {
      startCrawl(message.selector, message.delay, message.ruleType);
      sendResponse({ success: true });
    } catch (error) {
      console.error('启动爬取时出错:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  } else if (message && message.type === 'stopCrawl') {
    console.log('处理 stopCrawl 消息');
    try {
      stopCrawl();
      sendResponse({ success: true });
    } catch (error) {
      console.error('停止爬取时出错:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  } else if (message && message.type === 'getRuleInfo') {
    console.log('处理 getRuleInfo 消息');
    // 返回当前规则信息
    try {
      if (crawlerEngine) {
        sendResponse({ success: true, rule: crawlerEngine.getRuleInfo() });
      } else {
        initCrawler();
        sendResponse({ success: true, rule: crawlerEngine.getRuleInfo() });
      }
    } catch (error) {
      console.error('获取规则信息时出错:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  
  console.warn('收到未知消息类型:', message?.type);
  // 对于其他消息类型，返回 true 以保持消息通道开放
  return true;
};

chrome.runtime.onMessage.addListener(messageListener);
console.log('=== 消息监听器已注册 ===', typeof chrome.runtime.onMessage);

// 开始爬取
function startCrawl(customSelector, delay, ruleType = 'auto') {
  if (isCrawling) {
    return;
  }

  // 初始化引擎（如果还没有）
  if (!crawlerEngine) {
    initCrawler();
  }

  isCrawling = true;
  chrome.runtime.sendMessage({ type: 'crawlStatus', status: 'running' });

  // 立即执行一次
  crawlData(customSelector, ruleType);

  // 设置定时爬取
  if (delay > 0) {
    crawlInterval = setInterval(() => {
      if (isCrawling) {
        crawlData(customSelector, ruleType);
      }
    }, delay);
  }
}

// 停止爬取
function stopCrawl() {
  isCrawling = false;
  if (crawlInterval) {
    clearInterval(crawlInterval);
    crawlInterval = null;
  }
  chrome.runtime.sendMessage({ type: 'crawlStatus', status: 'stopped' });
}

// 爬取数据
async function crawlData(customSelector = null, ruleType = 'auto') {
  try {
    let items = [];
    let ruleName = '默认规则';
    
    if (ruleType === 'auto' && crawlerEngine) {
      // 使用自动匹配的规则
      items = crawlerEngine.crawlList(customSelector);
      ruleName = crawlerEngine.rule.name;
    } else if (customSelector) {
      // 使用自定义选择器
      const elements = document.querySelectorAll(customSelector);
      elements.forEach((element, index) => {
        const text = element.textContent?.trim() || '';
        const html = element.innerHTML || '';
        
        if (text) {
          items.push({
            index: index,
            text: text,
            html: html,
            selector: customSelector
          });
        }
      });
      ruleName = '自定义规则';
    } else {
      throw new Error('请提供CSS选择器或使用自动规则');
    }

    if (items.length > 0) {
      // 发送数据到background script保存
      chrome.runtime.sendMessage({
        type: 'saveData',
        data: {
          url: window.location.href,
          title: document.title,
          rule: ruleName,
          selector: customSelector || (crawlerEngine?.rule?.list?.itemSelector) || '',
          items: items,
          timestamp: Date.now()
        }
      });
      
      console.log(`已爬取 ${items.length} 条数据，规则: ${ruleName}`);
    } else {
      console.warn('未找到数据，请检查选择器或规则配置');
    }
  } catch (error) {
    console.error('爬取数据失败:', error);
    chrome.runtime.sendMessage({
      type: 'crawlError',
      error: error.message
    });
  }
}

// 页面加载完成后的初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('页面爬虫内容脚本已加载');
    initCrawler();
  });
} else {
  console.log('页面爬虫内容脚本已加载');
  initCrawler();
}

