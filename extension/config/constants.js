// 常量配置
const DB_NAME = 'PageSpiderDB';
const DB_VERSION = 1;
const STORE_NAME = 'crawlData';
const SERVER_URL = 'http://localhost:3000';

// 导出（支持 Service Worker 和普通环境）
const CONSTANTS = { DB_NAME, DB_VERSION, STORE_NAME, SERVER_URL };

if (typeof self !== 'undefined') {
  // Service Worker 环境
  self.CONSTANTS = CONSTANTS;
}
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.CONSTANTS = CONSTANTS;
}
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = CONSTANTS;
}

