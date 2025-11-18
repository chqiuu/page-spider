// 初始化popup界面
document.addEventListener('DOMContentLoaded', async () => {
  // 获取当前标签页信息
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab) {
    document.getElementById('currentUrl').textContent = tab.url || '-';
    document.getElementById('pageTitle').textContent = tab.title || '-';
    
    // 检测当前页面的规则
    await detectRule(tab.id);
  }

  // 更新数据统计
  await updateDataCount();

  // 绑定事件
  document.getElementById('startCrawl').addEventListener('click', startCrawl);
  document.getElementById('stopCrawl').addEventListener('click', stopCrawl);
  document.getElementById('viewData').addEventListener('click', viewData);
  document.getElementById('exportData').addEventListener('click', exportData);
  document.getElementById('clearData').addEventListener('click', clearData);
  document.getElementById('testDbConnection').addEventListener('click', testDbConnection);
  document.getElementById('saveDbConfig').addEventListener('click', saveDbConfig);
  document.getElementById('useMySQL').addEventListener('change', onStorageTypeChange);
  document.getElementById('crawlMode').addEventListener('change', onCrawlModeChange);
  
  // 初始化模式显示
  onCrawlModeChange();

  // 加载数据库配置
  await loadDbConfig();
  await checkDbStatus();
  
  // 加载存储类型设置
  const storage = await chrome.storage.local.get(['useMySQL']);
  if (storage.useMySQL !== undefined) {
    document.getElementById('useMySQL').checked = storage.useMySQL;
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
});

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
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const crawlModeEl = safeGetElement('crawlMode');
  const selectorEl = safeGetElement('selector');
  const delayEl = safeGetElement('delay');
  
  if (!crawlModeEl || !delayEl) return;
  
  const crawlMode = crawlModeEl.value;
  const selector = selectorEl ? selectorEl.value : '';
  const delay = parseInt(delayEl.value) || 2000;

  // 验证
  if (crawlMode === 'custom' && !selector) {
    alert('自定义模式下请输入CSS选择器');
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: 'startCrawl',
      selector: crawlMode === 'custom' ? selector : null,
      delay: delay,
      ruleType: crawlMode
    });
    updateStatus('运行中...');
    updateButtonStates(true);
  } catch (error) {
    console.error('启动爬取失败:', error);
    alert('启动爬取失败: ' + error.message);
  }
}

// 停止爬取
async function stopCrawl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: 'stopCrawl'
    });
    updateStatus('已停止');
    updateButtonStates(false);
  } catch (error) {
    console.error('停止爬取失败:', error);
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

