// 数据服务 - 统一的数据操作接口
const IndexedDBStorage = (typeof self !== 'undefined' && self.IndexedDBStorage) 
  ? self.IndexedDBStorage 
  : (typeof window !== 'undefined' && window.IndexedDBStorage)
  ? window.IndexedDBStorage
  : require('../storage/indexedDB');
const MySQLStorage = (typeof self !== 'undefined' && self.MySQLStorage) 
  ? self.MySQLStorage 
  : (typeof window !== 'undefined' && window.MySQLStorage)
  ? window.MySQLStorage
  : require('../storage/mysql');

// 检查是否使用MySQL
async function shouldUseMySQL() {
  const result = await chrome.storage.local.get(['useMySQL']);
  return result.useMySQL === true;
}

// 保存数据（自动选择存储方式）
async function saveData(data) {
  const useMySQL = await shouldUseMySQL();
  
  if (useMySQL) {
    // 使用MySQL
    try {
      return await MySQLStorage.saveData(data, '/api/data/save');
    } catch (error) {
      console.error('MySQL保存失败，尝试使用IndexedDB:', error);
      // 如果MySQL失败，回退到IndexedDB
      return await IndexedDBStorage.saveData(data);
    }
  } else {
    // 使用IndexedDB
    return await IndexedDBStorage.saveData(data);
  }
}

// 获取所有数据
async function getAllData() {
  const useMySQL = await shouldUseMySQL();
  
  if (useMySQL) {
    try {
      return await MySQLStorage.getAllData();
    } catch (error) {
      console.error('从MySQL获取数据失败，回退到IndexedDB:', error);
      // 回退到IndexedDB
      return await IndexedDBStorage.getAllData();
    }
  } else {
    return await IndexedDBStorage.getAllData();
  }
}

// 获取数据数量
async function getDataCount() {
  const useMySQL = await shouldUseMySQL();
  
  if (useMySQL) {
    try {
      return await MySQLStorage.getDataCount();
    } catch (error) {
      console.error('从MySQL获取数据数量失败，回退到IndexedDB:', error);
      // 回退到IndexedDB
      return await IndexedDBStorage.getDataCount();
    }
  } else {
    return await IndexedDBStorage.getDataCount();
  }
}

// 清空所有数据
async function clearAllData() {
  const useMySQL = await shouldUseMySQL();
  
  if (useMySQL) {
    try {
      return await MySQLStorage.clearAllData();
    } catch (error) {
      console.error('清空MySQL数据失败，回退到IndexedDB:', error);
      // 回退到IndexedDB
      return await IndexedDBStorage.clearAllData();
    }
  } else {
    return await IndexedDBStorage.clearAllData();
  }
}

// 导出（支持 Service Worker 和普通环境）
const DataService = {
  saveData,
  getAllData,
  getDataCount,
  clearAllData
};

if (typeof self !== 'undefined') {
  // Service Worker 环境
  self.DataService = DataService;
}
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.DataService = DataService;
}
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = DataService;
}

