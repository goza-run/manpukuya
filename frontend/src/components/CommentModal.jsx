import React,{useState,useEffect} from "react";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import API_BASE_URL from "../config";
import CommentList from "./CommentList";
function CommentModal({expense,onClose,session}){
    const [comments,setComments]=useState([]);
    const fetchComment=async()=>{
        const response=await fetch(`${API_BASE_URL}/api/expenses/${expense.id}/comments`,{
            credentials: 'include'
        });
        if(response.ok){
            const data=await response.json();
            setComments(data);
        }
    };
    useEffect(()=>{
        fetchComment();
    },[expense.id]);//モーダルが開かれたらコメントを取得

    const handleAddComment=async(formData)=>{
        const response=await fetch(`${API_BASE_URL}/api/expenses/${expense.id}/comments`,{
            method:"POST",
            body: formData,
            credentials: 'include'
        });
        if (response.ok){
            fetchComment();//投稿が成功したらリストを再取得して更新
        }
    };
    const handleDeleteComment=async(commentId)=>{
        if(!window.confirm("本当にこのコメントを削除しますか？")) return;
        const response=await fetch(`${API_BASE_URL}/api/comments/${commentId}`,{
            method:"DELETE",
            credentials: 'include'
        });
        if (response.ok){
            setComments(comments.filter(c=>c.id!==commentId));
        }else{
            alert("コメントの削除に失敗しました");
        }
    };

    return(
        <div className="modal-backdrop">
            <div className="modal-content">
                <h3>コメント-{expense.description}</h3>
                <div className="comment-list" style={{maxHeight:"300px",overflowY:"auto",marginBottom:"1rem"}}>
                <CommentList comments={comments} onDeleteComment={handleDeleteComment} session={session}/>
                </div>
                <CommentForm onAddComment={handleAddComment}/>
                <button type="button" onClick={onClose} style={{marginTop:"1rem"}}>閉じる</button>
            </div>
        </div>
    );
}
export default CommentModal;