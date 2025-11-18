// crawl_data 表模型
const BaseModel = require('./BaseModel');

class CrawlDataModel extends BaseModel {
  constructor() {
    const tableName = 'crawl_data';
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        url VARCHAR(500) NOT NULL,
        title VARCHAR(500),
        selector VARCHAR(200),
        content TEXT,
        html LONGTEXT,
        item_index INT,
        timestamp BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_url (url(255)),
        INDEX idx_timestamp (timestamp),
        INDEX idx_selector (selector)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    super(tableName, createTableSQL);
  }

  // 保存爬取数据（支持单个或批量）
  async save(data) {
    let savedCount = 0;

    if (data.items && Array.isArray(data.items)) {
      // 批量插入
      const items = data.items.map(item => ({
        url: data.url,
        title: data.title,
        selector: data.selector,
        content: item.text || '',
        html: item.html || '',
        item_index: item.index || 0,
        timestamp: data.timestamp || Date.now()
      }));
      
      const result = await this.insertBatch(items);
      savedCount = result.affectedRows;
    } else {
      // 单个数据项
      await this.insert({
        url: data.url,
        title: data.title,
        selector: data.selector,
        content: data.content || '',
        html: data.html || '',
        item_index: data.index || 0,
        timestamp: data.timestamp || Date.now()
      });
      savedCount = 1;
    }

    return { count: savedCount };
  }

  // 获取所有数据（按时间倒序）
  async getAll() {
    return await this.findAll('timestamp DESC');
  }

  // 根据URL查询
  async findByUrl(url) {
    return await this.find({ url });
  }

  // 根据选择器查询
  async findBySelector(selector) {
    return await this.find({ selector }, 'timestamp DESC');
  }
}

module.exports = CrawlDataModel;

