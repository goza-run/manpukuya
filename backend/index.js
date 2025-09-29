const express = require('express');
const session = require('express-session');
const cors=require("cors");
// ルートハンドラ設定を含むモジュールをインポート
const routes = require('./routes');
const SQLiteStore = require('connect-sqlite3')(session);
// Expressアプリケーションを作成
const app = express();

// ↓↓↓ フロントエンドのURLをここに設定 ↓↓↓
const frontendURL = 'https://manpukuya-frontend.onrender.com';

// 2. corsミドルウェアを設定
app.use(cors({
    origin: frontendURL, // ← 特定のオリジンからのリクエストを許可
    credentials: true    // ← クッキー（セッション情報）の送受信を許可
}));

// URLエンコードのミドルウェアを設定
app.use(express.urlencoded({ extended: false }));
// JSON形式でパースするミドルウェアを設定
app.use(express.json());
// セッション管理のミドルウェアを設定
app.use(session({
    store: new SQLiteStore({
        db: 'db.sqlite', // 保存先のDBファイル
        dir: './',       // DBファイルがあるディレクトリ
        table: 'sessions'// セッションを保存するテーブル名
    }),
    secret: process.env.SESSION_SECRET || 'your_secret_key_dev',
    resave: false,
    saveUninitialized: false, // falseに変更するのが一般的
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 例: 7日間有効
    }
}));
// publicディレクトリ内の静的ファイルを提供
app.use(express.static('public'));
//uploadsフォルダを外部からアクセス可能にする
app.use("/uploads",express.static("uploads"));
// '/api'パスに対するルートハンドラを設定
app.use('/api', routes);
// ポート4000でリクエストをリッスン開始
app.listen(4000, () => {
	console.log('Server running on http://localhost:4000');
});