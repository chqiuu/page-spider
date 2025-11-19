// 网站规则管理器

(function() {
  'use strict';
  
  window.SiteRuleManager = class SiteRuleManager {
    constructor() {
      // 注册所有网站规则（需要确保规则类已加载）
      this.rules = [];
      this.initRules();
    }

    /**
     * 初始化规则（延迟加载，确保所有规则类已定义）
     */
    initRules() {
      if (typeof window.CcgpGovRule !== 'undefined') {
        this.rules.push(new window.CcgpGovRule());
      }
      if (typeof window.CcgpSichuanRule !== 'undefined') {
        this.rules.push(new window.CcgpSichuanRule());
      }
    }

    /**
     * 根据URL获取匹配的规则
     * @param {string} url - 当前页面URL
     * @returns {BaseSiteRule|null} - 匹配的规则，未找到返回null
     */
    getRuleForUrl(url) {
      if (!url) {
        url = window.location.href;
      }
      
      for (const rule of this.rules) {
        if (rule.matches(url)) {
          return rule;
        }
      }
      
      return null;
    }

    /**
     * 检查当前页面是否支持爬取
     * @param {string} url - 当前页面URL（可选，默认使用window.location.href）
     * @returns {boolean}
     */
    isSupported(url) {
      return this.getRuleForUrl(url) !== null;
    }

    /**
     * 获取所有已注册的规则
     * @returns {Array<BaseSiteRule>}
     */
    getAllRules() {
      return this.rules;
    }

    /**
     * 注册新规则
     * @param {BaseSiteRule} rule - 规则实例
     */
    registerRule(rule) {
      this.rules.push(rule);
    }
  };

  // 创建单例实例
  window.siteRuleManager = new window.SiteRuleManager();
})();
