const isDevelopment = import.meta.env.DEV;

const API_BASE_URL = isDevelopment
  ? '' // 開発環境
  : 'https://api.manpukuya.me'; // 本番環境

export default API_BASE_URL;