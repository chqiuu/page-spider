# 页面爬虫工具 - Edge扩展

这是一个用于爬取政府采购网站（search.ccgp.gov.cn）招标信息的Microsoft Edge浏览器扩展工具。支持自动分页爬取、实时状态显示和数据批量保存到MySQL数据库。

## 功能特性

- ✅ 支持从 `search.ccgp.gov.cn` 网站爬取招标信息列表
- ✅ 自动分页爬取（循环爬取所有分页）
- ✅ 浮动控制面板（在页面上直接操作）
- ✅ Popup弹窗控制界面
- ✅ 实时显示爬取状态、进度和日志
- ✅ 批量保存数据到后端MySQL数据库
- ✅ 支持自定义后端API地址
- ✅ 支持停止爬取操作
- ✅ 自动提取标题、链接、发布时间、采购人、代理机构等信息

## 安装步骤

### 1. 打开Edge浏览器扩展管理页面

- 在地址栏输入 `edge://extensions/`
- 或者点击菜单 → 扩展 → 管理扩展

### 2. 启用开发人员模式

- 在扩展管理页面右上角，开启"开发人员模式"开关

### 3. 加载扩展

- 点击"加载解压缩的扩展"按钮
- 选择本项目的 `extension` 文件夹

### 4. 配置后端服务

- 确保后端服务已启动（运行在 `http://localhost:3000`）
- 打开扩展弹窗，配置后端API地址（默认：`http://localhost:3000/api/tender`）
- 点击"测试连接"按钮检查连接状态

### 5. 开始使用

- 打开目标网站：https://search.ccgp.gov.cn
- 在页面上会显示浮动控制面板，或点击浏览器工具栏中的扩展图标
- 点击"开始爬取"按钮开始爬取数据

## 使用说明

### 方式一：使用浮动控制面板

1. 打开目标网页（https://search.ccgp.gov.cn）
2. 页面加载完成后，会自动在页面上显示一个浮动控制面板
3. 点击面板上的"开始爬取"按钮
4. 扩展会自动循环爬取所有分页，每页爬取完成后立即保存
5. 可以随时点击"停止"按钮停止爬取
6. 点击面板右上角的"×"可以最小化面板

### 方式二：使用Popup弹窗

1. 打开目标网页（https://search.ccgp.gov.cn）
2. 点击浏览器工具栏中的扩展图标，打开弹窗
3. 配置后端API地址（如需要）
4. 点击"开始爬取"按钮
5. 在弹窗中查看爬取进度、已爬取数量、已保存数量等信息
6. 在日志面板中查看详细日志

### 爬取流程

1. **单页爬取**：从当前页面提取所有列表项数据
2. **自动保存**：每页爬取完成后立即批量保存到后端
3. **自动翻页**：检测并点击"下一页"按钮
4. **循环爬取**：重复上述过程直到所有分页爬取完成
5. **状态更新**：实时更新爬取状态、进度和统计信息

## 项目结构

```
extension/
├── manifest.json          # 扩展配置文件（Manifest V3）
├── background.js          # 后台服务脚本（Service Worker）
├── content.js            # 内容脚本（爬取逻辑和浮动面板）
├── content.css           # 内容脚本样式
├── popup.html            # 弹窗HTML
├── popup.css             # 弹窗样式
├── popup.js              # 弹窗逻辑
├── icons/                # 图标文件
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon256.png
├── README.md             # 本文件
└── QUICKSTART.md         # 快速开始指南
```

## 数据字段说明

爬取的数据将包含以下字段（对应后端 `tender_info` 表）：

| 字段名 | 说明 | 来源 |
|--------|------|------|
| `tenderId` | 唯一ID | 从URL自动生成 |
| `title` | 标题 | 列表项链接文本 |
| `url` | 详情链接 | 列表项链接地址 |
| `releaseTime` | 发布时间 | 从内容中提取 |
| `buyerName` | 采购人 | 从内容中提取 |
| `agentName` | 代理机构 | 从内容中提取 |
| `provinceName` | 省份 | 从内容中提取 |
| `afficheType` | 公告类型 | 从内容中提取 |
| `projectDirectoryName` | 项目目录名称 | 从内容中提取 |
| `crawledAt` | 爬取时间 | 自动生成（ISO格式） |

**注意**：部分字段（如 `districtName`、`projectPurchaseWay`、`openTenderCode`、`budget`、`expireTime`）在当前版本中未提取，如需这些字段，需要修改 `content.js` 中的 `extractItemData` 函数。

## API接口

扩展通过以下接口与后端通信：

### 保存数据
```
POST /api/tender/saveBatch
Content-Type: application/json

Body: {
  "items": [
    {
      "tenderId": "...",
      "title": "...",
      "url": "...",
      ...
    }
  ]
}
```

### 健康检查
```
GET /api/health
```

## 配置说明

