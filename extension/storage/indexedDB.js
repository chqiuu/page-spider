// IndexedDB 存储操作
const CONSTANTS = (typeof self !== 'undefined' && self.CONSTANTS) 
  ? self.CONSTANTS 
  : (typeof window !== 'undefined' && window.CONSTANTS)
  ? window.CONSTANTS
  : require('../config/constants');
const { DB_NAME, DB_VERSION, STORE_NAME } = CONSTANTS;

let db = null;

// 初始化数据库
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('数据库打开失败:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('数据库打开成功');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      
      // 创建对象存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });
        
        // 创建索引
        objectStore.createIndex('url', 'url', { unique: false });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('selector', 'selector', { unique: false });
        
        console.log('数据库对象存储创建成功');
      }
    };
  });
}

// 保存数据到IndexedDB
async function saveData(data) {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    
    // 为每个爬取项创建单独的记录
    if (data.items && Array.isArray(data.items)) {
      const promises = data.items.map((item, index) => {
        const record = {
          url: data.url,
          title: data.title,
          selector: data.selector,
          content: item.text,
          html: item.html,
          index: item.index,
          timestamp: data.timestamp
        };
        return new Promise((res, rej) => {
          const request = objectStore.add(record);
          request.onsuccess = () => res(request.result);
          request.onerror = () => rej(request.error);
        });
      });
      
      Promise.all(promises)
        .then(() => {
          resolve({ success: true, count: data.items.length });
          // 通知popup更新
          chrome.runtime.sendMessage({ type: 'dataUpdated' });
        })
        .catch(reject);
    } else {
      // 单个数据项
      const request = objectStore.add(data);
      request.onsuccess = () => {
        resolve({ success: true, id: request.result });
        chrome.runtime.sendMessage({ type: 'dataUpdated' });
      };
      request.onerror = () => reject(request.error);
    }
  });
}

// 获取所有数据
async function getAllData() {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 获取数据数量
async function getDataCount() {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 清空所有数据
async function clearAllData() {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.clear();

    request.onsuccess = () => {
      resolve({ success: true });
      chrome.runtime.sendMessage({ type: 'dataUpdated' });
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// 导出（支持 Service Worker 和普通环境）
const IndexedDBStorage = {
  initDB,
  saveData,
  getAllData,
  getDataCount,
  clearAllData
};

if (typeof self !== 'undefined') {
  // Service Worker 环境
  self.IndexedDBStorage = IndexedDBStorage;
}
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.IndexedDBStorage = IndexedDBStorage;
}
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = IndexedDBStorage;
}

