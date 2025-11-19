# 页面爬虫工具

一个基于浏览器扩展的网页爬虫工具，专门用于爬取政府采购网站（search.ccgp.gov.cn）的招标信息。通过浏览器原生方式访问网页，有效规避反爬虫机制，支持自动分页爬取和数据批量保存到MySQL数据库。

## 项目简介

本项目由浏览器扩展和服务端两部分组成，用于自动化爬取和存储政府采购网站的招标信息：

- **浏览器扩展**：在目标网页中运行，自动提取招标信息，支持自动分页爬取
- **服务端**：提供MySQL数据库存储和RESTful API服务，支持数据查询和管理

## 功能特性

### 浏览器扩展

- ✅ 支持从 `search.ccgp.gov.cn` 网站爬取招标信息列表
- ✅ 自动分页爬取（循环爬取所有分页）
- ✅ 浮动控制面板（在页面上直接操作）
- ✅ Popup弹窗控制界面
- ✅ 实时显示爬取状态、进度和日志
- ✅ 批量保存数据到后端MySQL数据库
- ✅ 支持自定义后端API地址
- ✅ 支持停止爬取操作
- ✅ 自动提取标题、链接、发布时间、采购人、代理机构等信息

### 服务端

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
page-spider/
├── extension/              # 浏览器扩展项目
│   ├── manifest.json      # 扩展配置文件（Manifest V3）
│   ├── background.js      # 后台服务脚本（Service Worker）
│   ├── content.js         # 内容脚本（爬取逻辑和浮动面板）
│   ├── content.css        # 内容脚本样式
│   ├── popup.html         # 弹窗HTML
│   ├── popup.css          # 弹窗样式
│   ├── popup.js           # 弹窗逻辑
│   ├── icons/             # 图标文件
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   ├── icon128.png
│   │   └── icon256.png
│   ├── README.md          # 扩展说明文档
│   └── QUICKSTART.md      # 快速开始指南
│
├── server/                # 服务端项目
│   ├── server.js          # 主服务器文件
│   ├── check-server.js    # 服务器健康检查工具
│   ├── db.config.json.example # 数据库配置示例
│   ├── package.json       # 项目配置
│   ├── README.md          # 服务端说明文档
│   ├── models/            # 数据模型
│   │   ├── BaseModel.js   # 基础模型类
│   │   ├── DatabaseManager.js # 数据库连接管理器
│   │   └── TenderInfoModel.js # 招标信息模型
│   ├── routes/            # 路由模块
│   │   ├── dbRoutes.js    # 数据库配置路由
│   │   └── tenderRoutes.js # 招标信息路由
│   └── utils/             # 工具函数
│       └── initTables.js  # 初始化数据表工具
│
└── README.md              # 本文件
```

## 快速开始

### 前置要求

- Microsoft Edge 浏览器（或 Chrome 浏览器）
- Node.js 14+ 和 npm
- MySQL 5.7+ 数据库

### 步骤1：安装和配置服务端

1. **进入服务端目录**
   ```bash
   cd server
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置数据库**
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

4. **创建数据库**
   ```sql
   CREATE DATABASE IF NOT EXISTS page_spider CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

5. **启动服务端**
   ```bash
   npm start
   ```
   服务端将在 `http://localhost:3000` 启动。

### 步骤2：安装浏览器扩展

1. **打开Edge浏览器扩展管理页面**
   - 在地址栏输入 `edge://extensions/`
   - 或者点击菜单 → 扩展 → 管理扩展

2. **启用开发人员模式**
   - 在扩展管理页面右上角，开启"开发人员模式"开关

3. **加载扩展**
   - 点击"加载解压缩的扩展"按钮
   - 选择本项目的 `extension` 文件夹

### 步骤3：配置和开始使用

1. **打开目标网站**
   - 访问 https://search.ccgp.gov.cn

2. **配置后端API（可选）**
   - 点击浏览器工具栏中的扩展图标
   - 在弹窗中配置后端API地址（默认：`http://localhost:3000/api/tender`）
   - 点击"测试连接"按钮检查连接状态

3. **开始爬取**
   - **方式一**：使用页面上的浮动控制面板，点击"开始爬取"按钮
   - **方式二**：使用扩展弹窗，点击"开始爬取"按钮
   - 扩展会自动循环爬取所有分页，每页爬取完成后立即保存

