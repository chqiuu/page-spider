// 数据库配置服务
const CONSTANTS = (typeof self !== 'undefined' && self.CONSTANTS) 
  ? self.CONSTANTS 
  : (typeof window !== 'undefined' && window.CONSTANTS)
  ? window.CONSTANTS
  : require('../config/constants');
const { SERVER_URL } = CONSTANTS;

// 测试数据库连接
async function testDbConnection(config) {
  try {
    const response = await fetch(`${SERVER_URL}/api/db/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      message: '无法连接到本地服务器，请确保服务器已启动 (http://localhost:3000)'
    };
  }
}

// 保存数据库配置
async function saveDbConfig(config) {
  try {
    const response = await fetch(`${SERVER_URL}/api/db/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      message: '无法连接到本地服务器，请确保服务器已启动 (http://localhost:3000)'
    };
  }
}

// 获取数据库配置
async function getDbConfig() {
  try {
    const response = await fetch(`${SERVER_URL}/api/db/config`);
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      message: '无法连接到本地服务器'
    };
  }
}

// 检查数据库状态
async function checkDbStatus() {
  try {
    const response = await fetch(`${SERVER_URL}/api/health`);
    const result = await response.json();
    return {
      connected: result.dbConnected === true,
      serverRunning: true
    };
  } catch (error) {
    return {
      connected: false,
      serverRunning: false
    };
  }
}

// 导出（支持 Service Worker 和普通环境）
const DbService = {
  testDbConnection,
  saveDbConfig,
  getDbConfig,
  checkDbStatus
};

if (typeof self !== 'undefined') {
  // Service Worker 环境
  self.DbService = DbService;
}
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.DbService = DbService;
}
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = DbService;
}

