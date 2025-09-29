import React,{useState,useEffect} from "react";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import API_BASE_URL from "../config";

function CommentModal({expense,onClose}){
    const [comments,setComments]=useState([]);
    const fetchComment=async()=>{
        const response=await fetch(`${API_BASE_URL}/api/expenses/${expense.id}/comments`);
        if(response.ok){
            const data=await response.json();
            setComments(data);
        }
    };
    useEffect(()=>{
        fetchComment();
    },[expense.id]);//モーダルが開かれたらコメントを取得

    const handleAddComment=async(content)=>{
        const response=await fetch(`${API_BASE_URL}/api/expenses/${expense.id}/comments`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({content},)
        });
        if (response.ok){
            fetchComment();//投稿が成功したらリストを再取得して更新
        }
    };

    return(
        <div className="modal-backdrop">
            <div className="modal-content">
                <h3>コメント-{expense.description}</h3>
                <div className="comment-list" style={{maxHeight:"300px",overflowY:"auto",marginBottom:"1rem"}}>
                    {comments.map(comment=>(
                        <CommentItem key={comment.id} comment={comment}/>
                    ))}
                </div>
                <CommentForm onAddComment={handleAddComment}/>
                <button type="button" onClick={onClose} style={{marginTop:"1rem"}}>閉じる</button>
            </div>
        </div>
    );
}
export default CommentModal;