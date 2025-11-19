# 页面爬虫服务端

服务端部分，提供MySQL数据库连接和API服务，主要用于存储和管理招标信息数据。

## 功能特性

- ✅ HTTP API服务（Express）
- ✅ MySQL数据库连接和管理（单例模式）
- ✅ 自动创建数据表
- ✅ 数据库配置管理（测试、保存、获取）
- ✅ 招标信息数据管理（保存、查询、更新）
- ✅ 批量数据操作支持
- ✅ CORS支持
- ✅ 优雅关闭处理

## 项目结构

```
server/
├── server.js              # 主服务器文件
├── check-server.js        # 服务器健康检查工具
├── db.config.json.example # 数据库配置示例
├── package.json           # 项目配置
├── README.md             # 说明文档
├── models/               # 数据模型
│   ├── BaseModel.js      # 基础模型类（提供CRUD操作）
│   ├── DatabaseManager.js # 数据库连接管理器（单例）
│   └── TenderInfoModel.js # 招标信息模型
├── routes/               # 路由模块
│   ├── dbRoutes.js       # 数据库配置路由
│   └── tenderRoutes.js   # 招标信息路由
└── utils/                # 工具函数
    └── initTables.js     # 初始化数据表工具
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
返回服务器状态和数据库连接状态。

**响应示例：**
```json
{
  "status": "ok",
  "dbConnected": true,
  "timestamp": 1234567890123
}
```

### 数据库配置接口

#### 测试数据库连接
```
POST /api/db/test
Content-Type: application/json

Body: {
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": "your_password",
  "database": "page_spider"
}
```

#### 保存数据库配置
```
POST /api/db/config
Content-Type: application/json

Body: {
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": "your_password",
  "database": "page_spider"
}
```
保存配置后会自动重新连接数据库并初始化数据表。

#### 获取数据库配置
```
GET /api/db/config
```
返回数据库配置（不包含密码）。

### 招标信息接口

#### 保存单条招标信息
```
POST /api/tender/save
Content-Type: application/json

Body: {
  "tenderId": "string",
  "flag": 0,
  "title": "string",
  "releaseTime": "2024-01-01 00:00:00",
  "url": "string",
  "provinceName": "string",
  "districtName": "string",
  "projectPurchaseWay": "string",
  "openTenderCode": "string",
  "budget": "string",
  "projectDirectoryName": "string",
  "buyerName": "string",
  "agentName": "string",
  "afficheType": "string",
  "expireTime": "2024-01-01 00:00:00"
}
```
使用 `REPLACE INTO`，如果 `tenderId` 已存在则更新，不存在则插入。

#### 批量保存招标信息
```
POST /api/tender/saveBatch
Content-Type: application/json

Body: {
  "items": [
    { "tenderId": "...", "title": "...", ... },
    { "tenderId": "...", "title": "...", ... }
  ]
}
```
或直接传递数组：
```
POST /api/tender/saveBatch
Content-Type: application/json

Body: [
  { "tenderId": "...", "title": "...", ... },
  { "tenderId": "...", "title": "...", ... }
]
```

#### 获取所有招标信息
```
GET /api/tender/all
```
按发布时间和创建时间倒序返回所有数据。

#### 根据招标编号查询
```
GET /api/tender/byNo/:tenderNo
```
根据 `openTenderCode`（项目编号）查询。

#### 根据标志查询
```
GET /api/tender/byFlag/:flag
```
根据 `flag` 字段查询，按发布时间倒序返回。

#### 查询即将截止的招标
```
GET /api/tender/upcoming?days=7
```
查询在指定天数内即将截止的招标（默认7天）。

#### 更新招标标志
```
PUT /api/tender/:tenderId/flag
Content-Type: application/json

Body: {
  "flag": 1
}
```

#### 获取招标信息数量
```
GET /api/tender/count
GET /api/tender/count?flag=1
```
返回总数或按条件统计的数量。

## 数据表结构

服务器会自动创建 `tender_info` 表：

```sql
CREATE TABLE IF NOT EXISTS tender_info (
  `tender_id` varchar(50) NOT NULL COMMENT '唯一ID',
  `flag` tinyint DEFAULT '0' COMMENT '标志',
  `title` varchar(200) DEFAULT NULL COMMENT '标题',
  `release_time` datetime DEFAULT NULL COMMENT '发布时间',
  `url` varchar(200) DEFAULT NULL COMMENT '详情URL',
  `province_name` varchar(20) DEFAULT NULL COMMENT '省份',
  `district_name` varchar(20) DEFAULT NULL COMMENT '区县',
  `project_purchase_way` varchar(20) DEFAULT NULL COMMENT '招标方式',
  `open_tender_code` varchar(255) DEFAULT NULL COMMENT '项目编号',
  `budget` varchar(255) DEFAULT NULL COMMENT '预算金额',
  `project_directory_name` varchar(255) DEFAULT NULL COMMENT '项目目录名称',
  `buyer_name` varchar(100) DEFAULT NULL COMMENT '采购人',
  `agent_name` varchar(100) DEFAULT NULL COMMENT '代理机构',
  `affiche_type` varchar(255) DEFAULT NULL COMMENT '公告类型',
  `expire_time` datetime DEFAULT NULL COMMENT '截至时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`tender_id`),
  KEY `index_title` (`title`),
  KEY `index_release_time` (`release_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='政府采购信息';
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

### 开发模式

```bash
npm run dev
```

## 配置说明

### 端口配置

默认端口为 3000，可以在 `server.js` 中修改 `PORT` 常量。

### 数据库配置

配置文件 `db.config.json` 包含敏感信息，已添加到 `.gitignore`。

配置项说明：
- `host`: MySQL服务器地址
- `port`: MySQL端口（默认3306）
- `user`: 数据库用户名
- `password`: 数据库密码
- `database`: 数据库名称

### CORS配置

服务器默认允许所有来源的CORS请求（仅用于本地开发）。如需限制，可在 `server.js` 中修改CORS配置。

## 技术架构

### 数据库连接管理

使用单例模式的 `DatabaseManager` 管理数据库连接：
- 自动加载配置文件
- 连接池管理
- 优雅关闭处理

### 数据模型

基于 `BaseModel` 基类，提供统一的CRUD操作：
- `insert` / `insertBatch` - 插入数据
- `replace` / `replaceBatch` - 替换数据（存在则更新，不存在则插入）
- `find` / `findAll` / `findById` - 查询数据
- `update` - 更新数据
- `delete` - 删除数据
- `count` - 统计数量
- `truncate` - 清空表

### 路由模块化

路由按功能模块划分：
- `dbRoutes` - 数据库配置相关
- `tenderRoutes` - 招标信息相关

## 注意事项

1. 确保MySQL服务正在运行
2. 确保数据库已创建
3. 配置文件包含敏感信息，不要提交到版本控制
4. 服务器默认允许所有来源的CORS请求（仅用于本地开发）
5. 数据保存使用 `REPLACE INTO`，相同 `tender_id` 的数据会被更新
6. 批量操作每次最多处理1000条数据

## 依赖包

- `express`: ^4.18.2 - Web框架
- `mysql2`: ^3.6.5 - MySQL数据库驱动
- `cors`: ^2.8.5 - CORS中间件

## 许可证

MIT License
