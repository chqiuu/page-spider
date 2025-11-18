// MySQL 存储操作
const CONSTANTS = (typeof self !== 'undefined' && self.CONSTANTS) 
  ? self.CONSTANTS 
  : (typeof window !== 'undefined' && window.CONSTANTS)
  ? window.CONSTANTS
  : require('../config/constants');
const { SERVER_URL } = CONSTANTS;

// 保存数据到MySQL
async function saveData(data, url) {
  try {
    const response = await fetch(`${SERVER_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (result.success) {
      chrome.runtime.sendMessage({ type: 'dataUpdated' });
      return result;
    } else {
      throw new Error(result.message || '保存失败');
    }
  } catch (error) {
    console.error('保存到MySQL失败:', error);
    throw error;
  }
}

// 获取所有数据
async function getAllData(url) {
  try {
    const response = await fetch(`${SERVER_URL}${url}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('从MySQL获取数据失败:', error);
    throw error;
  }
}

// 获取数据数量
async function getDataCount(url) {
  try {
    const response = await fetch(`${SERVER_URL}${url}`);
    const count = await response.json();
    return typeof count === 'number' ? count : 0;
  } catch (error) {
    console.error('从MySQL获取数据数量失败:', error);
    throw error;
  }
}

// 清空所有数据
async function clearAllData(url) {
  try {
    const response = await fetch(`${SERVER_URL}${url}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    if (result.success) {
      chrome.runtime.sendMessage({ type: 'dataUpdated' });
      return result;
    } else {
      throw new Error(result.message || '清空失败');
    }
  } catch (error) {
    console.error('清空MySQL数据失败:', error);
    throw error;
  }
}

// 导出（支持 Service Worker 和普通环境）
const MySQLStorage = {
  saveData,
  getAllData,
  getDataCount,
  clearAllData
};

if (typeof self !== 'undefined') {
  // Service Worker 环境
  self.MySQLStorage = MySQLStorage;
}
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.MySQLStorage = MySQLStorage;
}
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = MySQLStorage;
}

