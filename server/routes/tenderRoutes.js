// 招标信息相关路由
const express = require('express');
const router = express.Router();
const dbManager = require('../models/DatabaseManager');
const TenderInfoModel = require('../models/TenderInfoModel');

// 初始化模型实例
const tenderInfoModel = new TenderInfoModel();

// 保存招标信息
router.post('/save', async (req, res) => {
  try {
    await dbManager.getConnection();
    const data = req.body;
    const result = await tenderInfoModel.replace(data);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('保存招标信息失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '保存招标信息失败: ' + error.message 
    });
  }
});

// 批量保存招标信息
router.post('/saveBatch', async (req, res) => {
  try {
    await dbManager.getConnection();
    const dataArray = req.body.items || req.body;
    const result = await tenderInfoModel.replaceBatch(dataArray);
    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('批量保存招标信息失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '批量保存招标信息失败: ' + error.message 
    });
  }
});

// 获取所有招标信息
router.get('/all', async (req, res) => {
  try {
    await dbManager.getConnection();
    const rows = await tenderInfoModel.getAll();
    res.json(rows);
  } catch (error) {
    console.error('获取招标信息失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取招标信息失败: ' + error.message 
    });
  }
});

// 根据招标编号查询
router.get('/byNo/:tenderNo', async (req, res) => {
  try {
    await dbManager.getConnection();
    const rows = await tenderInfoModel.findByTenderNo(req.params.tenderNo);
    res.json(rows);
  } catch (error) {
    console.error('查询招标信息失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '查询招标信息失败: ' + error.message 
    });
  }
});

// 根据标志查询
router.get('/byFlag/:flag', async (req, res) => {
  try {
    await dbManager.getConnection();
    const rows = await tenderInfoModel.findByFlag(parseInt(req.params.flag));
    res.json(rows);
  } catch (error) {
    console.error('查询招标信息失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '查询招标信息失败: ' + error.message 
    });
  }
});

// 查询即将截止的招标
router.get('/upcoming', async (req, res) => {
  try {
    await dbManager.getConnection();
    const days = parseInt(req.query.days) || 7;
    const rows = await tenderInfoModel.findUpcomingDeadline(days);
    res.json(rows);
  } catch (error) {
    console.error('查询即将截止的招标失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '查询失败: ' + error.message 
    });
  }
});

// 更新招标标志
router.put('/:tenderId/flag', async (req, res) => {
  try {
    await dbManager.getConnection();
    const { flag } = req.body;
    await tenderInfoModel.updateFlag(req.params.tenderId, flag);
    res.json({ success: true, message: '标志更新成功' });
  } catch (error) {
    console.error('更新标志失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新标志失败: ' + error.message 
    });
  }
});

// 获取招标信息数量
router.get('/count', async (req, res) => {
  try {
    await dbManager.getConnection();
    const conditions = req.query.flag !== undefined ? { flag: parseInt(req.query.flag) } : {};
    const count = await tenderInfoModel.count(conditions);
    res.json(count);
  } catch (error) {
    console.error('获取招标信息数量失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取数量失败: ' + error.message 
    });
  }
});

module.exports = router;
