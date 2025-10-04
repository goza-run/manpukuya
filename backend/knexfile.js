// knexfile.js
const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'db.sqlite')
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  },
  production: { // 本番環境用の設定
    client: 'sqlite3',
    connection: {
      filename: '/data/db.sqlite' // Fly.io上のパス
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  }
};