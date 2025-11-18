// 爬取数据相关路由
const express = require('express');
const router = express.Router();
const dbManager = require('../models/DatabaseManager');
const CrawlDataModel = require('../models/CrawlDataModel');

// 初始化模型实例
const crawlDataModel = new CrawlDataModel();

// 保存爬取数据
router.post('/save', async (req, res) => {
  try {
    await dbManager.getConnection();
    const data = req.body;
    const result = await crawlDataModel.save(data);
    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('保存数据失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '保存数据失败: ' + error.message 
    });
  }
});

// 获取所有数据
router.get('/all', async (req, res) => {
  try {
    await dbManager.getConnection();
    const rows = await crawlDataModel.getAll();
    res.json(rows);
  } catch (error) {
    console.error('获取数据失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取数据失败: ' + error.message 
    });
  }
});

// 获取数据数量
router.get('/count', async (req, res) => {
  try {
    await dbManager.getConnection();
    const count = await crawlDataModel.count();
    res.json(count);
  } catch (error) {
    console.error('获取数据数量失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取数据数量失败: ' + error.message 
    });
  }
});

// 清空所有数据
router.delete('/clear', async (req, res) => {
  try {
    await dbManager.getConnection();
    await crawlDataModel.truncate();
    res.json({ success: true, message: '数据已清空' });
  } catch (error) {
    console.error('清空数据失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '清空数据失败: ' + error.message 
    });
  }
});

module.exports = router;

