const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt =require("bcrypt")

// データベース接続を開く関数
async function openDb() {
    return open({
        filename: './db.sqlite', // ファイル名を統一
        driver: sqlite3.Database
    });
}

// データベース接続のPromiseを一度だけ生成
const dbPromise = openDb();

/**
 * データベースを初期化し、必要なテーブルを作成する
 */
async function initializeDatabase() {
    const db = await dbPromise;

    // usersテーブルを作成 (idを主キーに)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT DEFAULT "user" NOT NULL -- デフォルトを"user"に設定
        )
    `);

    /* expensesテーブルを作成 (外部キーを正しく設定)
    idは一つ一つの食事につけられる番号
    userIdはそれが誰のものか
    amountは金額入力欄、NOT NULLは空欄禁止ということ
    expense_dateは何月何日のご飯か
    meal_typeはご飯が朝昼夜の何か
    created_at~~~は食費記録がいつ作成されたかを自動で記録する
    DEFAULT CURRENT_TIMESTAMPで何も指定がなければデフォルト値としてその瞬間の日時を自動で入れる
    userIdを外部キー(連絡先、FOREIGN KEY)に指定、
    expensesテーブルのuserIdにはusersテーブルに存在するidしか入れないようにする
    ON DELETE CASCADEはもし親であるusersテーブルが削除された際にexpensesテーブルも削除すると言う機能
    */
    await db.exec(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            photo_path TEXT,
            description TEXT,
            expense_date TEXT NOT NULL,
            meal_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    await db.exec(`
        CREATE TABLE IF NOT EXISTS budgets(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            month TEXT NOT NULL,
            amount INTEGER NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(userId,month) -- ユーザーごとに同じ月は1つだけ
            )
        `);
    await db.exec(`
        CREATE TABLE IF NOT EXISTS comments(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expenseID INTEGER NOT NULL,--どの投稿？
            authorId INTEGER NOT NULL,--誰が書いた？
            authorRole TEXT NOT NULL,--投稿者が管理者かユーザーか
            content TEXT NOT NULL,--コメント内容
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (expenseId) REFERENCES expenses(id) ON DELETE CASCADE,
            FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

    // シードデータ（初期データ）を挿入
    const testUser = await db.get(`SELECT id FROM users WHERE username = ?`, 'kanri');
    if (!testUser) {
        console.log('Creating seed users...');
        // createUserは使わず、直接挿入。実際はパスワードをハッシュ化すべき
        await createUser("kanri","donpisha");
        await createUser("yukito","staff");
        await createUser("takatan","kanton");
        await createUser("tanasen","carpboya");
        await createUser("taro","yamada");
        await createUser("yukiya","shafu");

        //管理者を設定
        await db.run(`UPDATE users SET role = "admin" WHERE username="kanri"`);
        await db.run(`UPDATE users SET role = "admin" WHERE username="yukito"`);
        //別に変数もなければ改行もしないのでバッククォートじゃなくてもいいが統一しとく
        console.log("'kanri'and'yukito'user has been set as admin")
    }
}

// サーバー起動時にデータベースを初期化
initializeDatabase().catch(err => {
    console.error("Database initialization failed:", err);
    process.exit(1); // 初期化に失敗したらプロセスを終了
});


// --- 管理者関連の関数 ---

async function getAllUsers(){
    const db=await dbPromise;
    return db.all(`SELECT id, username, role FROM users`);
}

// --- ユーザー関連の関数 ---

/**
 * 新しいユーザーを作成
 * @param {string} username - JSDocと呼ばれる形式のコメント、なくてもいい＠param{型} 引数名 - 説明文の順番 
 * これはusernameを文字列(string)型だと言うことを示す
 * @param {string} password
 */
async function createUser(username, password) {
    const db = await dbPromise;
    //パスワードをbcryptでハッシュ化(ミキサーにかけたみたいにぐちゃぐちゃにする)する
    const saltRounds=10;//ハッシュ化の強度
    const hashedPassword=await bcrypt.hash(password,saltRounds)
    //passwordを強度10でぐちゃぐちゃにする
    //users TABLEにusernameとpassword(ぐちゃぐちゃの状態)を渡す
    await db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword]);
}

