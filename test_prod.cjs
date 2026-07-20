const { spawn } = require('child_process');
const child = spawn('node', ['dist/server.cjs'], {
  env: { ...process.env, NODE_ENV: 'production', PORT: '3001' }
});
child.stdout.on('data', d => console.log(d.toString()));
child.stderr.on('data', d => console.error(d.toString()));
child.on('close', code => console.log('Exited with', code));
setTimeout(() => child.kill(), 3000);