## 使用说明

### 爬取流程

1. **单页爬取**：从当前页面提取所有列表项数据
2. **自动保存**：每页爬取完成后立即批量保存到后端
3. **自动翻页**：检测并点击"下一页"按钮
4. **循环爬取**：重复上述过程直到所有分页爬取完成
5. **状态更新**：实时更新爬取状态、进度和统计信息

### 数据字段

爬取的数据包含以下字段：

- `tenderId` - 唯一ID（从URL自动生成）
- `title` - 标题
- `url` - 详情链接
- `releaseTime` - 发布时间
- `buyerName` - 采购人
- `agentName` - 代理机构
- `provinceName` - 省份
- `afficheType` - 公告类型
- `projectDirectoryName` - 项目目录名称

### API接口

服务端提供以下主要API接口：

- `GET /api/health` - 健康检查
- `POST /api/db/test` - 测试数据库连接
- `POST /api/db/config` - 保存数据库配置
- `GET /api/db/config` - 获取数据库配置
- `POST /api/tender/save` - 保存单条招标信息
- `POST /api/tender/saveBatch` - 批量保存招标信息
- `GET /api/tender/all` - 获取所有招标信息
- `GET /api/tender/byNo/:tenderNo` - 根据编号查询
- `GET /api/tender/byFlag/:flag` - 根据标志查询
- `GET /api/tender/upcoming?days=7` - 查询即将截止的招标
- `PUT /api/tender/:tenderId/flag` - 更新招标标志
- `GET /api/tender/count` - 获取招标信息数量

详细API文档请查看 [server/README.md](server/README.md)。

## 详细文档

- **扩展项目**：查看 [extension/README.md](extension/README.md)
- **服务端项目**：查看 [server/README.md](server/README.md)

## 技术栈

### 浏览器扩展

- **Manifest V3** - 最新的扩展规范
- **Service Worker** - 后台服务脚本
- **Content Scripts** - 内容脚本，在页面中运行
- **Chrome APIs** - 消息传递、存储、脚本注入等

### 服务端

- **Node.js** - 运行环境
- **Express** - Web框架
- **MySQL2** - MySQL数据库驱动
- **CORS** - 跨域资源共享

## 开发说明

### 修改爬取规则

编辑 `extension/content.js` 文件中的 `extractItemData` 函数，根据实际页面结构调整CSS选择器和数据提取逻辑。

### 添加新网站支持

1. 在 `extension/manifest.json` 的 `host_permissions` 中添加新网站域名
2. 在 `content_scripts` 的 `matches` 中添加新网站URL模式
3. 在 `extension/content.js` 中添加针对新网站的数据提取逻辑

### 调试技巧

1. **查看控制台日志**：打开浏览器开发者工具（F12）查看Console
2. **查看扩展日志**：在扩展弹窗的日志面板中查看操作日志
3. **检查数据提取**：在 `extractItemData` 函数中添加 `console.log` 输出

## 故障排除

### 扩展无法加载

- 检查 `manifest.json` 格式是否正确
- 确保所有引用的文件都存在
- 查看扩展管理页面的错误提示

### 爬取不到数据

- 检查页面是否完全加载
- 打开浏览器开发者工具查看控制台错误
- 检查页面结构是否发生变化（CSS选择器可能失效）

### 数据保存失败

- 检查后端服务是否运行（访问 `http://localhost:3000/api/health`）
- 检查API地址是否正确配置
- 查看后端日志了解详细错误信息

### 数据库连接失败

- 检查MySQL服务是否运行
- 检查数据库配置是否正确
- 确保数据库已创建

更多故障排除信息请查看各子项目的README文档。

## 注意事项

1. **页面兼容性**：当前针对 `search.ccgp.gov.cn` 网站优化，如果页面结构变化，需要更新选择器
2. **数据去重**：后端使用 `REPLACE INTO` 语句，相同 `tenderId` 的数据会自动更新
3. **性能考虑**：批量保存数据，减少API调用次数；每页爬取后立即保存，避免数据丢失
4. **配置安全**：数据库配置文件包含敏感信息，已添加到 `.gitignore`，不要提交到版本控制

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
