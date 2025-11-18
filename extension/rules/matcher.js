// 规则匹配器
// RULES 应该已经在 rules.js 中加载到全局变量
const RULES = (typeof window !== 'undefined' && window.RULES) 
  ? window.RULES 
  : (typeof self !== 'undefined' && self.RULES)
  ? self.RULES
  : require('./rules').RULES;

// 匹配规则
function matchRule(url) {
  if (!url) return RULES.default;
  
  for (const [key, rule] of Object.entries(RULES)) {
    if (key === 'default') continue;
    if (rule.urlPattern && rule.urlPattern.test(url)) {
      return rule;
    }
  }
  
  return RULES.default;
}

// 导出（支持多种环境）
if (typeof self !== 'undefined') {
  // Service Worker 环境
  self.matchRule = matchRule;
}
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.matchRule = matchRule;
}
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = { matchRule };
}

