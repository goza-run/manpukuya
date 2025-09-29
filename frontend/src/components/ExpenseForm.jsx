
import {useState} from "react";
import heic2any from "heic2any";

// 今日の日付を YYYY-MM-DD 形式で取得するヘルパー関数(あんまいらんかも)

const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};
//newdateは現在のコンピューター日時に関する情報を全て持っているやつ、それを見える形に直したのtoISOString()
//ここまでだと2025-09-17T09:30:00.000Zという感じになるのでを境に二つの要素のリストを作り、その0番目
//2025-09-17を取り出す

function ExpenseForm({onAddExpense}){//onAddExpense=handleAddExpense
//金額、写真、説明のステートを定義
    const[amount,setAmount]=useState("");
    const[photo,setPhoto]=useState(null);
    const[isConverting,setIsConverting]=useState(false);
    const[description,setDescription]=useState("");
    const[expense_date,setExpenseDate]=useState(getTodayString());//初期値は今日の日付にしておく
    const[meal_type,setMealType]=useState("breakfast")//初期値は朝にしておく
//スマホの画像ファイルを変換するシステム
    const handleFileChange=async(e)=>{
        const file=e.target.files[0];
        if(!file) return;
        console.log("ファイルが選択されました:", file);
        const fileName=file.name.toLowerCase();//ファイル名全部小文字に(.HEIC,.Heic,.heic=>.heicに統一)
        if(fileName.endsWith(".heic")||fileName.endsWith(".heif")){
            console.log("HEIC/HEIFファイルを検出。変換を開始します...");
            setIsConverting(true);//変換開始
            try{
                const convertedBlob=await heic2any({//heic2any=変換指示書
                    blob:file,//今投稿してもらったHEICを変換対象にしてね
                    toType:"image/jpeg",//変換後はjpegに
                    quality:0.8,//画質を80%に設定
                });
                //new File([元のデータ],ファイル名,ファイルの種類)
                const convertedFile=new File([convertedBlob],"converted.jpeg",{type:"image/jpeg"});
                console.log("変換が成功しました:", convertedFile);
                setPhoto(convertedFile);
            }catch(error){
                console.error("HEIC変換エラー：",error);
                alert("写真の変換に失敗しました");
            }finally{
                setIsConverting(false);
            }
        }else{
            //HEICじゃないならそのまんま
            console.log("HEIC/HEIFではないため、そのまま使用します。");
            setPhoto(file);
        }
    }
//フォーム送信時の関数
    const handleSubmit=async(e)=>{//LoginFormにあるやつとは同じ名前だけど違うよ
        e.preventDefault();//フォームの送信アクションを停止
//新しい食費データオブジェクトを作成
        const formData=new FormData();
        formData.append("amount",amount);//amountという名前でデータ(amount)を登録するよ
        formData.append("description",description)
        formData.append("expense_date",expense_date)
        formData.append("meal_type",meal_type)
        if (photo){//このphotoはバックエンドのupload.single("photo")と名前を合わせる
            formData.append("photo",photo);
        }

        await onAddExpense(formData);//それをonAddExpense関数に当てて追加してもらう
        setAmount("");//追加した後は入力ステートを初期化
        setPhoto(null);
        setDescription("");
        setExpenseDate(getTodayString());
        setMealType("breakfast");
        e.target.reset();
    };
    return(//必須項目だけrequiredとしている
    <form onSubmit={handleSubmit}>
        <input
            type="date"//ここで取り出せるのは2025-09-17のような形
            value={expense_date}
            onChange={(e)=>setExpenseDate(e.target.value)}
            required
        />
        <select
            value={meal_type}
            onChange={(e)=>setMealType(e.target.value)}
            required
        >
            <option value="breakfast">朝</option>
            <option value="lunch">昼</option>
            <option value="dinner">夜</option>
            <option value="other">その他</option>
        </select>
        <input
            type="number"
            value={amount}//valueは入力欄に表示される値
            onChange={(e)=>setAmount(e.target.value)}
//setAmountを今入力した値にすることでamountに入力したものがそのまま出力される
            placeholder="Amount"
            required
        />
        <input
            type="file"
            accept="image/*,.heic,.heif"//画像ファイル、HEIC/HEIFのみOK
            onChange={handleFileChange}
            placeholder="photo"
        />
        {/*変換中にメッセージを表示*/}
        {isConverting&&<p>写真を送信中...</p>}
        <textarea
            value={description}
            onChange={(e)=>setDescription(e.target.value)}
            placeholder="description"
            required
        ></textarea>
        <button type="submit" disabled={isConverting}> {/* 変換中はボタンを無効化 */}
            食事を記録</button>
    </form>
    )
}

export default ExpenseForm;