### 后端API地址

默认地址：`http://localhost:3000/api/tender`

可以在以下位置配置：
1. Popup弹窗中的"后端API地址"输入框
2. 扩展会自动保存配置到本地存储

### 权限说明

扩展需要以下权限：
- `activeTab` - 访问当前活动标签页
- `storage` - 保存配置信息
- `scripting` - 注入内容脚本
- `https://search.ccgp.gov.cn/*` - 访问目标网站
- `http://localhost:3000/*` - 访问后端API

## 开发说明

### 修改爬取规则

编辑 `content.js` 文件中的 `extractItemData` 函数，根据实际页面结构调整CSS选择器和数据提取逻辑。

**关键选择器**：
- 列表项容器：`.vT-srch-result-list ul li`
- 标题链接：`a` 元素
- 内容信息：`span` 元素

### 添加新网站支持

1. 在 `manifest.json` 的 `host_permissions` 中添加新网站域名
2. 在 `content_scripts` 的 `matches` 中添加新网站URL模式
3. 在 `content.js` 中添加针对新网站的数据提取逻辑
4. 修改 `extractItemData` 函数以适配新网站的页面结构

### 自定义浮动面板样式

编辑 `content.css` 文件，修改 `.page-spider-control` 相关样式。

### 调试技巧

1. **查看控制台日志**：
   - 打开浏览器开发者工具（F12）
   - 在Console标签页查看爬取日志

2. **查看扩展日志**：
   - 在扩展弹窗的日志面板中查看操作日志
   - 或在Service Worker控制台中查看后台日志

3. **检查数据提取**：
   - 在 `extractItemData` 函数中添加 `console.log` 输出
   - 检查提取的数据是否符合预期

## 故障排除

### 扩展无法加载

- 检查 `manifest.json` 格式是否正确（JSON格式）
- 确保所有引用的文件都存在
- 检查是否有语法错误（查看扩展管理页面的错误提示）

### 浮动面板不显示

- 检查是否在目标网站（search.ccgp.gov.cn）
- 打开浏览器开发者工具查看是否有JavaScript错误
- 检查 `content.js` 是否正确注入

### 爬取不到数据

- 检查页面是否完全加载
- 打开浏览器开发者工具查看控制台错误
- 检查页面结构是否发生变化（CSS选择器可能失效）
- 检查 `extractItemData` 函数中的选择器是否正确

### 数据保存失败

- 检查后端服务是否运行（访问 `http://localhost:3000/api/health`）
- 检查API地址是否正确配置
- 查看后端日志了解详细错误信息
- 检查网络连接是否正常

### 无法自动翻页

- 检查"下一页"按钮的选择器是否正确：`div > p.pager > a.next`
- 检查按钮是否被禁用或隐藏
- 查看控制台是否有相关错误信息

### 爬取过程中页面卡顿

- 这是正常现象，因为需要等待页面加载和DOM操作
- 如果卡顿严重，可以尝试增加延迟时间（修改 `waitForPageNavigation` 函数）

## 技术架构

### Manifest V3

扩展使用 Manifest V3 规范：
- Service Worker 替代后台页面
- 使用 `chrome.scripting` API 注入脚本
- 使用 `chrome.storage` API 存储配置

### 消息传递

扩展使用 Chrome 消息传递机制进行组件间通信：
- `popup.js` ↔ `background.js` - 配置和保存数据
- `popup.js` ↔ `content.js` - 控制爬取操作
- `content.js` ↔ `background.js` - 保存数据

### 数据流

1. **爬取阶段**：`content.js` 提取页面数据
2. **保存阶段**：通过 `background.js` 发送到后端API
3. **状态更新**：通过消息传递更新UI状态

## 注意事项

1. **图标文件**
   - 需要准备图标文件：16x16, 48x48, 128x128, 256x256
   - 放置在 `icons/` 目录下
   - 如果没有图标，扩展仍可正常使用，但会显示默认图标

2. **后端服务**
   - 确保后端服务已启动（运行在 http://localhost:3000）
   - 确保数据库已配置并连接成功
   - 确保API接口正常工作

3. **页面兼容性**
   - 当前针对 `search.ccgp.gov.cn` 网站优化
   - 如果页面结构变化，需要更新 `content.js` 中的选择器
   - 建议定期检查页面结构是否发生变化

4. **性能考虑**
   - 批量保存数据，减少API调用次数
   - 每页爬取后立即保存，避免数据丢失
   - 支持停止操作，避免长时间运行

5. **数据去重**
   - 后端使用 `REPLACE INTO` 语句，相同 `tenderId` 的数据会自动更新
   - 无需担心重复数据问题

## 更新日志

### v1.0.0
- 初始版本
- 支持自动分页爬取
- 浮动控制面板
- Popup弹窗控制
- 批量保存数据

## 许可证

MIT License
