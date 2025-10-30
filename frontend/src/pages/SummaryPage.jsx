import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import "./SummaryPage.css";

const addMonths=(dateStr,months)=>{
    const date=new Date(dateStr+"-01T00:00:00+09:00");
    date.setMonth(date.getMonth()+months);
    //return date.toISOString().substring(0,7); toIdoISOStringがUTCになるため修正
    const year=date.getFullYear();
    const month=(date.getMonth()+1).toString().padStart(2,"0");
    //0始まりのため+1、padStartは2桁にするため
    return `${year}-${month}`;
   
};

function SummaryPage(){
    const [todayMonth]=useState(new Date().toISOString().substring(0,7));
    const [summaries,setSummaries]=useState([]);
    const [currentMonth,setCurrentMonth]=useState(todayMonth);
    const [isLoading,setIsLoading]=useState(true);
    const isFutureMonth=currentMonth>=todayMonth;
    useEffect(()=>{
        const fetchSummaries=async()=>{
            setIsLoading(true);
            const response=await fetch(`${API_BASE_URL}/api/summary/${currentMonth}`,{
                credentials: 'include'
            });
            if(response.ok){
                const data=await response.json();
                setSummaries(data);
            }
            setIsLoading(false);
        };
        fetchSummaries();
    },[currentMonth]);

    if(isLoading){
        return <div>読み込み中...</div>;
    }

    return(
        <div className="summary-container">
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:"1rem",margin:"1rem 0"}}>
                <button onClick={()=>{setCurrentMonth(addMonths(currentMonth,-1));}}>&lt; 前の月</button>
                <h2>{currentMonth}の集計</h2>
                <button onClick={()=>{setCurrentMonth(addMonths(currentMonth,1));}}
                    disabled={isFutureMonth}
                    >
                    次の月 &gt;</button>
            </div>
            
            <table className="summary-table">
                <thead>
                    <tr>
                        <th>ユーザー名</th>
                        <th>食費合計</th>
                        <th>飲み会代合計</th>
                    </tr>
                </thead>
                <tbody>
                    {summaries.length===0 ? (
                        <tr>
                            <td colSpan="3" style={{textAlign:'center'}}>データがありません。</td>
                        </tr>
                    ):(
                    summaries.map((userSummary,index)=>(
                        <tr key={index}>
                            <td>{userSummary.username}</td>
                            <td>{userSummary.foodTotal.toLocaleString()}円</td>
                            <td>{userSummary.nomikaiTotal.toLocaleString()}円</td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
    );
}
export default SummaryPage;