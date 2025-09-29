const express = require('express');
const session = require('express-session');
const fs=require("fs");
const path=require("path");
const multer=require("multer");
const{
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
}=require("./db");
const e = require('express');
const router =express.Router();
//画像フォルダの設定
const storage=multer.diskStorage({
    destination:function(req,file,cb){
//destination=保存先フォルダ
        cb(null,"uploads/")//cb=call back
//エラーがなければ(null)、保存先をuploads/フォルダにしろという指示
    },
    filename:function(req,file,cb){
        cb(null,Date.now()+"-"+file.originalname);
//エラーはなければ(null)、ファイル名の重複を防ぐために現在時刻のタイムスタンプをつけて保存してね
    }
})
const upload=multer({storage:storage});
//左側のstorageはファイルの保存方法に関する設定だと伝えている、右側のstorageは上のやつ
//ログイン
router.post("/login",async(req,res)=>{
    const {username,password}=req.body;
    //もらったパスワードをauthenticateUserへ渡す
    const user=await authenticateUser(username,password);//なかったらnull返すよ
    if(user){
        req.session.userId=user.id;//userIdを保存
        req.session.username=user.username;
        req.session.role=user.role;//adminかuserかを記録
        res.status(200).json({
            id:user.id,
            username:user.username,
            role:user.role
        });
    }else{
        res.status(401).send("Invalid credentials");
    }
});

//ログアウト
router.post("/logout",(req,res)=>{
    req.session.destroy((err)=>{//セッションを破棄
        if(err){
            res.status(500).send("Error logging out");
        }else{
            res.status(200).send("Logout successful");
        }
    });
});
//セッション状態の維持
router.get("/session",(req,res)=>{
    if(req.session.userId){
        res.status(200).json({
            isLoggedIn:true,
            username:req.session.username,
            role:req.session.role
            //上のauthenticateUserからusernameは受け取っている
        });
    }else{
        res.status(200).json({isLoggedIn:false});
    }
})
//記録を取得する
router.get("/expenses",async(req,res)=>{
    if (!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    const expense=await getExpensesByUserId(req.session.userId);
    res.json(expense);
})

//記録を追加する(postと言われなければ基本的に上の方が出るよ)
router.post("/expenses",upload.single("photo"),async(req,res)=>{//singleで一個だけアップロードされることを表す
    if (!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    const{amount,description,expense_date,meal_type}=req.body//テキストデータは打ち込んだ情報からもらう
    let photo_path = null; // photo_pathをnullで初期化
    if (req.file) {
        // req.file.path のバックスラッシュをスラッシュに置換する
        photo_path = req.file.path.replace(/\\/g, "/");
        //replaceの後は正規表現、\\2個になっているが、これで\を探してきなさいという意味になり、
        //gはグローバル(文字列全体を検索して見つかったものを全て置き換える)、これがないと最初に見つかったやつだけ変わる
    }

    await createExpense(req.session.userId,{amount,photo_path,description,expense_date,meal_type});
    res.status(200).send("Expense added")
})

//記録を消去する
router.delete("/expenses/:id",async (req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    await deleteExpenseById(req.params.id);
    res.status(200).send("Expense deleted");
})

//記録を更新する
router.put("/expenses/:id",upload.single("photo"),async(req,res)=>{//:id=params
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    const expenseId=req.params.id;
    try{
        const originalExpense=await getExpenseById(expenseId);
        if(!originalExpense){
            return res.status(404).send("Expense not found");
        }
        let new_photo=originalExpense.photo_path;//デフォルトは元の写真
        if(req.file){
            new_photo=req.file.path.replace(/\\/g,"/");
            //元の写真があった場合
            if(originalExpense.photo_path){
                const oldPath = path.resolve(originalExpense.photo_path);
                fs.unlink(oldPath,(err)=>{
                    //__dirname=route.js,".."で一段階上のフォルダへ移動、そこからphoto_pathを取りだす
                    if(err) console.error("古いファイルの削除に失敗:",err);
                    //fs.readFile: ファイルを読み込む
                    // fs.writeFile: ファイルに書き込む
                    // fs.mkdir: 新しいフォルダを作成する
                    // fs.unlink: ファイルを削除する
                });
            }
        }
        const updatedData={
            amount:req.body.amount,
            description:req.body.description,
            expense_date:req.body.expense_date,
            meal_type:req.body.meal_type,
            photo_path:new_photo
        };
        await updateExpenseById(expenseId,updatedData);
        res.status(200).send("Expense updated successfully");
    }catch(error){
        console.error("更新処理中にエラー：",error);
        res.status(500).send("Server error during update");
    }
});
// 特定の月の目標金額を取得する
router.get("/budget/:month", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
    }
    const {month} = req.params;
    const budget = await getBudget(req.session.userId, month);
    res.json(budget);
});

router.post("/budget",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    const {month,amount}=req.body;
    await setBudget(req.session.userId,month,Number(amount));
    res.status(200).send("Budget set successfully");
});

//管理者用
// usernameやidなどをもらってくる
router.get("/users",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    if(req.session.role!="admin"){
        return res.status(403).send("Forbidden");
    }//管理者じゃなかったら通さない

    try{
        const users=await getAllUsers();
        res.json(users);
    }catch (error){
        res.status(500).send("Server error");
    }
});

//特定のユーザーの食費記録をすべて取得
router.get("/admin/expenses/:userId",async(req,res)=>{
    if(!req.session.userId || req.session.role!=="admin"){
        return res.status(403).send("Forbidden");
    }
    try{
        const userId=req.params.userId;
        const expenses=await getExpensesByUserId(userId);
        res.json(expenses);
    }catch (error){
        res.status(500).send("Server error");
    }
});

//特定の食費記録を削除
router.delete("/admin/expenses/:id",async (req,res)=>{
    if(!req.session.userId || req.session.role!=="admin"){
        return res.status(403).send("Forbidden");
    }
    try{
        const expenseId=req.params.id;
        await deleteExpenseById(expenseId);
        res.status(200).send("Expense deleted by admin");
    }catch (error){
        res.status(500).send("Server error");
    }
})

//コメント用

//特定の投稿のコメントを取得

router.get("/expenses/:expenseId/comments",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        const comments=await getCommentByExpenseId(req.params.expenseId);
        res.json(comments);
    }catch (error){
        console.error("コメントの取得中にエラー:",error);
        res.status(500).send("Server error");
    }
})

router.post("/expenses/:expenseId/comments",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        const commentData={
            expenseId:req.params.expenseId,
            authorId:req.session.userId,
            authorRole:req.session.role,
            content:req.body.content
        }
        await createComment(commentData);
        res.status(201).send("Comment created");
    }catch(error){
        console.error("コメントの投稿中にエラー:",error);
        res.status(500).send("Server error");
    }
})
module.exports=router;
/*req.fileの中身について
{
  "fieldname": "photo",
  "originalname": "myphoto.jpg",
  "encoding": "7bit",
  "mimetype": "image/jpeg",
  "destination": "uploads/",
  "filename": "1757952875592-myphoto.jpg",
  "path": "uploads/1757952875592-myphoto.jpg",
  "size": 12345
}こんな感じになってる*/

