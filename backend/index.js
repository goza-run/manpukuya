const express = require('express');
const fs = require("fs");
const path = require("path");
const session = require('express-session');
const cors=require("cors");
// ルートハンドラ設定を含むモジュールをインポート
const routes = require('./routes');
const SQLiteStore = require('connect-sqlite3')(session);
// Expressアプリケーションを作成
const app = express();


const isProduction = process.env.NODE_ENV === 'production';
const sessionDir = isProduction ? '/data' : './';
const uploadsDir = isProduction ? path.join('/data', 'uploads') : path.join(__dirname, 'uploads');

// uploadsフォルダがなければ作成
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}


app.set('trust proxy', 1);

// 許可するオリジン（アクセス元）のリストを作成
const allowedOrigins = [
    'https://manpukuya.vercel.app', // あなたのVercelのURL
    'http://localhost:5173',
    'http://localhost:5174',      // ローカル開発用のURL
    'https://app.manpukuya.me'
];

// corsミドルウェアを設定
app.use(cors({
    origin: function (origin, callback) {
        // `allowedOrigins`にリクエスト元のオリジンが含まれていれば許可
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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
        dir: sessionDir,       // DBファイルがあるディレクトリ
        table: 'sessions'// セッションを保存するテーブル名
    }),
    secret: process.env.SESSION_SECRET || 'your_secret_key_dev',
    resave: false,
    saveUninitialized: false, // falseに変更するのが一般的
    cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? 'none':"lax",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 例: 7日間有効
    }
}));
// publicディレクトリ内の静的ファイルを提供
app.use(express.static('public'));
//uploadsフォルダを外部からアクセス可能にする
app.use("/uploads",express.static(uploadsDir));
// '/api'パスに対するルートハンドラを設定
app.use('/api', routes);
// ポート4000でリクエストをリッスン開始
const port = process.env.PORT || 4000;
const host = '0.0.0.0'; // 'localhost'から変更

app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
});