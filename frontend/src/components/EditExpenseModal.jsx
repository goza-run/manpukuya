import React, {use, useState} from "react";
import "./EditExpenseModal.css";
import heic2any from "heic2any";

function EditExpenseModal({expense,onClose,onSave}){
    const[amount,setAmount]=useState(expense.amount);
    const[description,setDescription]=useState(expense.description);
    const[expense_date,setExpenseDate]=useState(expense.expense_date);
    const[meal_type,setMealType]=useState(expense.meal_type);
    const[newPhoto,setNewPhoto]=useState("null")
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
                setNewPhoto(convertedFile);
            }catch(error){
                console.error("HEIC変換エラー：",error);
                alert("写真の変換に失敗しました");
            }finally{
                setIsConverting(false);
            }
        }else{
            //HEICじゃないならそのまんま
            console.log("HEIC/HEIFではないため、そのまま使用します。");
            setNewPhoto(file);
        }
    }
    const handleSubmit=(e)=>{
        e.preventDefault();
        const formData=new FormData();
        formData.append("amount",amount);
        formData.append("description",description);
        formData.append("expense_date",expense_date)
        formData.append("meal_type",meal_type);
        if(newPhoto){
            formData.append("photo",newPhoto);
        }
        onSave(expense.id,formData);
    };
    return(
        <div className="modal-backdrop">
            <h2>食費を編集</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="date"
                    value={expense_date}
                    onChange={(e)=>setExpenseDate(e.target.value)}
                    required
                />
                <select
                    value={meal_type}
                    onChange={(e)=>setMealType(e.target.value)}
                >
                    <option value="breakfast">朝</option>
                    <option value="lunch">昼</option>
                    <option value="dinner">夜</option>
                    <option value="other">その他</option>
                </select>
                <input
                    type="number"
                    value={amount}
                    onChange={(e)=>setAmount(e.target.value)}
                    required
                />
                <textarea
                    value={description}
                    onChange={(e)=>setDescription(e.target.value)}
                    required
                ></textarea>
                <div>
                    <label>写真：</label>
                    {expense.photo_path&&!newPhoto&&(
                        <img src={expense.photo_path} alt="現在の写真" style={{ maxWidth: '100px', display: 'block' }} />
                    )}
                    <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        onChange={handleFileChange}
                    />
                    {isConverting && <p>写真を変換中...</p>}
                </div>
                <div className="modal-actions">
                    <button type="submit" disabled={isConverting}>保存</button>
                    <button type="button" onClick={onClose}>キャンセル</button>
                </div>
            </form>
        </div>
    );

}
export default EditExpenseModal;