module.exports = {
  apps: [
    {
      name: 'clouddesktop-api',
      script: 'server.js',
      cwd: '/var/www/clouddesktop/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 4010,
      },
      error_file: '/var/log/pm2/clouddesktop-error.log',
      out_file:   '/var/log/pm2/clouddesktop-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
