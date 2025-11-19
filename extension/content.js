// Content Script - 用于在目标网页中执行爬取逻辑

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'crawl') {
    crawlData()
      .then(data => {
        console.log(`crawlData success`,data);
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放以支持异步响应
  }
  
  if (request.action === 'getPageInfo') {
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      isTargetPage: window.location.hostname === 'search.ccgp.gov.cn'
    };
    sendResponse({ success: true, pageInfo: pageInfo });
    return true;
  }
});

// 爬取页面数据
async function crawlData() {
  try {
    // 等待页面加载完成
    await waitForPageLoad();
    
    // 提取列表项
    const elements = document.querySelectorAll('.vT-srch-result-list ul li');
    let items = [];
    for (const element of elements) {
      let item = extractItemData(element)
      if (item) {
        items.push(item);
      }
    }

    if (items.length === 0) {
      throw new Error('未找到任何数据项');
    }
    
    return {
      items: items,
      total: items.length,
      pageUrl: window.location.href,
      crawlTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('爬取数据失败:', error);
    throw error;
  }
}

// 等待页面加载
function waitForPageLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
      // 超时保护
      setTimeout(resolve, 5000);
    }
  });
}

// 提取单个列表项的数据
function extractItemData(element) {
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
        provinceName: provinceName,
        afficheType: afficheType,
        projectDirectoryName: projectDirectoryName,
        crawledAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error(`提取第${index}项失败:`, error);
  }
  return null;
}

// 页面加载完成后，向background发送就绪消息
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({ action: 'contentReady', url: window.location.href });
  });
} else {
  chrome.runtime.sendMessage({ action: 'contentReady', url: window.location.href });
}

