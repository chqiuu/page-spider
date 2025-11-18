// ====== 脚本开始执行 ======
console.log('🚀 popup.js 文件已加载！', new Date().toISOString());
console.log('当前 URL:', window.location.href);
console.log('document:', document);
console.log('document.readyState:', document.readyState);

// 初始化popup界面
async function initPopup() {
  console.log('=== initPopup 函数被调用 ===', new Date().toISOString());
  console.log('document.readyState:', document.readyState);
  console.log('document.body:', document.body);
  
  try {
    // 获取当前标签页信息
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
      const urlEl = document.getElementById('currentUrl');
      const titleEl = document.getElementById('pageTitle');
      if (urlEl) urlEl.textContent = tab.url || '-';
      if (titleEl) titleEl.textContent = tab.title || '-';
      
      // 检测当前页面的规则
      await detectRule(tab.id);
    } else {
      const urlEl = document.getElementById('currentUrl');
      const titleEl = document.getElementById('pageTitle');
      if (urlEl) urlEl.textContent = '无法获取标签页信息';
      if (titleEl) titleEl.textContent = '-';
    }
  } catch (error) {
    console.error('获取标签页信息失败:', error);
    const urlEl = document.getElementById('currentUrl');
    const titleEl = document.getElementById('pageTitle');
    if (urlEl) urlEl.textContent = '获取失败';
    if (titleEl) titleEl.textContent = '-';
  }

  // 更新数据统计
  try {
    await updateDataCount();
  } catch (error) {
    console.error('更新数据统计失败:', error);
  }

  // 绑定事件 - 确保总是绑定，即使前面的步骤失败
  console.log('准备调用 bindEvents()...');
  bindEvents();
  console.log('bindEvents() 调用完成');

  // 初始化模式显示
  onCrawlModeChange();

  // 加载数据库配置
  try {
    await loadDbConfig();
    await checkDbStatus();
  } catch (error) {
    console.error('加载数据库配置失败:', error);
  }
  
  // 加载存储类型设置
  try {
    const storage = await chrome.storage.local.get(['useMySQL']);
    if (storage.useMySQL !== undefined) {
      const useMySQLEl = document.getElementById('useMySQL');
      if (useMySQLEl) {
        useMySQLEl.checked = storage.useMySQL;
      }
    }
  } catch (error) {
    console.error('加载存储类型设置失败:', error);
  }

  // 监听爬取状态
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'crawlStatus') {
      updateStatus(message.status);
      updateButtonStates(message.status === 'running');
    }
    if (message.type === 'dataUpdated') {
      updateDataCount();
    }
    if (message.type === 'ruleDetected') {
      // 更新规则显示
      const ruleBadge = document.getElementById('matchedRule');
      if (ruleBadge) {
        ruleBadge.textContent = message.rule.name;
        ruleBadge.className = 'rule-badge';
        if (message.rule.type === 'list') {
          ruleBadge.classList.add('auto');
        } else {
          ruleBadge.classList.add('default');
        }
      }
    }
  });
}

// 绑定所有事件监听器
function bindEvents() {
  console.log('=== bindEvents 函数被调用 ===', new Date().toISOString());
  console.log('document.readyState:', document.readyState);
  console.log('document.body:', document.body);
  
  const startCrawlBtn = document.getElementById('startCrawl');
  console.log('查找 startCrawl 按钮，结果:', startCrawlBtn);
  
  const stopCrawlBtn = document.getElementById('stopCrawl');
  const viewDataBtn = document.getElementById('viewData');
  const exportDataBtn = document.getElementById('exportData');
  const clearDataBtn = document.getElementById('clearData');
  const testDbConnectionBtn = document.getElementById('testDbConnection');
  const saveDbConfigBtn = document.getElementById('saveDbConfig');
  const useMySQLEl = document.getElementById('useMySQL');
  const crawlModeEl = document.getElementById('crawlMode');

  if (startCrawlBtn) {
    console.log('找到 startCrawl 按钮，绑定点击事件');
    startCrawlBtn.addEventListener('click', (e) => {
      console.log('=== startCrawl 按钮被点击 ===', e);
      e.preventDefault();
      e.stopPropagation();
      startCrawl();
    });
    console.log('startCrawl 按钮事件已绑定');
  } else {
    console.error('找不到 startCrawl 按钮');
  }

  if (stopCrawlBtn) {
    stopCrawlBtn.addEventListener('click', stopCrawl);
  } else {
    console.error('找不到 stopCrawl 按钮');
  }

  if (viewDataBtn) {
    viewDataBtn.addEventListener('click', viewData);
  } else {
    console.error('找不到 viewData 按钮');
  }

  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', exportData);
  } else {
    console.error('找不到 exportData 按钮');
  }

  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', clearData);
  } else {
    console.error('找不到 clearData 按钮');
  }

  if (testDbConnectionBtn) {
    testDbConnectionBtn.addEventListener('click', testDbConnection);
  } else {
    console.error('找不到 testDbConnection 按钮');
  }

  if (saveDbConfigBtn) {
    saveDbConfigBtn.addEventListener('click', saveDbConfig);
  } else {
    console.error('找不到 saveDbConfig 按钮');
  }

  if (useMySQLEl) {
    useMySQLEl.addEventListener('change', onStorageTypeChange);
  } else {
    console.error('找不到 useMySQL 复选框');
  }

  if (crawlModeEl) {
    crawlModeEl.addEventListener('change', onCrawlModeChange);
  } else {
    console.error('找不到 crawlMode 选择框');
  }
}

