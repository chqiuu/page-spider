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
    const result = await tenderInfoModel.save(data);
    console.log(`tenderRoutes save result`,result);
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
    const result = await tenderInfoModel.saveBatch(dataArray);
    console.log(`tenderRoutes saveBatch result`,result);
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

// 解析description并批量更新供应商信息
router.get('/parseDescription', async (req, res) => {
  try {
    await dbManager.getConnection();
    
    // 获取查询条件
    const conditions = {};
    if (req.body.afficheType) {
      conditions.afficheType = req.body.afficheType;
    }
    if (req.body.flag !== undefined) {
      conditions.flag = parseInt(req.body.flag);
    }
    
    // 查询需要解析的记录
    const records = await tenderInfoModel.findNeedParseDescription(conditions);
    
    if (records.length === 0) {
      return res.json({ 
        success: true, 
        message: '没有需要更新的记录',
        updated: 0,
        total: 0
      });
    }

    // 解析description并准备更新数据
    const updates = [];
    let successCount = 0;
    let failCount = 0;

    for (const record of records) {
      const { tender_id, description, affiche_type } = record;
      
      // 只处理中标公告类型
      if (affiche_type !== '中标公告' && affiche_type !== '成交公告') {
        continue;
      }

      try {
        const parsed = parseProviderInfoFromDescription(description);
        if (parsed && (parsed.providerName || parsed.providerAddress || parsed.transactionAmount)) {
          updates.push({
            tenderId: tender_id,
            providerName: parsed.providerName || record.provider_name || '',
            providerAddress: parsed.providerAddress || record.provider_address || '',
            transactionAmount: parsed.transactionAmount || record.transaction_amount || ''
          });
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`解析记录 ${tender_id} 失败:`, error);
        failCount++;
      }
    }

    // 批量更新
    let updatedCount = 0;
    if (updates.length > 0) {
      const result = await tenderInfoModel.batchUpdateProviderInfo(updates);
      updatedCount = result.affectedRows;
    }

    res.json({
      success: true,
      message: '批量更新完成',
      total: records.length,
      parsed: successCount,
      failed: failCount,
      updated: updatedCount
    });
  } catch (error) {
    console.error('解析description并批量更新失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '批量更新失败: ' + error.message 
    });
  }
});

// 解析description文本，提取供应商信息
function parseProviderInfoFromDescription(description) {
  if (!description || typeof description !== 'string') {
    return null;
  }

  try {
    // 匹配"评审总得分"之后到"四、"之前的内容
    // 格式：评审总得分 供应商名称 供应商地址 金额 得分
    // 示例：评审总得分 北京晓通宏志科技有限公司 北京市昌平区科技园区超前路9号3号楼2383室 2,608,000.00元 95.33
    const sectionMatch = description.match(/(供应商名称 供应商地址 中标（成交）金额)\s+(.+?)(?:\s+四、|$)/);
    console.log(`parseProviderInfoFromDescription sectionMatch`,sectionMatch);
    if (!sectionMatch) {
      return null;
    }

    const dataLine = sectionMatch[2].trim();
    console.log(`parseProviderInfoFromDescription dataLine`,dataLine);
    
    // 先提取金额（格式：数字,数字.数字元）
    const amountMatch = dataLine.match(/([\d,]+\.?\d*元)/);
    console.log(`parseProviderInfoFromDescription amountMatch`,amountMatch);
    if (!amountMatch) {
      return null;
    }

    const transactionAmount = amountMatch[1].trim();
    const amountIndex = dataLine.indexOf(transactionAmount);
    let beforeAmount = dataLine.substring(0, amountIndex).trim();
    beforeAmount = beforeAmount.replace('评审价格 ', '').replace('评审总得分 ', '').replace('执行标准 ', '').trim();

    console.log(`parseProviderInfoFromDescription beforeAmount`,beforeAmount);

    // 提取供应商名称和地址
    // 规则：供应商名称和地址之间用空格分割，第一个空格分割的为供应商名称，后面的为地址
    const firstSpaceIndex = beforeAmount.indexOf(' ');
    
    let providerName = '';
    let providerAddress = '';
    
    if (firstSpaceIndex > 0) {
      // 找到第一个空格，按第一个空格分割
      providerName = beforeAmount.substring(0, firstSpaceIndex).trim();
      providerAddress = beforeAmount.substring(firstSpaceIndex + 1).trim();
    } else {
      // 如果没有空格，整个作为供应商名称
      providerName = beforeAmount;
      providerAddress = '';
    }

    return {
      providerName,
      providerAddress,
      transactionAmount
    };
  } catch (error) {
    console.error('解析description失败:', error);
    return null;
  }
}

module.exports = router;
