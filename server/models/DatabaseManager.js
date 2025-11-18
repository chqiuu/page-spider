// 数据库连接管理器（单例模式）
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

class DatabaseManager {
  constructor() {
    this.dbConfig = null;
    this.dbConnection = null;
  }

  // 加载数据库配置
  loadDbConfig() {
    const configPath = path.join(__dirname, '..', 'db.config.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      this.dbConfig = JSON.parse(configData);
      return true;
    }
    return false;
  }

  // 连接数据库
  async connect() {
    if (!this.dbConfig) {
      if (!this.loadDbConfig()) {
        throw new Error('数据库配置不存在，请先配置数据库');
      }
    }

    if (this.dbConnection) {
      return this.dbConnection;
    }

    try {
      this.dbConnection = await mysql.createConnection({
        host: this.dbConfig.host || 'localhost',
        port: this.dbConfig.port || 3306,
        user: this.dbConfig.user || 'root',
        password: this.dbConfig.password || '123456',
        database: this.dbConfig.database || 'spider',
        charset: 'utf8mb4'
      });
      
      console.log('MySQL数据库连接成功');
      return this.dbConnection;
    } catch (error) {
      console.error('数据库连接失败:', error.message);
      throw error;
    }
  }

  // 获取数据库连接
  async getConnection() {
    if (!this.dbConnection) {
      await this.connect();
    }
    return this.dbConnection;
  }

  // 保存数据库配置
  saveDbConfig(config) {
    const configPath = path.join(__dirname, '..', 'db.config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    this.dbConfig = config;
  }

  // 更新配置并重新连接
  async updateConfig(config) {
    this.saveDbConfig(config);
    if (this.dbConnection) {
      await this.dbConnection.end();
      this.dbConnection = null;
    }
    await this.connect();
  }

  // 测试数据库连接
  async testConnection(config) {
    const testConnection = await mysql.createConnection({
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.user || 'root',
      password: config.password || '',
      database: config.database || 'page_spider'
    });
    
    await testConnection.end();
    return true;
  }

  // 关闭数据库连接
  async close() {
    if (this.dbConnection) {
      await this.dbConnection.end();
      this.dbConnection = null;
      console.log('数据库连接已关闭');
    }
  }

  // 获取配置（不包含密码）
  getSafeConfig() {
    if (this.dbConfig) {
      const safeConfig = { ...this.dbConfig };
      delete safeConfig.password;
      return safeConfig;
    }
    return null;
  }

  // 检查是否已连接
  isConnected() {
    return this.dbConnection !== null;
  }
}

// 导出单例
module.exports = new DatabaseManager();