// 页面加载完成后初始化
console.log('=== popup.js 脚本开始执行 ===', new Date().toISOString());
console.log('document.readyState:', document.readyState);
console.log('document.body:', document.body);

if (document.readyState === 'loading') {
  console.log('DOM 正在加载，等待 DOMContentLoaded 事件...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded 事件触发');
    initPopup();
  });
} else {
  // DOM 已经加载完成，直接初始化
  console.log('DOM 已加载完成，直接初始化');
  initPopup();
}

// 检测规则
async function detectRule(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'getRuleInfo'
    });
    
    if (response && response.success && response.rule) {
      const rule = response.rule;
      const ruleBadge = safeGetElement('matchedRule');
      if (ruleBadge) {
        ruleBadge.textContent = rule.name;
        
        // 根据规则类型设置样式
        ruleBadge.className = 'rule-badge';
        if (rule.type === 'list') {
          ruleBadge.classList.add('auto');
        } else if (rule.type === 'custom') {
          ruleBadge.classList.add('custom');
        } else {
          ruleBadge.classList.add('default');
        }
      }
      
      // 如果是自动规则，默认选择自动模式
      if (rule.type === 'list' && rule.name !== '默认规则') {
        const crawlModeEl = safeGetElement('crawlMode');
        if (crawlModeEl) {
          crawlModeEl.value = 'auto';
          onCrawlModeChange();
        }
      }
    } else {
      const ruleBadge = safeGetElement('matchedRule');
      if (ruleBadge) {
        ruleBadge.textContent = '未匹配';
        ruleBadge.className = 'rule-badge default';
      }
    }
  } catch (error) {
    console.error('检测规则失败:', error);
    const ruleBadge = safeGetElement('matchedRule');
    if (ruleBadge) {
      ruleBadge.textContent = '检测失败';
      ruleBadge.className = 'rule-badge default';
    }
  }
}

// 爬取模式改变
function onCrawlModeChange() {
  const crawlModeEl = safeGetElement('crawlMode');
  const selectorGroup = safeGetElement('selectorGroup');
  
  if (!crawlModeEl || !selectorGroup) return;
  
  const mode = crawlModeEl.value;
  if (mode === 'auto') {
    selectorGroup.style.display = 'none';
  } else {
    selectorGroup.style.display = 'block';
  }
}