/**
 * ユーザー認証を行う
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object|null>} 下の内容は認証成功ならユーザーオブジェクト、失敗ならnullを返す
 */
async function authenticateUser(username, password) {
    const db = await dbPromise;
    const user = await db.get(`SELECT * FROM users WHERE username = ?`, [username]);

    if (user) {
        //bcrypt.compareで第一引数を第二引数と同じハッシュ化をして合ってるか確認する
        const isMatch = await bcrypt.compare(password, user.password);
        return isMatch ? user : null;//一致してたらuserオブジェクト(id,username,password)を渡す
    }
    return null;
}


// --- 食費 (Expense) 関連の関数 ---

/**
 * 新しい食費記録を作成
 * @param {number} userId
 * @param {object} expenseData - { amount, photo_path, description}
 */
async function createExpense(userId, { amount, photo_path, description,expense_date,meal_type}) {
    const db = await dbPromise;
    await db.run(
        'INSERT INTO expenses (userId,amount,photo_path,description,expense_date,meal_type) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, amount, photo_path, description,expense_date,meal_type]
    );
}

/**
 * 特定のユーザーの食費記録をすべて取得
 * @param {number} userId
 */
async function getExpensesByUserId(userId) {
    const db = await dbPromise;
    return db.all('SELECT * FROM expenses WHERE userId = ? ORDER BY expense_date DESC', [userId]);
}

async function getExpenseById(id){
    const db=await dbPromise;
    return db.get(`SELECT*FROM expenses WHERE id=?`,[id]);
}

/**
 * 食費記録をIDで削除
 * @param {number} id
 */
async function deleteExpenseById(id) {
    const db = await dbPromise;
    await db.run('DELETE FROM expenses WHERE id = ?', [id]);
}

//食事記録をIDで更新
async function updateExpenseById(id,{amount,description,expense_date,meal_type,photo_path}){
    const db=await dbPromise;
    await db.run(
        `UPDATE expenses
        SET amount=?,description=?,expense_date=?,meal_type=?,photo_path=?
        WHERE id =?`,
        [amount,description,expense_date,meal_type,photo_path,id]
    );
}
//特定の月の目標金額を取得
async function getBudget(userId,month){
    const db=await dbPromise;
    return db.get(`SELECT * FROM budgets WHERE userId=? AND month=?`,[userId,month]);
}
//特定の月の目標金額を設定(更新)
async function setBudget(userId,month,amount){
    const db=await dbPromise;
    await db.run(
        `INSERT OR REPLACE INTO budgets(userId,month,amount) VALUES(?,?,?)
        ON CONFLICT(userId,month) DO UPDATE SET amount=excluded.amount`,
    [userId,month,amount]
    );
}
// --- コメント関連の関数 ---

async function getCommentByExpenseId(expenseId){
    const db=await dbPromise;
    return db.all(`
        SELECT comments.*,users.username as authorName --comments.*はcommentsテーブルの全てをとってくるということ
        FROM comments
        JOIN users ON comments.authorId=users.id 
        --SELECT FROM テーブル名 ,(orJOIN) テーブル名でテーブル同士を結合(authorIdとusers.idが一緒のやつを繋げてる)
        WHERE comments.expenseId=? --その中からもらったexpenseIdのやつだけを取り出す
        ORDER BY comments.created_at ASC --作成日時の古い順で並び替え`
        ,[expenseId]);
}

async function createComment({expenseId,authorId,authorRole,content}) {
    const db=await dbPromise;
    await db.run(
        `INSERT INTO comments (expenseId,authorId,authorRole,content) VALUES (?,?,?,?)`,
        [expenseId,authorId,authorRole,content]
    );
}
// モジュールとして必要な関数をエクスポート
module.exports = {
    getAllUsers,
    createUser,
    authenticateUser,
    createExpense,
    getExpensesByUserId,
    getExpenseById,
    deleteExpenseById,
    updateExpenseById,
    getBudget,
    setBudget,
    getCommentByExpenseId,
    createComment
};