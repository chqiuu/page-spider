// 初始化数据表工具函数
const CrawlDataModel = require('../models/CrawlDataModel');
const TenderInfoModel = require('../models/TenderInfoModel');

// 初始化模型实例
const crawlDataModel = new CrawlDataModel();
const tenderInfoModel = new TenderInfoModel();

// 初始化所有数据表
async function initTables() {
  try {
    await crawlDataModel.initTable();
    await tenderInfoModel.initTable();
    console.log('所有数据表初始化完成');
  } catch (error) {
    console.error('数据表初始化失败:', error);
    throw error;
  }
}

module.exports = {
  initTables,
  crawlDataModel,
  tenderInfoModel
};

