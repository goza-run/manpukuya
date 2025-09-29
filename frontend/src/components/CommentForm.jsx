import React, {useState} from "react";


function CommentForm({onAddComment}){
    const [content,setContent]=useState("");

    const handleSubmit=(e)=>{
        e.preventDefault();
        if(!content.trim()) return;
        //trimは空白を取り除く作業、もしcontentが空白取り除いて空っぽだったら何もしないといっている
        onAddComment(content);
        setContent("");
    };
    return(
        <form onSubmit={handleSubmit} style={{marginTop:"1rem"}}>
            <textarea
                value={content}
                onChange={(e)=>setContent(e.target.value)}
                placeholder="コメントを入力"
                style={{width:"100%",minHeight:"60px"}}
                required
            />
            <button type="submit">コメントを投稿</button>
        </form>
    );
}
export default CommentForm;