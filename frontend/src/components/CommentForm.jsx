import React, {useState} from "react";
import heic2any from "heic2any";

function CommentForm({onAddComment}){//onAddComment=handleAddComment
    const [content,setContent]=useState("");
    const [photo,setPhoto]=useState(null);
    const [isConverting, setIsConverting] = useState(false);

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

    const handleSubmit=async(e)=>{
        e.preventDefault();//フォームの送信アクションを停止
//新しい食費データオブジェクトを作成
        if(!content.trim()&&!photo){
            alert("コメントか写真のどちらかを入力してください");
            return;
        }   
        const formData=new FormData();
        formData.append("content",content);//amountという名前でデータ(amount)を登録するよ
        if (photo){//このphotoはバックエンドのupload.single("photo")と名前を合わせる
            formData.append("photo",photo);
        }
        await onAddComment(formData);//それをonAddExpense関数に当てて追加してもらう
        setContent("");//追加した後は入力ステートを初期化
        setPhoto(null);
        e.target.reset();
    };
    return(
        <form onSubmit={handleSubmit} style={{marginTop:"1rem"}}>
            
            <textarea
                value={content}
                onChange={(e)=>setContent(e.target.value)}
                placeholder="コメントを入力"
                style={{width:"100%",minHeight:"60px"}}
            />
            <input
            type="file"
            accept="image/*,.heic,.heif"//画像ファイル、HEIC/HEIFのみOK
            onChange={handleFileChange}
            placeholder="photo"
            />
            {/*変換中にメッセージを表示*/}
            {isConverting&&<p>写真を送信中...</p>}
            <button type="submit">コメントを投稿</button>
        </form>
    );
}
export default CommentForm;