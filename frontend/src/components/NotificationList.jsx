import React from "react";
import "./NotificationList.css";

const formatTimeAgo=(dateString)=>{
    const date=new Date(dateString);//過去の日時
    const now=new Date();
    const diffInSeconds=Math.floor((now-date)/1000);//現在と過去の日時差分を秒単位にする

    let interval=diffInSeconds/31536000;//31353600=60*60*24*365(一年)
    if(interval>1)return Math.floor(interval)+"年前";
    interval=diffInSeconds/2592000;//60*60*24*30(一ヶ月);
    if(interval>1)return Math.floor(interval)+"ヶ月前";
    interval=diffInSeconds/86400;//60*60*24(一日)
    if(interval>1)return Math.floor(interval)+"日前";
    interval=diffInSeconds/3600;//60*60(一時間)
    if(interval>1)return Math.floor(interval)+"時間前";
    interval=diffInSeconds/60;//60秒(一分)
    if(interval>1)return Math.floor(interval)+"分前";
    return "たった今";
};

function NotificationList({notifications,onNotificationClick=()=>{}}){
    if(notifications.length===0){
        return(
            <div className="notification-list-container">
                <div className="notification-item">通知はありません</div>
            </div>
        );
    }
    return(
        <div className="notification-list-container">
            {notifications.map((notification)=>(
                <div key={notification.id} className={`notification-item ${!notification.is_read? "unread":""}`}
                    onClick={()=>onNotificationClick(notification)}
                    style={{cursor:"pointer"}}
                >
                    <p><strong>{notification.senderName}</strong>さんがあなたの投稿にコメントしました。</p>
                        <span className="notification-time">{formatTimeAgo(notification.created_at)}</span>
                </div>
            ))}
        </div>
    );
}
export default NotificationList;