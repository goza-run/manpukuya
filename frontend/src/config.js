const isDevelopment = import.meta.env.DEV;

const API_BASE_URL = isDevelopment
  ? '' // 開発環境では、Viteのプロキシを使うため空文字列にする
  : 'https://manpukuya.onrender.com'; // 本番環境用のURL

export default API_BASE_URL;