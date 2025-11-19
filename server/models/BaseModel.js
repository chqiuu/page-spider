// 数据库模型基类
const dbManager = require('./DatabaseManager');

class BaseModel {
  constructor(tableName, createTableSQL) {
    this.tableName = tableName;
    this.createTableSQL = createTableSQL;
  }

  // 获取数据库连接
  async getConnection() {
    return await dbManager.getConnection();
  }

  // 初始化表
  async initTable() {
    const connection = await this.getConnection();
    await connection.execute(this.createTableSQL);
    console.log(`数据表 ${this.tableName} 初始化完成`);
  }

  // 插入单条数据
  async insert(data) {
    const connection = await this.getConnection();
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const [result] = await connection.execute(sql, values);
    return result;
  }

  // 批量插入数据
  async insertBatch(dataArray) {
    if (!dataArray || dataArray.length === 0) {
      return { affectedRows: 0 };
    }

    const connection = await this.getConnection();
    const fields = Object.keys(dataArray[0]);
    const placeholder = `(${fields.map(() => '?').join(', ')})`;
    let totalAffectedRows = 0;

    // 批量插入，每次最多插入1000条
    const batchSize = 1000;
    for (let i = 0; i < dataArray.length; i += batchSize) {
      const batch = dataArray.slice(i, i + batchSize);
      const placeholders = batch.map(() => placeholder).join(', ');
      const values = batch.flatMap(item => fields.map(field => item[field] !== undefined ? item[field] : null));
      
      const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES ${placeholders}`;
      const [result] = await connection.execute(sql, values);
      totalAffectedRows += result.affectedRows;
    }

    return { affectedRows: totalAffectedRows };
  }
  // 替换单条数据
  async replace(data) {
    const connection = await this.getConnection();
    const fields = Object.keys(data);
    console.log(`fields ${fields}`,fields);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `REPLACE INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const [result] = await connection.execute(sql, values);
    return result;
  }

  // 批量替换数据
  async replaceBatch(dataArray) {
    if (!dataArray || dataArray.length === 0) {
      return { affectedRows: 0 };
    }

    const connection = await this.getConnection();
    const fields = Object.keys(dataArray[0]);
    const placeholder = `(${fields.map(() => '?').join(', ')})`;
    let totalAffectedRows = 0;

    // 批量替换，每次最多替换1000条
    const batchSize = 1000;
    for (let i = 0; i < dataArray.length; i += batchSize) {
      const batch = dataArray.slice(i, i + batchSize);
      const placeholders = batch.map(() => placeholder).join(', ');
      const values = batch.flatMap(item => fields.map(field => item[field] !== undefined ? item[field] : null));
      
      const sql = `REPLACE INTO ${this.tableName} (${fields.join(', ')}) VALUES ${placeholders}`;
      const [result] = await connection.execute(sql, values);
      totalAffectedRows += result.affectedRows;
    }

    return { affectedRows: totalAffectedRows };
  }

  // 查询所有数据
  async findAll(orderBy = null) {
    const connection = await this.getConnection();
    let sql = `SELECT * FROM ${this.tableName}`;
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    const [rows] = await connection.execute(sql);
    return rows;
  }

  // 根据条件查询
  async find(conditions = {}, orderBy = null, limit = null) {
    const connection = await this.getConnection();
    let sql = `SELECT * FROM ${this.tableName}`;
    const values = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => {
          values.push(conditions[key]);
          return `${key} = ?`;
        })
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    const [rows] = await connection.execute(sql, values);
    return rows;
  }

  // 根据ID查询
  async findById(id) {
    const connection = await this.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  // 更新数据
  async update(id, data) {
    const connection = await this.getConnection();
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const [result] = await connection.execute(sql, [...values, id]);
    return result;
  }

  // 删除数据
  async delete(id) {
    const connection = await this.getConnection();
    const [result] = await connection.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result;
  }

  // 统计数量
  async count(conditions = {}) {
    const connection = await this.getConnection();
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const values = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => {
          values.push(conditions[key]);
          return `${key} = ?`;
        })
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
    }

    const [rows] = await connection.execute(sql, values);
    return rows[0].count;
  }

  // 清空表
  async truncate() {
    const connection = await this.getConnection();
    await connection.execute(`TRUNCATE TABLE ${this.tableName}`);
    return true;
  }

  // 执行自定义SQL
  async execute(sql, params = []) {
    const connection = await this.getConnection();
    const [result] = await connection.execute(sql, params);
    return result;
  }
}

module.exports = BaseModel;

