// 后台服务脚本 - 主入口文件
// 导入模块（使用 importScripts 在 Service Worker 中加载）
importScripts(
  'config/constants.js',
  'storage/indexedDB.js',
  'storage/mysql.js',
  'services/dataService.js',
  'services/dbService.js'
);

// 使用全局变量访问模块（Service Worker 中使用 self）
const IndexedDBStorage = self.IndexedDBStorage;
const DataService = self.DataService;
const DbService = self.DbService;

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'saveData':
          const result = await DataService.saveData(message.data);
          sendResponse(result);
          break;
        case 'saveTenderData':
          const resultTender = await DataService.saveTenderData(message.data);
          sendResponse(resultTender);
          break;
        case 'getAllData':
          const data = await DataService.getAllData();
          sendResponse(data);
          break;
        
        case 'getDataCount':
          const count = await DataService.getDataCount();
          sendResponse(count);
          break;
        
        case 'clearAllData':
          const clearResult = await DataService.clearAllData();
          sendResponse(clearResult);
          break;
        
        case 'testDbConnection':
          const testResult = await DbService.testDbConnection(message.config);
          sendResponse(testResult);
          break;
        
        case 'saveDbConfig':
          const saveConfigResult = await DbService.saveDbConfig(message.config);
          sendResponse(saveConfigResult);
          break;
        
        case 'getDbConfig':
          const getConfigResult = await DbService.getDbConfig();
          sendResponse(getConfigResult);
          break;
        
        case 'checkDbStatus':
          const statusResult = await DbService.checkDbStatus();
          sendResponse(statusResult);
          break;
        
        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('处理消息失败:', error);
      sendResponse({ error: error.message });
    }
  })();
  
  return true; // 保持消息通道开放
});

// 扩展安装时初始化数据库
chrome.runtime.onInstalled.addListener(() => {
  console.log('扩展已安装，初始化数据库...');
  IndexedDBStorage.initDB().catch(console.error);
});

// 扩展启动时初始化数据库
IndexedDBStorage.initDB().catch(console.error);

