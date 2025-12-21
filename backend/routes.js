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
    getMonthlySummarize,
    getLatestExpenseDate,
    getAverageAmount,
    getCommentById,
    getCommentByExpenseId,
    createComment,
    deleteCommentById,
    createNotification,
    getNotificationsByUserId,
    markNotificationAsRead,
    updateUserCharacter,
    getUserById,
    updateUserGachaStats,
    getUnlockedDialoguesByuserId,
    getUnlockedCharacterByUserId,
    unlockCharacter,
    unlockDialogue,
    updateUserPoints,
    getGachaItems,
}=require("./db");

const e = require('express');
const router =express.Router();
const isProduction = process.env.NODE_ENV === 'production';
const uploadsDir = isProduction ? '/data/uploads' : 'uploads';
const getLocalDate = () => {
    const d = new Date();
    // 'ja-JP'ロケールと'Asia/Tokyo'タイムゾーンを指定してフォーマット
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Tokyo'
    };
    
    // '2025/10/20' のような文字列が返る
    const jstDateString = new Intl.DateTimeFormat('ja-JP', options).format(d);
    
    // 'YYYY-MM-DD' 形式に変換して返す
    return jstDateString.replace(/\//g, '-');
};

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
            selected_character:user.selected_character,
            points:user.points
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
router.get("/session",async (req,res)=>{
    if(req.session.userId){
        //dbから最新のユーザー情報を取得し直す(これがないとpoint系にエラーが出る)
        const user=await getUserById(req.session.userId);
        if(!user){
            req.session.destroy();
            return res.status(200).json({isLoggedIn:false});
        }
        req.session.points=user.points;
        req.session.selected_character=user.selected_character
        res.status(200).json({
            isLoggedIn:true,
            username:req.session.username,
            role:req.session.role,
            userId:req.session.userId,
            //上のauthenticateUserからusernameは受け取っている
            selected_character:req.session.selected_character,
            points:req.session.points
        });
    }else{
        res.status(200).json({isLoggedIn:false});
    }
})
//全記録を取得する
router.get("/expenses", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
    }
    try {
        const expenses = await getExpensesByUserId(req.session.userId); 
        res.json(expenses);
    } catch (error) {
        console.error("複数投稿の取得中にエラー:", error);
        res.status(500).send("Server error");
    }
});

//admin向けに特定の投稿を手に入れるAPI
router.get("/expense/:id",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        const expense=await getExpenseById(req.params.id);
        if(expense){
            res.status(200).json(expense);
        }else{
            res.status(404).send("Expense not found")
        }
    }catch (error){
        console.error("単一投稿の取得中にエラー:",error);
        res.status(500).send("server error");
    }
});

