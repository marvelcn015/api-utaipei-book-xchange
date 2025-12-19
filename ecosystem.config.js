module.exports = {
  apps: [
    {
      name: 'utaipei-bookxchange-api',
      script: 'dist/main.js',
      instances: 1, // e2-micro, single instance
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '300M', // e2-micro has 1GB RAM
      watch: false,
    },
  ],
};
