import React from "react";
import "./HamburgerIcon.css";

function HamburgerIcon({onClick}){
    return(
        //三本線のハンバーガーアイコンを作るよ
        <div className="hamburger-icon" onClick={onClick}>
            <div className="line"></div>
            <div className="line"></div>
            <div className="line"></div>
        </div>
    );
}
export default HamburgerIcon;