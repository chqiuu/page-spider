// 爬取规则配置
const RULES = {
  'ccgp.gov.cn': {
    name: '政府采购网',
    urlPattern: /ccgp\.gov\.cn/i,
    type: 'list',
    list: {
      // 政府采购网的列表选择器可能有多种情况
      itemSelector: 'div.vT-srch-result-list > ul > li',
      extractItem: (element, index) => {
        try {
          const aElement = element.querySelector('a');
          if (!aElement) return null;
          
          // 尝试多种可能的字段位置
          const title = aElement?.textContent?.trim() || '';
          let link = aElement.href;
          if (link && !link.startsWith('http')) {
            link = new URL(link, window.location.origin).href;
          }
          let content = element.querySelector('span')?.textContent?.trim() || '';
          if (!content) return null;
          
          const tenderId = link.replace("http://", "").replace("https://", "").replace("www.ccgp.gov.cn/", "").replace(".html", "").replace(".htm", "").replace("/", "_");
          let releaseTimeStr = "";
          let provinceName = "";
          let projectDirectoryName = "";
          let buyerName = "";
          let agentName = "";
          let afficheType = "";
          content = content.replace(/\n/g, "|");
          let strs = content.split("|");
          if (strs.length > 3) {
            releaseTimeStr = strs[0].trim();
            buyerName = strs[1].trim();
            agentName = strs[2].trim();
            afficheType = strs[3].trim();
            if (strs.length > 4) {
                provinceName = strs[4].trim();
            }
            if (strs.length > 5) {
                projectDirectoryName = strs[5].trim();
            }
            return {
              tenderId: tenderId,
              title: title,
              link: link,
              releaseTime: releaseTimeStr,
              buyerName: buyerName,
              agentName: agentName,
              afficheType: afficheType,
              projectDirectoryName: projectDirectoryName,
              crawledAt: new Date().toISOString()
            };
          }else{
            return null;
          }
        } catch (error) {
          console.error(`提取第${index}项失败:`, error);
          return null;
        }
      }
    }
  },
  'default': {
    name: '默认规则',
    urlPattern: /.*/,
    type: 'custom',
    custom: {
      selector: '',
      extractItem: (element, index) => {
        return {
          index: index,
          text: element.textContent?.trim() || '',
          html: element.innerHTML || ''
        };
      }
    }
  }
};

// 导出（支持多种环境）
if (typeof self !== 'undefined') {
  // Service Worker 环境
  self.RULES = RULES;
}
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.RULES = RULES;
}
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = { RULES };
}

