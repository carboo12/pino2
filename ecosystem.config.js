module.exports = {
  apps: [{
    name: 'pino-api-dev',
    script: 'dist/src/main.js',
    cwd: '/opt/apps/pino2/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3035,
    },
    error_file: '/root/.pm2/logs/pino-api-dev-error.log',
    out_file: '/root/.pm2/logs/pino-api-dev-out.log',
    max_restarts: 10,
    restart_delay: 2000,
  }],
};
