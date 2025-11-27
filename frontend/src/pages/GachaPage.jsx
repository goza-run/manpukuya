import React,{useState,useEffect} from "react";
import API_BASE_URL from "../config";
import "./GachaPage.css";

function GachaPage({session,onUpdatePoints,points}){
    
    const[isDrawing,setIsDrawing]=useState(false);
    const[result,setResult]=useState(null);
    const[cutInCharacter,setCutinCharacter]=useState(null);
    const[silhouette,setSilhouette]=useState(false);

    const handlePullGacha=async()=>{
        if (isDrawing||cutInCharacter) return;//演出中は無効化
        setIsDrawing(true);
        setResult(null);
        try{
            const response=await fetch(`${API_BASE_URL}/api/gacha/pull`,{
                method:"POST",
                credentials:"include",
            });
            if(!response.ok){
                const errorData=await response.json();
                alert(errorData.message||"ガチャを引けませんでした。");
                setIsDrawing(false);
                return
            }
            const data=await response.json();
            if(data.type==="character"&&data.isNew){
                setIsDrawing(false);
                setCutinCharacter(data.prize);
                setSilhouette(true);

                setTimeout(()=>{
                    setCutinCharacter(null);
                    setResult(data);
                    setSilhouette(false); 
                    onUpdatePoints(data.newTotalPoints);
                },2500);
            }else{
            //結果発表表示アニメーションのためちょっと待つ
            setTimeout(()=>{
                setResult(data);
                setIsDrawing(false);
                onUpdatePoints(data.newTotalPoints);
            },2000)}
        }catch (error){
            alert("エラーが発生。");
            setIsDrawing(false);
        }
    };
    return(
        <div className="gacha-container">
            {cutInCharacter&&(
                <div className="cut-in-overlay">
                    <img
                        src={cutInCharacter.imageUrl}
                        alt={cutInCharacter.name}
                        className={"cut-in-image silhouette"}
                    />
                </div>
            )}
            <h2>お供ガチャ</h2>
            <div className="points-display">
                あなたのポイント:<span>{points.toLocaleString()}pt</span>
            </div>
            <img
            src={"/manpukuya_gacha_2.png"}
            alt="ガチャキャンペーン"
            style={{ maxWidth: '100%', height: 'auto', margin: '1rem 0' }}
            />
            <button onClick={handlePullGacha} disabled={isDrawing||points<100}>
                {isDrawing?"抽選中...":"ガチャを引く"}
            </button>
            {isDrawing&&(
                <div className="gacha-animation">
                    <p>ガラガラ</p>
                </div>
            )}
            {result&&(
                <div className="gacha-result">
                    <h3>結果発表!</h3>
                    {result.type==="character"&&(
                        <div>
                            <p>{result.isNew?"新しい仲間！":"既に仲間です！"}</p>
                            <img 
                                src={result.prize.imageUrl} 
                                alt={result.prize.name} 
                                style={{ width: '50px', height: '50px' }} 
                            />
                            <h4>{result.prize.name}</h4>
                        </div>
                    )}
                    {result.type==="dialogue"&&(
                        <div>
                            <p>{result.isNew?"新しいセリフをゲット！":"セリフは解放済みです！"}</p>
                            <p className="dialogue-text">「{result.prize.text}」</p>
                        </div>    
                    )}
                    {result.type==="points"&&(
                        <div>
                            <p>残念！また挑戦してね</p>
                            <h4>{result.prize.name}</h4>
                        </div>
                    )}
                    {result.message&&<p className="bonus-message">{result.message}</p>}
                    <button onClick={()=>setResult(null)}>閉じる</button>
                </div>
            )}
        </div>
    );
}

export default GachaPage;