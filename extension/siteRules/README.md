# 网站规则系统

本目录包含所有网站的爬取规则，采用面向对象的设计，每个网站都有独立的规则类，互不干扰。

## 架构说明

### 基础架构

- **BaseSiteRule.js** - 基础规则类，所有网站规则都应继承此类
- **index.js** - 规则管理器，负责注册和管理所有规则
- **CcgpGovRule.js** - 中国政府采购网规则 (search.ccgp.gov.cn)
- **CcgpSichuanRule.js** - 四川政府采购网规则 (www.ccgp-sichuan.gov.cn)

### 工作流程

1. 页面加载时，规则管理器自动检测当前页面URL
2. 根据URL匹配对应的规则类
3. 使用规则类的方法进行数据提取和翻页操作

## 如何添加新网站规则

### 步骤1：创建规则文件

在 `siteRules` 目录下创建新文件，例如 `NewSiteRule.js`：

```javascript
// 新网站规则示例
(function() {
  'use strict';
  
  if (typeof window.BaseSiteRule === 'undefined') {
    throw new Error('BaseSiteRule must be loaded before NewSiteRule');
  }
  
  window.NewSiteRule = class NewSiteRule extends window.BaseSiteRule {
    constructor() {
      super();
      this.name = 'NewSiteRule';
      this.domain = 'example.com';
      this.urlPatterns = [
        'example.com',
        'www.example.com'
      ];
    }

    getListItemSelector() {
      // 返回列表项的CSS选择器
      return '.list-item, .result-item';
    }

    getNextPageButtonSelector() {
      // 返回下一页按钮的CSS选择器
      return '.pagination .next, a[title="下一页"]';
    }

    extractItemData(element) {
      try {
        // 从DOM元素中提取数据
        const aElement = element.querySelector('a');
        if (!aElement) return null;
        
        const title = aElement.textContent.trim();
        const link = aElement.href;
        const tenderId = this.generateTenderId(link);
        
        // 提取其他字段...
        
        return {
          tenderId: tenderId,
          title: title,
          url: link,
          releaseTime: '',
          buyerName: '',
          agentName: '',
          provinceName: '',
          afficheType: '',
          projectDirectoryName: '',
          crawledAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('提取数据失败:', error);
        return null;
      }
    }

    // 可选：重写生成ID的方法
    generateTenderId(url) {
      return url.replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .replace(/\.html?$/, '')
                .replace(/\//g, '_');
    }

    // 可选：重写等待页面导航的方法（如果网站使用AJAX加载）
    async waitForPageNavigation() {
      // 自定义等待逻辑
      return new Promise((resolve) => {
        // 实现自定义检测逻辑
        setTimeout(resolve, 1000);
      });
    }
  };
})();
```

### 步骤2：注册规则

在 `siteRules/index.js` 中注册新规则：

```javascript
initRules() {
  if (typeof window.CcgpGovRule !== 'undefined') {
    this.rules.push(new window.CcgpGovRule());
  }
  if (typeof window.CcgpSichuanRule !== 'undefined') {
    this.rules.push(new window.CcgpSichuanRule());
  }
  // 添加新规则
  if (typeof window.NewSiteRule !== 'undefined') {
    this.rules.push(new window.NewSiteRule());
  }
}
```

### 步骤3：更新 manifest.json

在 `extension/manifest.json` 中：

1. **添加 host_permissions**：
```json
"host_permissions": [
  "https://example.com/*"
]
```

2. **添加 content_scripts matches**：
```json
"matches": [
  "https://example.com/*"
]
```

3. **在 js 数组中添加新规则文件**（注意顺序，BaseSiteRule 必须在最前面）：
```json
"js": [
  "siteRules/BaseSiteRule.js",
  "siteRules/CcgpGovRule.js",
  "siteRules/CcgpSichuanRule.js",
  "siteRules/NewSiteRule.js",  // 新规则
  "siteRules/index.js",
  "content.js"
]
```

## BaseSiteRule 方法说明

### 必须实现的方法

- `getListItemSelector()` - 返回列表项的CSS选择器
- `getNextPageButtonSelector()` - 返回下一页按钮的CSS选择器
- `extractItemData(element)` - 从DOM元素中提取数据，返回数据对象或null

### 可选重写的方法

- `generateTenderId(url)` - 生成唯一ID（默认实现通常已足够）
- `waitForPageNavigation()` - 等待页面导航完成（默认实现支持URL变化和内容更新检测）
- `clickNextPage(nextButton)` - 点击下一页按钮（默认实现已处理各种情况）
- `isNextPageAvailable(nextButton)` - 检查下一页按钮是否可用（默认实现已足够）

### 继承的方法

- `matches(url)` - 检查URL是否匹配此规则
- `waitForPageLoad()` - 等待页面加载完成

## 数据字段说明

`extractItemData` 方法应返回包含以下字段的对象：

```javascript
{
  tenderId: string,           // 唯一ID（必需）
  title: string,               // 标题（必需）
  url: string,                 // 详情链接（必需）
  releaseTime: string,         // 发布时间
  buyerName: string,           // 采购人
  agentName: string,           // 代理机构
  provinceName: string,        // 省份
  afficheType: string,         // 公告类型
  projectDirectoryName: string, // 项目目录名称
  crawledAt: string            // 爬取时间（ISO格式）
}
```

## 调试技巧

1. **检查规则是否匹配**：
   - 打开浏览器控制台
   - 输入 `window.siteRuleManager.getRuleForUrl(window.location.href)`
   - 应该返回对应的规则对象

2. **测试选择器**：
   - 在控制台中使用 `document.querySelectorAll(selector)` 测试选择器
   - 确保能正确选中列表项和下一页按钮

3. **测试数据提取**：
   - 在 `extractItemData` 方法中添加 `console.log` 输出
   - 检查提取的数据是否符合预期

4. **检查页面导航**：
   - 如果翻页不工作，检查 `getNextPageButtonSelector()` 返回的选择器
   - 检查 `isNextPageAvailable()` 方法的逻辑

## 注意事项

1. **选择器优先级**：CSS选择器按顺序匹配，如果多个选择器都匹配，会返回第一个匹配的元素
2. **异步操作**：`waitForPageNavigation()` 和 `clickNextPage()` 都是异步方法，确保使用 `await`
3. **错误处理**：`extractItemData()` 应该捕获所有错误并返回 `null`，避免影响整体爬取
4. **性能考虑**：选择器应该尽可能精确，避免选中过多元素

## 示例：四川政府采购网规则

参考 `CcgpSichuanRule.js` 了解如何实现一个完整的规则类。注意：

- 该规则包含多个可能的选择器（因为实际页面结构可能不同）
- 数据提取逻辑尝试了多种方法（表格单元格、文本行等）
- 需要根据实际页面DOM结构调整选择器和提取逻辑

