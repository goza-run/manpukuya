import React from "react";

function CommentItem({comment}){
    const itemStyle={
        border:"1px solid #eee",
        padding:"10px",
        margin:"5px 0",
        borderRadius:"5px",
        backgroundColor:comment.authorRole==="admin" ? "#fffde7":"#f9f9f9"
    };
    const displayTime=new Date(comment.created_at).toLocaleString("ja-JP")//日本の形式に日時を変換

    return(
        <div style={itemStyle}>
            <p><strong>{comment.authorName}</strong>
            <span style={{fontSize:"0.8em",color:"#888"}}>{displayTime}</span></p>
            <p style={{margin:0}}>{comment.content}</p>
        </div>
    );
}
export default CommentItem;