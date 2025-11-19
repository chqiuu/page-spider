// 中国政府采购网规则 (search.ccgp.gov.cn)

(function() {
  'use strict';
  
  if (typeof window.BaseSiteRule === 'undefined') {
    throw new Error('BaseSiteRule must be loaded before CcgpGovRule');
  }
  
  window.CcgpGovRule = class CcgpGovRule extends window.BaseSiteRule {
    constructor() {
      super();
      this.name = 'CcgpGovRule';
      this.domain = 'search.ccgp.gov.cn';
      this.urlPatterns = [
        'search.ccgp.gov.cn'
      ];
    }

    getListItemSelector() {
      return '.vT-srch-result-list ul li';
    }

    getNextPageButtonSelector() {
      return 'div > p.pager > a.next';
    }

    extractItemData(element) {
      try {
        const aElement = element.querySelector('a');
        if (!aElement) return null;
        
        const title = aElement?.textContent?.trim() || '';
        let link = aElement.href;
        if (link && !link.startsWith('http')) {
          link = new URL(link, window.location.origin).href;
        }
        
        let content = element.querySelector('span')?.textContent?.trim() || '';
        if (!content) return null;
        
        const tenderId = this.generateTenderId(link);
        let releaseTimeStr = "";
        let provinceName = "";
        let projectDirectoryName = "";
        let buyerName = "";
        let agentName = "";
        let afficheType = "";
        
        content = content.replaceAll('|', '');
        let strs = content.split(/\n/);
        
        if (strs.length > 7) {
          releaseTimeStr = strs[0].trim();
          buyerName = strs[1].trim().replaceAll('采购人：', '');
          agentName = strs[2].trim().replaceAll('代理机构：', '');
          afficheType = strs[7].trim();
          
          if (strs.length > 10) {
            provinceName = strs[10].trim();
          }
          if (strs.length > 11) {
            projectDirectoryName = strs[11].trim();
          }
          
          return {
            tenderId: tenderId,
            title: title,
            url: link,
            releaseTime: releaseTimeStr,
            buyerName: buyerName,
            agentName: agentName,
            provinceName: provinceName,
            afficheType: afficheType,
            projectDirectoryName: projectDirectoryName,
            crawledAt: new Date().toISOString()
          };
        }
      } catch (error) {
        console.error('提取数据失败:', error);
      }
      return null;
    }

    generateTenderId(url) {
      return url.replace("http://", "")
                .replace("https://", "")
                .replace("www.ccgp.gov.cn/", "")
                .replace(".html", "")
                .replace(".htm", "")
                .replace("/", "_");
    }
  };
})();
