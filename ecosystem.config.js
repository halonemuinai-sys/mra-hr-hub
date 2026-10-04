module.exports = {
  apps: [
    {
      name: 'hr-hub-backend',
      script: 'api/index.js',
      cwd: './backend',
      watch: false,
      env: {
        PORT: 5006,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'hr-hub-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3006',
      cwd: './frontend',
      watch: false,
      env: {
        PORT: 3006,
        NODE_ENV: 'production'
      }
    }
  ]
};