//記録を追加する(postと言われなければ基本的に上の方が出るよ)
router.post("/expenses",upload.single("photo"),async(req,res)=>{//singleで一個だけアップロードされることを表す
    if (!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        const{amount,description,expense_date,meal_type,nomikai}=req.body//テキストデータは打ち込んだ情報からもらう
        let photo_path = null; // photo_pathをnullで初期化
        if (req.file) {
        // req.file.path のバックスラッシュをスラッシュに置換する
            const internalPath = req.file.path.replace(/\\/g, "/");
        //replaceの後は正規表現、\\2個になっているが、これで\を探してきなさいという意味になり、
        //gはグローバル(文字列全体を検索して見つかったものを全て置き換える)、これがないと最初に見つかったやつだけ変わる
            photo_path = internalPath.substring(internalPath.indexOf("uploads/"));
        }
        const lastExpenseDate= await getLatestExpenseDate(req.session.userId);
        const newExpenseId = await createExpense(req.session.userId, { amount, photo_path, description, expense_date, meal_type, nomikai });
        
        const createdExpenseData = {
            id: newExpenseId, // IDがないとReactのkey指定などで困るため重要
            user_id: req.session.userId,
            amount,
            photo_path,
            description,
            expense_date,
            meal_type,
            nomikai
        };
        const user=await getUserById(req.session.userId);
        //期間が空いているか確認
        let gapInfo=null;
        //最後の登校日が存在し、かつ今回の投稿が最後の投稿より後の場合のみ行う
        if(lastExpenseDate&&expense_date>lastExpenseDate){
            //2025-10-20みたいな形で保存されているdateをnewDateでmsに変換
            const lastDate=new Date(lastExpenseDate);
            const currentDate=new Date(expense_date);
            const diffTime=currentDate-lastDate;
            const diffDays=Math.ceil(diffTime/(1000*60*60*24));//ceilは切り上げてmsから日数に戻す
            //中二日以上空いている場合
            if(diffDays>2){
                const avgAmount=await getAverageAmount(req.session.userId);
                const gapStart=new Date(lastDate);
                //空白期間の開始日を設定(最終投稿の翌日)
                gapStart.setDate(gapStart.getDate()+1);

                const gapEnd=new Date(currentDate);
                //空白期間の開始日を設定(今回の投稿の前日)
                gapEnd.setDate(gapEnd.getDate()-1);

                gapInfo={
                    detected:true,
                    startDate:gapStart.toISOString().split("T")[0],
                    endDate:gapEnd.toISOString().split("T")[0],
                    daysCount:diffDays-1,
                    suggestedAmount:avgAmount
                };
            }
        }
        
        const todayStr=getLocalDate();
        
        let newTotalPoints = user.points;
        let newStreak=user.login_streak;
        let pointsToAdd=0;
        let shouldUpdateDate=false;
        if(expense_date<todayStr){
            //過去分を登録した場合
            pointsToAdd=50;
            shouldUpdateDate=false;
        }else{


            if(user.last_post_date!==todayStr){
            //今日既にポイントをもらっていたら何もしない
            // まず getLocalDate() で取得した JST の「今日」から Date オブジェクトを（安全に）作成
            // "2025-10-20" -> "2025-10-20T00:00:00+09:00" として解釈させる
            
                const todayJstDate = new Date(todayStr + "T00:00:00+09:00"); 

            // その日付のまま 1 日引く
                todayJstDate.setDate(todayJstDate.getDate() - 1); 
            
            // "YYYY-MM-DD" 形式にフォーマットし直す (JSTの「昨日」)
                const yesterdayStr = todayJstDate.getFullYear() + '-' + 
                                ('0' + (todayJstDate.getMonth() + 1)).slice(-2) + '-' + 
                                ('0' + todayJstDate.getDate()).slice(-2);

            

            //連続記録ボーナス
                if(user.last_post_date===yesterdayStr){//2日目以降
                    newStreak+=5;
                    pointsToAdd=100+(newStreak*10);//二日目=200pt,3日目=250pt
                }else{//1日目ならこっち
                    newStreak=5;
                    pointsToAdd=100;
                }
                shouldUpdateDate=true
            }   
        }
        if(pointsToAdd>0){
            newTotalPoints=user.points+pointsToAdd;
            if(shouldUpdateDate){
                //当日の場合、継続記録を伸ばす
                await updateUserGachaStats(req.session.userId,{
                    points:newTotalPoints,
                    streak:newStreak,
                    lastPostDate:todayStr
                });
            }else{//過去の場合はただポイントを更新するだけ
                await updateUserPoints(req.session.userId,newTotalPoints);
            }
        }   
        
        res.status(200).json({ 
            message: "Expense added", 
            gapInfo: gapInfo, 
            newTotalPoints: newTotalPoints,
            addedExpense: createdExpenseData // これをフロント側でリストに追加する
        });
    }catch(error){
         console.error("食事記録の追加中にエラー",error);
         res.status(500).send("Server error during expense creation");
    }
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

//全ユーザーの食費・飲み会代を取得
router.get("/summary/:month",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        const {month}=req.params;
         

        const summaries=await getMonthlySummarize(month);
        res.json(summaries);
        //summaries=[{username:xxx,foodTotal:xxxx,nomikaiTotal:xxxx},...]
    }catch(error){
        console.error("月次集計の取得中にエラー:",error);
        res.status(500).send("Server error");
    }
});
//空白期間の一括埋め合わせ
router.post("/expenses/bulk",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        const {startDate,endDate,amount,meal_type,description}=req.body;
        const start=new Date(startDate);
        const end=new Date(endDate);
        let count=0;
        for (let d=new Date(start); d<=end;d.setDate(d.getDate()+1)){
            const dateStr=d.toISOString().split("T")[0];
            //未登録分を連続して登録
            await createExpense(req.session.userId,{
                amount:Number(amount),
                photo_path:null,
                description:description||"未登録分",
                expense_date:dateStr,
                meal_type:meal_type||"other",
                nomikai:0
            });
            count++;
        }
        res.status(200).json({message:"未登録分を加えました"})
    }catch(error){
        console.error("一括登録中にエラー：",error);
        res.status(500).send("Server error during bulk insert");
    }
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
        if(comment.authorId!==req.session.userId&&req.session.role !=="admin"){//自分が書いたコメントじゃなかったら
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
//ガチャ
router.post("/gacha/pull",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        const GACHA_COST=100;//ガチャ一回
        const user=await getUserById(req.session.userId)

        if(user.points<GACHA_COST){
            return res.status(400).json({message:"ポイントが足りません。"})
        }
        const CHARACTER_CHANCE=2;//各キャラの排出確率
        const DIALOGUE_CHANCE=3;//各セリフの排出確率
        let totalPrizeChance=0

        //景品リスト
        const {characters,dialogues}=await getGachaItems();
        const prizePool=[
            ...characters.map(c=>{
                totalPrizeChance +=CHARACTER_CHANCE;
                return{type:"character",item:c,chance:CHARACTER_CHANCE};
            }),
            ...dialogues.map(d=>{
                totalPrizeChance +=DIALOGUE_CHANCE;
                return{type:"dialogue",item:d,chance:DIALOGUE_CHANCE};
            }),
        ]
        //100%から景品を引いた確率がポイント
        const pointsChance=100-totalPrizeChance;
        if(pointsChance>0){
            prizePool.push({type:"points",item:{name:"50ポイント"},chance:pointsChance});
        }
        //console.log("--- Gacha Prize Pool Debug ---", prizePool);
        let random=Math.random()*100;
        let wonPrize=null;
        for(const prize of prizePool){
            random -=prize.chance;//仕組みは下で説明する
            if(random<=0){
                wonPrize=prize;
                break;
            }
        }
        
        let newTotalPoints=user.points-GACHA_COST;
        let isNew=true;//新規かどうか
        let message="";

        if(wonPrize.type==="character"){
            isNew=await unlockCharacter(user.id,wonPrize.item.id);
            if(!isNew){
                message=`${wonPrize.item.name}は既に仲間です!代わりに50ポイント獲得!`
                newTotalPoints+=50;
            }
        }else if(wonPrize.type==="dialogue"){
            isNew=await unlockDialogue(user.id,wonPrize.item.id);
            if(!isNew){
                message=`このセリフは既に解放済みです!代わりに20ポイント獲得!`
                newTotalPoints+=20;
            }
        }else if(wonPrize.type==="points"){
            newTotalPoints+=50;
            }
        await updateUserPoints(user.id,newTotalPoints);
        res.status(200).json({
            prize:wonPrize.item,
            type:wonPrize.type,
            isNew:isNew,
            message:message,
            newTotalPoints:newTotalPoints
        });

    }catch(error){
        console.error("ガチャ中にエラー:",error);
        res.status(500).send("Server error");
    }
})

//解放キャラ取得
router.get("/characters/unlocked",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        const characters=await getUnlockedCharacterByUserId(req.session.userId);
        res.status(200).json(characters);
    }catch(error){
        console.error("解放済みキャラの取得中にエラー:",error);
        res.status(500).send("Server error");
    }
})

//解放セリフ取得
router.get("/dialogues",async(req,res)=>{
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    try{
        const dialogues=await getUnlockedDialoguesByuserId(req.session.userId);
        res.status(200).json(dialogues);
    }catch(error){
        console.error("セリフの取得中にエラー:",error);
        res.status(500).send("Server error")
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

/*ガチャの仕組み
景品リスト(ポイント含む)の確率は合計で100,
最初に生成されたランダムな値から景品の確率を順番に差し引く
exp)
ランダムな値=35
景品Aの確率=10
景品Bの確率=30

1回目：35-10=25>0
景品Aゲットならず、次のループへ
2回目：25-30=-5<0
景品Bゲット！終了！

*/