import React from "react";
import "./MobileMenu.css";

function MobileMenu({onViewChange,onLogout,session}){
    const handleViewChange=(view)=>{
        onViewChange(view);//App.jsのsetViewを呼び出す(setViewはページの切り替わり担当)
    };

    return(
        <div className="mobile-menu">
            <button onClick={()=>handleViewChange("home")}>ホーム</button>
            <button onClick={()=>handleViewChange("summary")}>みんなのごはん</button>
            {session.role==="admin"&&(
                <button onClick={()=>handleViewChange("admin")}>管理者ページ</button>
            )}
            <button onClick={onLogout}>ログアウト</button>
        </div>
    );
}
export default MobileMenu;