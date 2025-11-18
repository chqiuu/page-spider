# 页面爬虫工具

一个基于浏览器扩展的网页爬虫工具，通过浏览器原生方式访问网页，有效规避反爬虫机制。支持本地IndexedDB和MySQL数据库存储。

## 项目结构

本项目已拆分为两个独立的子项目：

```
page-spider/
├── extension/          # 浏览器扩展项目
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup.html/js/css
│   ├── crawler-engine.js
│   └── icons/
│
├── server/             # 服务端项目（可选）
│   ├── server.js
│   ├── check-server.js
│   └── package.json
│
└── README.md          # 本文件
```

## 快速开始

### 方式1：仅使用浏览器扩展（IndexedDB存储）

1. **安装扩展**
   - 打开Edge浏览器，访问 `edge://extensions/`
   - 开启"开发人员模式"
   - 点击"加载解压缩的扩展"
   - 选择 `extension` 文件夹

2. **开始使用**
   - 打开目标网页
   - 点击扩展图标
   - 配置爬取参数并开始爬取

### 方式2：扩展 + 服务端（MySQL存储）

1. **启动服务端**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **安装扩展**
   - 按照方式1的步骤安装扩展

3. **配置数据库**
   - 在扩展弹窗中配置MySQL连接信息
   - 勾选"使用MySQL数据库"

## 详细文档

- **扩展项目**：查看 [extension/README.md](extension/README.md)
- **服务端项目**：查看 [server/README.md](server/README.md)

## 功能特性

- ✅ 浏览器扩展方式运行，使用真实浏览器环境
- ✅ 支持基于URL的自动规则匹配
- ✅ 支持自定义CSS选择器
- ✅ 本地IndexedDB数据库存储（默认）
- ✅ MySQL数据库支持（可选，需要服务端）
- ✅ 可配置爬取延迟时间
- ✅ 数据查看、导出、清空功能

## 技术栈

- **浏览器扩展**：Manifest V3, IndexedDB, Content Scripts
- **服务端**：Node.js, Express, MySQL2

## 许可证

MIT License