// 开始爬取
async function startCrawl() {
  console.log('=== startCrawl 函数被调用 ===', new Date().toISOString());
  
  try {
    console.log('查询当前标签页...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('查询结果:', tab);
    
    if (!tab || !tab.id) {
      alert('无法获取当前标签页信息');
      console.error('无法获取标签页:', tab);
      return;
    }
    
    console.log('当前标签页 ID:', tab.id, 'URL:', tab.url);
    
    const crawlModeEl = safeGetElement('crawlMode');
    const selectorEl = safeGetElement('selector');
    const delayEl = safeGetElement('delay');
    
    if (!crawlModeEl || !delayEl) {
      console.error('找不到必要的元素:', { crawlModeEl, delayEl });
      return;
    }
    
    const crawlMode = crawlModeEl.value;
    const selector = selectorEl ? selectorEl.value : '';
    const delay = parseInt(delayEl.value) || 2000;

    // 验证
    if (crawlMode === 'custom' && !selector) {
      alert('自定义模式下请输入CSS选择器');
      return;
    }

    const message = {
      type: 'startCrawl',
      selector: crawlMode === 'custom' ? selector : null,
      delay: delay,
      ruleType: crawlMode
    };
    
    console.log('准备发送消息到 content script:', message);
    
    // 检查是否是特殊页面（无法注入 content script）
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:'))) {
      alert('当前页面不支持内容脚本注入，请在其他网页上使用此功能');
      return;
    }
    
    // 先检查 content script 是否已加载
    console.log('检查 content script 是否已加载...');
    let contentScriptReady = false;
    
    try {
      const pingResponse = await chrome.tabs.sendMessage(tab.id, { type: 'ping' });
      console.log('Ping 响应:', pingResponse);
      contentScriptReady = true;
    } catch (pingError) {
      console.warn('Content script 未响应 ping，错误:', pingError.message);
      console.log('尝试手动注入 content script...');
      
      // 尝试手动注入所有需要的脚本
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [
            'rules/rules.js',
            'rules/matcher.js',
            'crawler/CrawlerEngine.js',
            'content.js'
          ]
        });
        console.log('已手动注入 content scripts');
        
        // 等待脚本初始化
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 再次尝试 ping
        try {
          const retryPing = await chrome.tabs.sendMessage(tab.id, { type: 'ping' });
          console.log('重试 ping 成功:', retryPing);
          contentScriptReady = true;
        } catch (retryError) {
          console.error('重试 ping 仍然失败:', retryError);
          throw new Error('无法与 content script 建立连接。请刷新页面后重试。');
        }
      } catch (injectError) {
        console.error('注入脚本失败:', injectError);
        throw new Error('无法注入 content script: ' + injectError.message);
      }
    }
    
    if (!contentScriptReady) {
      throw new Error('Content script 未准备好');
    }
    
    // 发送实际消息
    console.log('=== 准备发送 startCrawl 消息 ===');
    console.log('消息内容:', JSON.stringify(message, null, 2));
    console.log('目标标签页 ID:', tab.id);
    
    let response = null;
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        console.log(`尝试发送消息 (剩余 ${retries} 次)...`);
        response = await chrome.tabs.sendMessage(tab.id, message);
        console.log('=== 收到 content script 响应 ===', response);
        break;
      } catch (error) {
        lastError = error;
        retries--;
        console.error(`发送消息失败，剩余重试次数: ${retries}`);
        console.error('错误对象:', error);
        console.error('错误详情:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        if (retries > 0) {
          console.log('等待 500ms 后重试...');
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    if (!response && lastError) {
      throw lastError;
    }
    
    updateStatus('运行中...');
    updateButtonStates(true);
  } catch (error) {
    console.error('启动爬取失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    alert('启动爬取失败: ' + error.message + '\n请检查控制台获取更多信息');
  }
}

// 停止爬取
async function stopCrawl() {
  console.log('stopCrawl 函数被调用');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      console.error('无法获取标签页');
      return;
    }
    
    console.log('发送停止消息到标签页:', tab.id);
    
    await chrome.tabs.sendMessage(tab.id, {
      type: 'stopCrawl'
    });
    
    updateStatus('已停止');
    updateButtonStates(false);
  } catch (error) {
    console.error('停止爬取失败:', error);
    alert('停止爬取失败: ' + error.message);
  }
}

