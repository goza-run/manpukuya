import React, {useState} from "react";

function Budget({budget,onSetBudget}){
    const [isEditing,setIsEditing]=useState(false);
    const [amount,setAmount]=useState(budget?budget.amount:"");

    const handleSave=()=>{
        onSetBudget(amount);
        setIsEditing(false);
    };
    if(isEditing){
        return(
            <div>
                <input
                    type="number"
                    value={amount}
                    onChange={(e)=>setAmount(e.target.value)}
                    placeholder="目標金額"
                />
                <button onClick={handleSave}>保存</button>
                <button onClick={()=>setIsEditing(false)}>キャンセル</button>
            </div>
        );
    }
    return(
        <div>
            <span>
                今月の目標金額：{budget ? `${budget.amount}円`:"設定してね"}
            </span>
            <br></br>
            <button onClick={()=>setIsEditing(true)}>編集</button>
        </div>
    );
}
export default Budget;