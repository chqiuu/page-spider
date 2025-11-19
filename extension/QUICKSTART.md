# 快速开始指南

## 安装步骤

### 1. 准备图标文件（可选）

在 `icons/` 目录下放置以下图标文件：
- `icon16.png` (16x16像素)
- `icon48.png` (48x48像素)
- `icon128.png` (128x128像素)

如果没有图标，扩展仍可正常使用。

### 2. 启动后端服务

```bash
cd server
npm install
npm start
```

确保后端服务运行在 `http://localhost:3000`

### 3. 加载扩展

1. 打开 Microsoft Edge 浏览器
2. 访问 `edge://extensions/`
3. 开启右上角的"开发人员模式"
4. 点击"加载解压缩的扩展"
5. 选择 `extension` 文件夹

### 4. 使用扩展

1. 打开目标网站：https://search.ccgp.gov.cn/bxsearch?searchtype=1&page_index=16&bidSort=0&buyerName=&projectId=&pinMu=0&bidType=0&dbselect=bidx&kw=%E5%88%9B%E6%96%B0%E5%AE%9E%E9%AA%8C%E5%AE%A4&start_time=2024%3A11%3A18&end_time=2025%3A11%3A18&timeType=6&displayZone=&zoneId=&pppStatus=0&agentName=

2. 等待页面完全加载

3. 点击浏览器工具栏中的扩展图标

4. 在弹窗中：
   - 检查后端API地址（默认：http://localhost:3000/api/tender）
   - 点击"测试连接"确认后端可用
   - 点击"开始爬取"按钮

5. 等待爬取完成，数据将自动保存到数据库

## 故障排除

### 扩展无法加载
- 检查 `manifest.json` 文件是否存在且格式正确
- 确保所有引用的文件都存在

### 爬取不到数据
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页中的日志
3. 检查页面结构是否与预期一致
4. 如果页面结构变化，可能需要修改 `content.js` 中的选择器

### 数据保存失败
1. 确认后端服务正在运行
2. 检查API地址是否正确
3. 查看后端控制台的错误日志
4. 确认数据库连接正常

### 调试技巧

1. **查看爬取日志**：
   - 打开开发者工具（F12）
   - 切换到 Console 标签
   - 查看 content script 输出的日志

2. **检查提取的数据**：
   - 在 Console 中可以看到使用了哪个选择器
   - 可以看到找到了多少行数据
   - 可以看到每条数据的提取结果

3. **调整选择器**：
   - 如果找不到数据，检查页面实际使用的CSS类名
   - 修改 `content.js` 中的 `selectors` 数组
   - 添加实际页面使用的选择器

## 自定义爬取规则

如果需要针对特定页面调整爬取规则，编辑 `extension/content.js` 文件：

1. **修改列表选择器**：编辑 `extractListItems` 函数中的 `selectors` 数组
2. **修改数据提取逻辑**：编辑 `extractItemData` 函数中的提取逻辑
3. **重新加载扩展**：在 `edge://extensions/` 页面点击扩展的刷新按钮

## 注意事项

- 请遵守目标网站的 robots.txt 和使用条款
- 不要过于频繁地爬取，避免对服务器造成压力
- 数据提取逻辑可能需要根据实际页面结构调整

