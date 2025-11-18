// 快速检查服务器是否正常运行
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ 服务器运行正常');
      console.log('状态:', result.status);
      console.log('数据库连接:', result.dbConnected ? '✅ 已连接' : '❌ 未连接');
      console.log('时间戳:', new Date(result.timestamp).toLocaleString('zh-CN'));
    } catch (error) {
      console.log('⚠️  服务器响应异常:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 无法连接到服务器');
  console.error('错误:', error.message);
  console.log('\n请确保服务器已启动: npm start');
});

req.on('timeout', () => {
  console.error('❌ 连接超时');
  req.destroy();
});

req.end();

