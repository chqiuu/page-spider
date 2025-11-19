// tender_info 表模型
const BaseModel = require('./BaseModel');

class TenderInfoModel extends BaseModel {
  constructor() {
    const tableName = 'tender_info';
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        \`tender_id\` varchar(50) NOT NULL COMMENT '唯一ID',
        \`flag\` tinyint DEFAULT '0' COMMENT '标志',
        \`title\` varchar(200) DEFAULT NULL COMMENT '标题',
        \`release_time\` datetime DEFAULT NULL COMMENT '发布时间',
        \`url\` varchar(200) DEFAULT NULL COMMENT '详情URL',
        \`province_name\` varchar(20) DEFAULT NULL COMMENT '省份',
        \`district_name\` varchar(20) DEFAULT NULL COMMENT '区县',
        \`project_purchase_way\` varchar(20) DEFAULT NULL COMMENT '招标方式',
        \`open_tender_code\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '项目编号',
        \`budget\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '预算金额',
        \`project_directory_name\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '项目目录名称',
        \`buyer_name\` varchar(100) DEFAULT NULL COMMENT '采购人',
        \`agent_name\` varchar(100) DEFAULT NULL COMMENT '代理机构',
        \`affiche_type\` varchar(255) DEFAULT NULL COMMENT '公告类型',
        \`expire_time\` datetime DEFAULT NULL COMMENT '截至时间',
        \`update_time\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
        \`create_time\` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (\`tender_id\`),
        KEY \`index_title\` (\`title\`),
        KEY \`index_release_time\` (\`release_time\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='政府采购信息';
    `;
    super(tableName, createTableSQL);
  }

  // 保存招标信息（使用 REPLACE，因为主键是 tender_id）
  async save(data) {
    const tenderData = {
      tender_id: data.tenderId || '',
      flag: data.flag !== undefined ? data.flag : null,
      title: data.title || '',
      release_time: data.releaseTime || null,
      url: data.url || '',
      province_name: data.provinceName || '',
      district_name: data.districtName || '',
      project_purchase_way: data.projectPurchaseWay || '',
      open_tender_code: data.openTenderCode || '',
      budget: data.budget || '',
      project_directory_name: data.projectDirectoryName || '',
      buyer_name: data.buyerName || '',
      agent_name: data.agentName || '',
      affiche_type: data.afficheType || '',
      expire_time: data.expireTime || null
    };

    // 使用 REPLACE INTO，如果 tender_id 存在则更新，不存在则插入
    const result = await this.replace(tenderData);
    return { tender_id: tenderData.tender_id, count: 1 };
  }

  // 批量保存招标信息（使用 REPLACE）
  async saveBatch(dataArray) {
    const items = dataArray.map(data => ({
      tender_id: data.tenderId || '',
      flag: data.flag !== undefined ? data.flag : null,
      title: data.title || '',
      release_time: data.releaseTime || null,
      url: data.url || '',
      province_name: data.provinceName || '',
      district_name: data.districtName || '',
      project_purchase_way: data.projectPurchaseWay || '',
      open_tender_code: data.openTenderCode || '',
      budget: data.budget || '',
      project_directory_name: data.projectDirectoryName || '',
      buyer_name: data.buyerName || '',
      agent_name: data.agentName || '',
      affiche_type: data.afficheType || '',
      expire_time: data.expireTime || null
    }));

    const result = await this.replaceBatch(items);
    return { count: result.affectedRows };
  }

  async getAll() {
    return await this.findAll('release_time DESC, create_time DESC');
  }

  // 根据招标ID查询
  async findByTenderId(tenderId) {
    return await this.find({ tender_id: tenderId });
  }

  // 根据招标编号查询（使用 open_tender_code）
  async findByTenderNo(tenderNo) {
    return await this.find({ open_tender_code: tenderNo });
  }

  // 根据标志查询
  async findByFlag(flag) {
    return await this.find({ flag }, 'release_time DESC');
  }

  // 根据采购人查询
  async findByBuyerName(buyerName) {
    return await this.find({ buyer_name: buyerName }, 'release_time DESC');
  }

  // 查询即将截止的招标（在指定天数内）
  async findUpcomingDeadline(days = 7) {
    const connection = await this.getConnection();
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE create_time >= CURDATE() 
      AND create_time <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY create_time ASC
    `;
    const [rows] = await connection.execute(sql, [days]);
    return rows;
  }

  // 更新标志
  async updateFlag(tenderId, flag) {
    return await this.update(tenderId, { flag });
  }

  // 根据tender_id更新（因为主键是tender_id，不是id）
  async updateByTenderId(tenderId, data) {
    const connection = await this.getConnection();
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE tender_id = ?`;
    const [result] = await connection.execute(sql, [...values, tenderId]);
    return result;
  }
}

module.exports = TenderInfoModel;

