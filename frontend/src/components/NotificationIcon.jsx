import React from "react";
import "./NotificationIcon.css";

function NotificationIcon({unreadCount,onClick}){
    return(
        <div className="notification-icon-container" onClick={onClick}>
            <span className="bell-icon">🔔</span>
            {unreadCount>0&&(
                <span className="notification-badge">{unreadCount}</span>
            )}
        </div>
    );
}
export default NotificationIcon;    