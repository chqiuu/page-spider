// 本地HTTP服务器 - 用于连接MySQL数据库
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 引入数据库管理器和工具函数
const dbManager = require('./models/DatabaseManager');
const { initTables } = require('./utils/initTables');

// 引入路由模块
const dbRoutes = require('./routes/dbRoutes');
const dataRoutes = require('./routes/dataRoutes');
const tenderRoutes = require('./routes/tenderRoutes');

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 处理Chrome DevTools的自动请求（避免404和CSP错误）
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(200).json({});
});

// 注册路由
app.use('/api/db', dbRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/tender', tenderRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    dbConnected: dbManager.isConnected(),
    timestamp: Date.now()
  });
});

// 连接数据库
async function connectDB() {
  try {
    await dbManager.connect();
    await initTables();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    throw error;
  }
}

// 处理所有未定义的路由（返回404，避免控制台错误）
app.use((req, res, next) => {
  // 忽略Chrome DevTools相关的请求
  if (req.path.includes('.well-known') || req.path.includes('favicon.ico')) {
    res.status(200).json({});
    return;
  }
  res.status(404).json({ 
    success: false, 
    message: '路由不存在' 
  });
});

// 启动服务器
async function startServer() {
  try {
    // 尝试加载已有配置并连接
    if (dbManager.loadDbConfig()) {
      await connectDB();
    }
    
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log('等待数据库配置...');
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    console.log('服务器已启动，但数据库未连接。请通过扩展配置数据库。');
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  await dbManager.close();
  process.exit(0);
});

startServer();

