# 页面爬虫工具 - Edge扩展

这是一个用于爬取指定网站数据的Microsoft Edge浏览器扩展工具。

## 功能特性

- ✅ 支持从指定网站爬取列表数据
- ✅ 自动提取标题、链接、发布时间等信息
- ✅ 通过后端API保存数据到MySQL数据库
- ✅ 实时显示爬取状态和日志
- ✅ 支持自定义后端API地址

## 安装步骤

1. **打开Edge浏览器扩展管理页面**
   - 在地址栏输入 `edge://extensions/`
   - 或者点击菜单 → 扩展 → 管理扩展

2. **启用开发人员模式**
   - 在扩展管理页面右上角，开启"开发人员模式"开关

3. **加载扩展**
   - 点击"加载解压缩的扩展"按钮
   - 选择本项目的 `extension` 文件夹

4. **开始使用**
   - 打开目标网站：https://search.ccgp.gov.cn
   - 点击浏览器工具栏中的扩展图标
   - 配置后端API地址（默认：http://localhost:3000/api/tender）
   - 点击"开始爬取"按钮

## 使用说明

### 1. 配置后端API

在扩展弹窗中，输入后端API地址：
- 默认地址：`http://localhost:3000/api/tender`
- 点击"测试连接"按钮检查连接状态

### 2. 开始爬取

1. 打开目标网页（https://search.ccgp.gov.cn）
2. 确保页面已完全加载
3. 点击扩展图标打开弹窗
4. 点击"开始爬取"按钮
5. 等待爬取完成，数据将自动保存到后端

### 3. 查看日志

在扩展弹窗的日志面板中，可以查看：
- 爬取进度
- 保存状态
- 错误信息

## 项目结构

```
extension/
├── manifest.json          # 扩展配置文件
├── background.js          # 后台服务脚本
├── content.js            # 内容脚本（爬取逻辑）
├── popup.html            # 弹窗HTML
├── popup.css             # 弹窗样式
├── popup.js              # 弹窗逻辑
├── icons/                # 图标文件
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # 本文件
```

## 数据字段说明

爬取的数据将包含以下字段（对应 `tender_info` 表）：

- `tender_id`: 唯一ID（自动生成）
- `title`: 标题
- `url`: 详情链接
- `release_time`: 发布时间
- `province_name`: 省份
- `district_name`: 区县
- `project_purchase_way`: 招标方式
- `open_tender_code`: 项目编号
- `budget`: 预算金额
- `project_directory_name`: 项目目录名称
- `buyer_name`: 采购人
- `agent_name`: 代理机构
- `affiche_type`: 公告类型
- `expire_time`: 截至时间

## 注意事项

1. **图标文件**
   - 需要准备三个尺寸的图标：16x16, 48x48, 128x128
   - 放置在 `icons/` 目录下
   - 如果没有图标，扩展仍可正常使用，但会显示默认图标

2. **后端服务**
   - 确保后端服务已启动（运行在 http://localhost:3000）
   - 确保数据库已配置并连接成功

3. **页面兼容性**
   - 当前针对 `search.ccgp.gov.cn` 网站优化
   - 如果页面结构变化，可能需要调整 `content.js` 中的选择器

## 开发说明

### 修改爬取规则

编辑 `content.js` 文件中的 `extractListItems` 和 `extractItemData` 函数，根据实际页面结构调整CSS选择器和数据提取逻辑。

### 添加新网站支持

1. 在 `manifest.json` 的 `host_permissions` 中添加新网站域名
2. 在 `content_scripts` 的 `matches` 中添加新网站URL模式
3. 在 `content.js` 中添加针对新网站的数据提取逻辑

## 故障排除

### 扩展无法加载
- 检查 `manifest.json` 格式是否正确
- 确保所有引用的文件都存在

### 爬取不到数据
- 检查页面是否完全加载
- 打开浏览器开发者工具查看控制台错误
- 检查页面结构是否发生变化

### 数据保存失败
- 检查后端服务是否运行
- 检查API地址是否正确
- 查看后端日志了解详细错误信息

## 许可证

MIT License

