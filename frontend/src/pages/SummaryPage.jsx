import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import "./SummaryPage.css";

function SummaryPage(){
    const [summaries,setSummaries]=useState([]);
    const [currentMonth]=useState(new Date().toISOString().substring(0,7));
    const [isLoading,setIsLoading]=useState(true);

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
            <h2>{currentMonth}の集計</h2>
            <table className="summary-table">
                <thead>
                    <tr>
                        <th>ユーザー名</th>
                        <th>食費合計</th>
                        <th>飲み会代合計</th>
                    </tr>
                </thead>
                <tbody>
                    {summaries.map((userSummary,index)=>(
                        <tr key={index}>
                            <td>{userSummary.username}</td>
                            <td>{userSummary.foodTotal.toLocaleString()}円</td>
                            <td>{userSummary.nomikaiTotal.toLocaleString()}円</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
export default SummaryPage;