const express = require('express');
const session = require('express-session');
const fs=require("fs");
const path=require("path");
const multer=require("multer");
const{
    getAllUsers,
    getAdminUsers,
    createUser,
    authenticateUser,
    createExpense,
    getExpensesByUserId,
    getExpenseById,
    deleteExpenseById,
    updateExpenseById,
    getBudget,
    setBudget,
    getCommentById,
    getCommentByExpenseId,
    createComment,
    deleteCommentById,
    createNotification,
    getNotificationsByUserId,
    markNotificationAsRead,
    updateUserCharacter,
}=require("./db");
const e = require('express');
const router =express.Router();
const isProduction = process.env.NODE_ENV === 'production';
const uploadsDir = isProduction ? '/data/uploads' : 'uploads';

//画像フォルダの設定
const storage=multer.diskStorage({
    destination:function(req,file,cb){
//destination=保存先フォルダ
        cb(null,uploadsDir)//cb=call back
//エラーがなければ(null)、保存先をuploadDirにしろという指示
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
        //セッションにユーザー情報を保存
        req.session.userId=user.id;//userIdを保存
        req.session.username=user.username;
        req.session.role=user.role;//adminかuserかを記録
        req.session.selected_character=user.selected_character;//お供の情報をセッションに保存
        res.status(200).json({//フロントエンドに送る情報
            id:user.id,
            username:user.username,
            role:user.role,
            selected_character:user.selected_character
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
            role:req.session.role,
            userId:req.session.userId,
            //上のauthenticateUserからusernameは受け取っている
            selected_character:req.session.selected_character
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
    const{amount,description,expense_date,meal_type,nomikai}=req.body//テキストデータは打ち込んだ情報からもらう
    let photo_path = null; // photo_pathをnullで初期化
    if (req.file) {
        // req.file.path のバックスラッシュをスラッシュに置換する
        const internalPath = req.file.path.replace(/\\/g, "/");
        //replaceの後は正規表現、\\2個になっているが、これで\を探してきなさいという意味になり、
        //gはグローバル(文字列全体を検索して見つかったものを全て置き換える)、これがないと最初に見つかったやつだけ変わる
        photo_path = internalPath.substring(internalPath.indexOf("uploads/"));
    }

    await createExpense(req.session.userId,{amount,photo_path,description,expense_date,meal_type,nomikai});
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
            const internalPath=req.file.path.replace(/\\/g,"/");
            new_photo=internalPath.substring(internalPath.indexOf("uploads/"));
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
            nomikai:req.body.nomikai,
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

router.post("/expenses/:expenseId/comments",upload.single("photo"),async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        const content=req.body.content;
        if((!content||!content.trim())&& !req.file){
            return res.status(400).send("コメントか写真のどちらかを入力してください");
        }
        let photo_path = null; // photo_pathをnullで初期化
        if (req.file) {
        // req.file.path のバックスラッシュをスラッシュに置換する
        const internalPath = req.file.path.replace(/\\/g, "/");
        photo_path = internalPath.substring(internalPath.indexOf("uploads/"));
        }
        const commentData={
            expenseId:req.params.expenseId,
            authorId:req.session.userId,
            authorRole:req.session.role,
            content:req.body.content,
            photo_path:photo_path
        }
        await createComment(commentData);
        //notificationstableに追加
        const expense=await getExpenseById(req.params.expenseId);
        //expenseIdから投稿者のIdを取得
        const postOwnerId=expense.userId;
        if(postOwnerId!==req.session.userId){
            //自分以外がコメントした場合のみ通知を作成
            await createNotification({
                recipientId:postOwnerId,
                senderId:req.session.userId,
                senderName:req.session.username,
                type:"comment",
                expenseId:req.params.expenseId
            });
        }
        const admins=await getAdminUsers();
        for(const admin of admins){
            if(admin.id!==req.session.userId&&admin.id!==postOwnerId){
                //自分と投稿者以外の管理者全員に通知を送る
                await createNotification({
                    recipientId:admin.id,
                    senderId:req.session.userId,
                    senderName:req.session.username,
                    type:"comment_admin",
                    expenseId:req.params.expenseId
                });
            }
        }
        res.status(201).send("Comment created");
    }catch(error){
        console.error("コメントの投稿中にエラー:",error);
        res.status(500).send("Server error");
    }
})

router.delete("/comments/:id",async(req,res)=>{//特定のコメントを消したいのでid
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        const commentId=req.params.id;
        //コメントの情報を取得して、投稿者か管理者かを確認
        const comment=await getCommentById(commentId);
        if(!comment){
            return res.status(404).send("Comment not found");
        }
        if(comment.authorId!==req.session.userId){//自分が書いたコメントじゃなかったら
            return res.status(403).send("Forbidden");
        }
        await deleteCommentById(commentId);
        res.status(200).send("Comment deleted");
    }catch(error){
        console.error("コメントの削除中にエラー:",error);
        res.status(500).send("Server error");
    }
})
//自分宛の通知を取得
router.get("/notifications",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        const notifications=await getNotificationsByUserId(req.session.userId);
        res.status(200).json(notifications);
    }catch(error){
        console.error("通知の取得中にエラー:",error);
        res.status(500).send("Server error");
    }
});

//通知を既読にする
router.post("/notifications/read",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        await markNotificationAsRead(req.session.userId);
        res.status(200).send("Notifications marked as read");
    }catch(error){
        console.error("通知の既読処理中にエラー:",error);
        res.status(500).send("Server error");
    }
});

//お供決め
router.post("/user/character",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    const {character}=req.body;
    if(!character||typeof character!=="string"){//characterのtypeがstringじゃなかったら
    //ダメな例
    //{character:123} {character:[]}
        return res.status(400).send("Invalid character");
    }
    try{
        await updateUserCharacter(req.session.userId,character);
        req.session.selected_character=character;//セッション情報も更新
        res.status(200).json({
            message:"Character updated",
            selected_character:character
        });
    }catch(error){
        console.error("お供決め中にエラー:",error);
        res.status(500).send("Server error");
    }
});
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