// 查看数据
async function viewData() {
  const data = await chrome.runtime.sendMessage({ type: 'getAllData' });
  
  if (data && data.length > 0) {
    const dataWindow = window.open('', '_blank');
    dataWindow.document.write(`
      <html>
        <head>
          <title>爬取数据</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #667eea; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>爬取数据 (共 ${data.length} 条)</h1>
          <table>
            <tr>
              <th>ID</th>
              <th>URL</th>
              <th>标题</th>
              <th>内容</th>
              <th>时间</th>
            </tr>
            ${data.map(item => `
              <tr>
                <td>${item.id}</td>
                <td>${item.url}</td>
                <td>${item.title}</td>
                <td>${item.content.substring(0, 100)}...</td>
                <td>${new Date(item.timestamp).toLocaleString('zh-CN')}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `);
  } else {
    alert('暂无数据');
  }
}

// 导出数据
async function exportData() {
  const data = await chrome.runtime.sendMessage({ type: 'getAllData' });
  
  if (!data || data.length === 0) {
    alert('暂无数据可导出');
    return;
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crawl_data_${new Date().getTime()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 清空数据
async function clearData() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
    await chrome.runtime.sendMessage({ type: 'clearAllData' });
    updateDataCount();
    alert('数据已清空');
  }
}

// 安全地获取元素
function safeGetElement(id) {
  try {
    return document.getElementById(id);
  } catch (error) {
    return null;
  }
}

// 更新按钮状态
function updateButtonStates(isRunning) {
  const startBtn = safeGetElement('startCrawl');
  const stopBtn = safeGetElement('stopCrawl');
  
  if (startBtn) {
    startBtn.disabled = isRunning;
  }
  if (stopBtn) {
    stopBtn.disabled = !isRunning;
  }
}

// 更新状态
function updateStatus(status) {
  const statusEl = safeGetElement('status');
  if (statusEl) {
    statusEl.textContent = status;
  }
}

// 更新数据统计
async function updateDataCount() {
  const count = await chrome.runtime.sendMessage({ type: 'getDataCount' });
  const dataCountEl = safeGetElement('dataCount');
  if (dataCountEl) {
    dataCountEl.textContent = count || 0;
  }
}

// 测试数据库连接
async function testDbConnection() {
  const dbHostEl = safeGetElement('dbHost');
  const dbPortEl = safeGetElement('dbPort');
  const dbUserEl = safeGetElement('dbUser');
  const dbPasswordEl = safeGetElement('dbPassword');
  const dbDatabaseEl = safeGetElement('dbDatabase');
  
  if (!dbHostEl || !dbUserEl || !dbDatabaseEl) return;
  
  const config = {
    host: dbHostEl.value,
    port: parseInt(dbPortEl ? dbPortEl.value : '3306') || 3306,
    user: dbUserEl.value,
    password: dbPasswordEl ? dbPasswordEl.value : '',
    database: dbDatabaseEl.value
  };

  if (!config.host || !config.user || !config.database) {
    alert('请填写完整的数据库配置信息');
    return;
  }

  const btn = safeGetElement('testDbConnection');
  if (!btn) return;
  
  btn.disabled = true;
  btn.textContent = '测试中...';

  try {
    const result = await chrome.runtime.sendMessage({
      type: 'testDbConnection',
      config: config
    });

    if (result.success) {
      alert('数据库连接成功！');
      updateDbStatus(true);
    } else {
      alert('数据库连接失败: ' + result.message);
      updateDbStatus(false);
    }
  } catch (error) {
    alert('测试连接失败: ' + error.message);
    updateDbStatus(false);
  } finally {
    btn.disabled = false;
    btn.textContent = '测试连接';
  }
}

// 保存数据库配置
async function saveDbConfig() {
  const dbHostEl = safeGetElement('dbHost');
  const dbPortEl = safeGetElement('dbPort');
  const dbUserEl = safeGetElement('dbUser');
  const dbPasswordEl = safeGetElement('dbPassword');
  const dbDatabaseEl = safeGetElement('dbDatabase');
  
  if (!dbHostEl || !dbUserEl || !dbDatabaseEl) return;
  
  const config = {
    host: dbHostEl.value,
    port: parseInt(dbPortEl ? dbPortEl.value : '3306') || 3306,
    user: dbUserEl.value,
    password: dbPasswordEl ? dbPasswordEl.value : '',
    database: dbDatabaseEl.value
  };

  if (!config.host || !config.user || !config.database) {
    alert('请填写完整的数据库配置信息');
    return;
  }

  const btn = safeGetElement('saveDbConfig');
  if (!btn) return;
  
  btn.disabled = true;
  btn.textContent = '保存中...';

  try {
    const result = await chrome.runtime.sendMessage({
      type: 'saveDbConfig',
      config: config
    });

    if (result.success) {
      alert('配置保存成功！');
      await checkDbStatus();
    } else {
      alert('配置保存失败: ' + result.message);
    }
  } catch (error) {
    alert('保存配置失败: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '保存配置';
  }
}

// 加载数据库配置
async function loadDbConfig() {
  try {
    const result = await chrome.runtime.sendMessage({ type: 'getDbConfig' });
    if (result.success && result.config) {
      const config = result.config;
      const dbHostEl = safeGetElement('dbHost');
      const dbPortEl = safeGetElement('dbPort');
      const dbUserEl = safeGetElement('dbUser');
      const dbDatabaseEl = safeGetElement('dbDatabase');
      
      if (dbHostEl) dbHostEl.value = config.host || 'localhost';
      if (dbPortEl) dbPortEl.value = config.port || 3306;
      if (dbUserEl) dbUserEl.value = config.user || 'root';
      if (dbDatabaseEl) dbDatabaseEl.value = config.database || 'page_spider';
      // 密码不加载，需要重新输入
    }
  } catch (error) {
    console.error('加载配置失败:', error);
  }
}

// 检查数据库状态
async function checkDbStatus() {
  try {
    const result = await chrome.runtime.sendMessage({ type: 'checkDbStatus' });
    if (result && result.connected) {
      updateDbStatus(true);
    } else {
      updateDbStatus(false);
    }
  } catch (error) {
    updateDbStatus(false);
  }
}

// 更新数据库状态显示
function updateDbStatus(connected) {
  const statusText = safeGetElement('dbStatusText');
  if (statusText) {
    if (connected) {
      statusText.textContent = '已连接';
      statusText.className = 'connected';
    } else {
      statusText.textContent = '未连接';
      statusText.className = 'disconnected';
    }
  }
}

// 存储类型改变
async function onStorageTypeChange() {
  const useMySQLEl = safeGetElement('useMySQL');
  if (useMySQLEl) {
    await chrome.storage.local.set({ useMySQL: useMySQLEl.checked });
    await updateDataCount();
  }
}

