# 页面爬虫服务端

服务端部分，提供MySQL数据库连接和API服务。

## 功能特性

- ✅ HTTP API服务（Express）
- ✅ MySQL数据库连接和管理
- ✅ 自动创建数据表
- ✅ 数据保存、查询、清空接口
- ✅ 数据库配置管理
- ✅ CORS支持

## 项目结构

```
server/
├── server.js              # 主服务器文件
├── check-server.js        # 服务器健康检查工具
├── db.config.json.example # 数据库配置示例
├── package.json           # 项目配置
└── README.md             # 说明文档
```

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

复制配置示例文件：
```bash
cp db.config.json.example db.config.json
```

编辑 `db.config.json`，填写你的MySQL配置：
```json
{
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": "your_password",
  "database": "page_spider"
}
```

### 3. 创建数据库

```sql
CREATE DATABASE IF NOT EXISTS page_spider CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API接口

### 健康检查
```
GET /api/health
```

### 测试数据库连接
```
POST /api/db/test
Body: { host, port, user, password, database }
```

### 保存数据库配置
```
POST /api/db/config
Body: { host, port, user, password, database }
```

### 获取数据库配置
```
GET /api/db/config
```

### 保存爬取数据
```
POST /api/data/save
Body: {
  url: string,
  title: string,
  selector: string,
  items: Array,
  timestamp: number
}
```

### 获取所有数据
```
GET /api/data/all
```

### 获取数据数量
```
GET /api/data/count
```

### 清空所有数据
```
DELETE /api/data/clear
```

## 数据表结构

服务器会自动创建 `crawl_data` 表：

```sql
CREATE TABLE crawl_data (
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
);
```

## 使用方法

### 启动服务器

```bash
npm start
```

### 检查服务器状态

```bash
npm run check
```

或在浏览器访问：`http://localhost:3000/api/health`

## 配置说明

### 端口配置

默认端口为 3000，可以在 `server.js` 中修改 `PORT` 常量。

### 数据库配置

配置文件 `db.config.json` 包含敏感信息，已添加到 `.gitignore`。

## 注意事项

1. 确保MySQL服务正在运行
2. 确保数据库已创建
3. 配置文件包含敏感信息，不要提交到版本控制
4. 服务器默认允许所有来源的CORS请求（仅用于本地开发）

## 许可证

MIT License

