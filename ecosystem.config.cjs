// pm2 ecosystem for the self-hosted runner deploy
// Server is `tsx server/index.ts` which serves WS + /api and (in prod) static dist/.
module.exports = {
  apps: [
    {
      name: 'cosmos',
      script: './node_modules/.bin/tsx',
      args: 'server/index.ts',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || '3001',
        HOST: process.env.HOST || '0.0.0.0',
      },
      autorestart: true,
      max_memory_restart: '500M',
      watch: false,
      time: true,
      out_file: 'logs/cosmos.out.log',
      error_file: 'logs/cosmos.err.log',
    },
  ],
};
