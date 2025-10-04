import React from "react";
import API_BASE_URL from "../config";
import './CharacterSelectionModal.css';

const characters = [
    { id: 'char0', name: 'まんぷくん', imageUrl: '/Manpukun.png' },
    { id: 'char1', name: 'ふっしゃん', imageUrl: '/Fusshan.png' },
    { id: 'char2', name: 'ともくん', imageUrl: '/Tomokun.png' },
    { id: 'char3', name: 'AYA', imageUrl: '/AYA.png' },
];

function CharacterSelectionModal({onClose,onCharacterSelect}){
    const handleSelect=async(characterId)=>{
        //選んだキャラクターをサーバーに送信してDBに保存
        const response=await fetch(`${API_BASE_URL}/api/user/character`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({character:characterId}),
            credentials: 'include'
        });
        if(response.ok){
            const data=await response.json();
            onCharacterSelect(data.selected_character);//親コンポーネントに選んだキャラを伝える
            onClose();//モーダルを閉じる
        }else{
            alert("キャラクターの保存に失敗しました");
        }
    };
    return(
        <div className="modal-backdrop">
            <div className="modal-content">
                <h3>お供を選んでね！</h3>
                <div className="character-grid">
                    {characters.map(char=>(
                        <div key={char.id} className="character-card" onClick={()=>handleSelect(char.id)}>
                            <img src={char.imageUrl} alt={char.name} style={{width:"100px",height:"100px"}}/>
                            <p>{char.name}</p>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={onClose} style={{marginTop:"1rem"}}>閉じる</button>
            </div>
        </div>
    );
}
export default CharacterSelectionModal;