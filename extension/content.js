// Content Script - 用于在目标网页中执行爬取逻辑

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'crawl') {
    crawlData()
      .then(data => {
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
    
    // 查找列表容器
    const listContainer = document.querySelector('.vT-srch-result ul li') || document.body;
    
    if (!listContainer) {
      throw new Error('未找到列表容器');
    }
    
    // 提取列表项
    const items = extractListItems(listContainer);
    
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

// 提取列表项数据
function extractListItems(container) {
  const items = [];
  
  // 尝试多种选择器来找到列表项（针对search.ccgp.gov.cn网站）
  const selectors = [
    '.vT-srch-result ul li'
  ];
  
  let rows = [];
  for (const selector of selectors) {
    rows = container.querySelectorAll(selector);
    if (rows.length > 0) {
      console.log(`使用选择器找到 ${rows.length} 行: ${selector}`);
      break;
    }
  }
  
  // 如果没有找到，尝试查找所有包含链接的tr元素
  if (rows.length === 0) {
    rows = container.querySelectorAll('tr');
    console.log(`使用通用选择器找到 ${rows.length} 行`);
  }
  
  // 过滤掉表头和空行
  const dataRows = Array.from(rows).filter(row => {
    // 跳过表头
    if (row.querySelector('th')) {
      return false;
    }
    // 跳过没有td的行
    if (row.querySelectorAll('td').length === 0) {
      return false;
    }
    // 跳过完全空白的行
    const text = row.textContent.trim();
    if (!text || text.length < 5) {
      return false;
    }
    return true;
  });
  
  console.log(`过滤后剩余 ${dataRows.length} 行有效数据`);
  
  dataRows.forEach((row, index) => {
    try {
      const item = extractItemData(row);
      if (item && item.title && item.title.length > 0) {
        items.push(item);
      }
    } catch (error) {
      console.warn(`提取第${index + 1}项数据失败:`, error);
    }
  });
  
  return items;
}

// 提取单个列表项的数据
function extractItemData(row) {
  const cells = row.querySelectorAll('td');
  if (cells.length === 0) {
    return null;
  }
  
  // 尝试提取标题和链接
  let title = '';
  let url = '';
  let releaseTime = '';
  let provinceName = '';
  let districtName = '';
  let projectPurchaseWay = '';
  let openTenderCode = '';
  let budget = '';
  let projectDirectoryName = '';
  let buyerName = '';
  let agentName = '';
  let afficheType = '';
  let expireTime = '';
  
  // 查找标题链接（通常在第一个或第二个td中）
  for (let i = 0; i < Math.min(cells.length, 3); i++) {
    const link = cells[i].querySelector('a');
    if (link) {
      title = link.textContent.trim();
      // 处理href
      url = link.href;
      // 如果没有href，尝试从onclick中提取
      if (!url || url === '#' || url === 'javascript:void(0)') {
        const onclick = link.getAttribute('onclick');
        if (onclick) {
          const match = onclick.match(/['"]([^'"]+)['"]/);
          if (match) {
            url = match[1];
          }
        }
      }
      // 处理相对URL
      if (url && !url.startsWith('http')) {
        try {
          url = new URL(url, window.location.origin).href;
        } catch (e) {
          // 如果URL无效，尝试拼接
          if (url.startsWith('/')) {
            url = window.location.origin + url;
          } else {
            url = window.location.origin + '/' + url;
          }
        }
      }
      break;
    }
  }
  
  // 如果没有找到链接，尝试从文本中提取标题
  if (!title) {
    title = cells[0]?.textContent.trim() || '';
    // 清理标题（移除多余空白）
    title = title.replace(/\s+/g, ' ').trim();
  }
  
  // 提取发布时间（支持多种日期格式）
  const datePatterns = [
    /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?/,
    /\d{4}[-/]\d{1,2}[-/]\d{1,2}/,
    /\d{4}\.\d{1,2}\.\d{1,2}/
  ];
  
  for (let i = 0; i < cells.length; i++) {
    const text = cells[i].textContent.trim();
    for (const pattern of datePatterns) {
      if (pattern.test(text) && !releaseTime) {
        releaseTime = text.match(pattern)[0];
        // 标准化日期格式：YYYY-MM-DD
        releaseTime = releaseTime
          .replace(/[年月日]/g, '-')
          .replace(/\./g, '-')
          .replace(/\//g, '-');
        // 确保格式正确
        const parts = releaseTime.split('-');
        if (parts.length === 3) {
          const year = parts[0];
          const month = parts[1].padStart(2, '0');
          const day = parts[2].padStart(2, '0');
          releaseTime = `${year}-${month}-${day}`;
        }
        break;
      }
    }
    if (releaseTime) break;
  }
  
  // 尝试从各个单元格提取其他信息
  // 根据实际页面结构调整这些提取逻辑
  cells.forEach((cell, index) => {
    const text = cell.textContent.trim();
    if (!text) return;
    
    // 省份/地区（通常包含"省"、"市"、"自治区"等）
    if (!provinceName && /省|市|自治区|特别行政区/.test(text) && text.length < 20) {
      provinceName = text;
    }
    
    // 区县（通常包含"区"、"县"、"市"等，且长度较短）
    if (!districtName && /区|县|市/.test(text) && text.length < 15 && !provinceName) {
      districtName = text;
    }
    
    // 项目编号（通常包含字母和数字，长度6-50）
    if (!openTenderCode && /^[A-Za-z0-9\-]{6,50}$/.test(text)) {
      openTenderCode = text;
    }
    
    // 预算金额（通常包含"元"、"万"、"亿"等）
    if (!budget && /[\d.,]+[万亿]?元/.test(text)) {
      budget = text;
    }
    
    // 采购人（长度适中，不包含特殊符号）
    if (!buyerName && text.length > 2 && text.length < 50 && !/http|www|@/.test(text)) {
      buyerName = text;
    }
    
    // 代理机构
    if (!agentName && text.length > 2 && text.length < 50 && !/http|www|@/.test(text) && text !== buyerName) {
      agentName = text;
    }
    
    // 招标方式
    if (!projectPurchaseWay && /公开|邀请|竞争|单一|询价/.test(text) && text.length < 20) {
      projectPurchaseWay = text;
    }
    
    // 公告类型
    if (!afficheType && /公告|通知|公示/.test(text) && text.length < 30) {
      afficheType = text;
    }
  });
  
  // 生成唯一ID（基于URL或标题）
  const tenderId = generateTenderId(url, title);
  
  return {
    tender_id: tenderId,
    flag: 0,
    title: title,
    release_time: releaseTime || null,
    url: url || '',
    province_name: provinceName || '',
    district_name: districtName || '',
    project_purchase_way: projectPurchaseWay || '',
    open_tender_code: openTenderCode || '',
    budget: budget || '',
    project_directory_name: projectDirectoryName || '',
    buyer_name: buyerName || '',
    agent_name: agentName || '',
    affiche_type: afficheType || '',
    expire_time: expireTime || null
  };
}

// 生成唯一ID
function generateTenderId(url, title) {
  if (url) {
    // 从URL中提取ID
    const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/(\d+)/);
    if (match) {
      return match[1];
    }
  }
  
  // 使用标题和URL生成hash
  const str = (url || '') + (title || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'tender_' + Math.abs(hash).toString(36);
}

// 页面加载完成后，向background发送就绪消息
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({ action: 'contentReady', url: window.location.href });
  });
} else {
  chrome.runtime.sendMessage({ action: 'contentReady', url: window.location.href });
}

