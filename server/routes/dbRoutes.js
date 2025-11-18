// 数据库配置相关路由
const express = require('express');
const router = express.Router();
const dbManager = require('../models/DatabaseManager');
const { initTables } = require('../utils/initTables');

// 测试数据库连接
router.post('/test', async (req, res) => {
  try {
    const config = req.body;
    await dbManager.testConnection(config);
    res.json({ success: true, message: '数据库连接成功' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '数据库连接失败: ' + error.message 
    });
  }
});

// 保存数据库配置
router.post('/config', async (req, res) => {
  try {
    const config = req.body;
    await dbManager.updateConfig(config);
    await initTables();
    res.json({ success: true, message: '配置保存成功' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '配置保存失败: ' + error.message 
    });
  }
});

// 获取数据库配置
router.get('/config', async (req, res) => {
  try {
    const safeConfig = dbManager.getSafeConfig();
    if (safeConfig) {
      res.json({ success: true, config: safeConfig });
    } else {
      res.json({ success: false, message: '未配置数据库' });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '获取配置失败: ' + error.message 
    });
  }
});

module.exports = router;

