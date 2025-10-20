import React, { useEffect, useState } from 'react'
import './App.css'
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import AdminPage from './pages/AdminPage.jsx';
import API_BASE_URL from './config.js';
import NotificationIcon from './components/NotificationIcon.jsx';
import NotificationList from './components/NotificationList.jsx';
import HamburgerIcon from './components/HamburgerIcon.jsx';
import MobileMenu from './components/MobileMenu.jsx';
import SummaryPage from './pages/SummaryPage.jsx';
import { defaultCharacter } from './characters.js';
import { characters } from './characters.js';
import GachaPage from './pages/GachaPage.jsx';

function App() {
  //ログイン認証のステート
  //ログイン状態か表すステート
  const[isLoading,setIsLoading]=useState(true);
  const[view,setView]=useState("home");//表示画面切り替え(home or admin)
  const[notifications,setNotifications]=useState([]);//通知の配列
  const[isNotificationOpen,setIsNotificationOpen]=useState(false);//通知リストが開いているかどうか
  const notificationIconRef=React.useRef(null);
  //useRefはrefに入れることでdivなどのDOM要素を直接参照できるようになる
  const notificationListRef=React.useRef(null);
  const [isMobileMenuOpen,setIsMobileMenuOpen]=useState(false);
  const[targetNotiId,setTargetNotiId]=useState(null)
  //targetNotiIdは通知ボタンが押された際にどんな行動をするか？
  const[session,setSession]=useState({
    isLoggedIn:false,//最初はログインしていない
    role:null,
    userId:null,
    points:0
  });
//画面更新などが合ってもログインを継続する
// (これがないといちいち打ち込んでログインしないといけない)
  useEffect(()=>{
    const checkLoginStatus=async()=>{
      const response=await fetch(`${API_BASE_URL}/api/session`,{
        credentials: 'include'
      });
//routes.jsでセッション中だったらtrue,そうでなければfalseが帰ってくる
      const data=await response.json();
      //data={isLoggedIn:true,role:"admin",userId:1}みたいな感じ
      setSession({
        isLoggedIn:data.isLoggedIn,
        role:data.role,
        userId:data.userId,
        selected_character:data.selected_character,
        points:data.points
      });
      setIsLoading(false);
    };
    checkLoginStatus();
  },[]);//空の配列を指定して最初のマウント時(初めて画面が出力される瞬間)に一度実行されるようになる
  //通知を取得する
  useEffect(()=>{
    if(session.isLoggedIn){
      const fetchNotifications=async()=>{
        const response=await fetch(`${API_BASE_URL}/api/notifications`,{
          credentials: 'include'
        });
        if(response.ok){
          const data=await response.json();
          setNotifications(data);
        }
      };
      fetchNotifications();

      const intervalId=setInterval(fetchNotifications,15000);//15秒ごとに通知を取得
      return()=>clearInterval(intervalId);//クリーンアップ関数、ログアウト時やコンポーネントが不要になったときにintervalをクリアする
    }else{
      setNotifications([]);//ログアウトしたら通知を空にする
    }
  },[session.isLoggedIn]);//ログイン状態が変わるたびに実行
  //通知リストを開いたときに既読にする
  const handleNotificationIconClick=async()=>{
    const currentlyOpen=!isNotificationOpen;
    setIsNotificationOpen(currentlyOpen);//これからどういう状態になるか
    //もし開いたときに未読があったら既読にする
    if(currentlyOpen&&unreadCount>0){//これから開く&&未読がある
      //画面上では既読にする
      const updateNotifications=notifications.map(n=>({
        ...n,
        is_read:true
      }));
      setNotifications(updateNotifications);
      //バックエンドにも更新を送る
      await fetch(`${API_BASE_URL}/api/notifications/read`,{
        method:"POST",
        credentials: 'include'
      });
    }
  };
  //外側クリックで閉じる
  useEffect(()=>{
    const handleClickOutside=(event)=>{
      if(
        /*notificationIconRef.currentで
        <div ref={tionListRef}>
              <NotificationList 
                notifications={notifications}
              />
        </div>
        を引きずりだす、この画面が表示されててなおかつ
        !notificationIconRef.current.contains(event.target)で
        クリックされた場所がnotificationIconRef.current(ベル)の中じゃなかったら閉じる
        さらに
        notificationListRef.current&&
        !notificationListRef.current.contains(event.target)
        で通知リストの中でもなかったら閉じる
        つまりベルでも通知リストでもなかったら閉じる
        */
        notificationIconRef.current&&!notificationIconRef.current.contains(event.target)&&
        notificationListRef.current&&
        !notificationListRef.current.contains(event.target)
      ){
        setIsNotificationOpen(false); 
      }
    }
    if(isNotificationOpen){
      document.addEventListener("mousedown",handleClickOutside);
    //addEventListener=次のイベントを追加する
    //mousedown=クリックした瞬間に発火するイベント
    }
    return()=>{
      document.removeEventListener("mousedown",handleClickOutside);
    }
    //removeEventListener=次のイベントを削除する
  },[isNotificationOpen]);  

  //通知がクリックされた時の処理
  const handleNotificationClick=(notification)=>{
    if(view!=="home"){
      setView("home");
    }
    setTargetNotiId(notification.expenseId);
    setIsNotificationOpen(false);
  }
  
  //sessionが変わるたびにアイコンを変える
   useEffect(() => {
    if (session.isLoggedIn && session.selected_character) {
        const characterId = session.selected_character;
        const characterInfo=characters.find(char => char.id === characterId)||defaultCharacter;
        const characterName = characterInfo.name;

        const favicon=document.getElementById("favicon");
        if(favicon){
            favicon.href=characterInfo.imageUrl;//index.htmlのfaviconを書き換える
        }
        const appleIcon=document.getElementById("apple-touch-icon");
        if(appleIcon){
            appleIcon.href=characterInfo.imageUrl;
        }
        const manifestLink=document.getElementById("manifest");
        if(manifestLink){
            const manifestData={
                "name":`満伏屋 with ${characterName}`,
                "short_name":characterName,
                "icons":[
                    {
                        "src":`${window.location.origin}${characterInfo.imageUrl}`,
                        "sizes":"192x192",
                        "type":"image/png"
                    },
                    {
                        "src":`${window.location.origin}${characterInfo.imageUrl}`,
                        "sizes":"512x512",
                        "type":"image/png"
                    }
                ],
                "start_url":"/",
                "display":"standalone",
                "theme_color":"#ffffff",
                "background_color":"#ffffff"
            };
            const blob=new Blob([JSON.stringify(manifestData)],{type:"application/json"});
            const manifestURL=URL.createObjectURL(blob);
            manifestLink.href=manifestURL;
        }
  }},[session.selected_character,session.isLoggedIn]);
  const handleLogin=async(user)=>{
    //user={id:1,username:"xxx",role:"admin"}みたいな感じ
    setSession({
      isLoggedIn:true,
      role:user.role,
      userId:user.id,//user
      selected_character:user.selected_character,
      points:user.points 
    });
    setView("home");//ログインしたらホーム画面に飛ぶ
  };

  const handleLogout=async()=>{
    const response=await fetch(`${API_BASE_URL}/api/logout`,{
      method: "POST",
      credentials: 'include'
    });
    if(response.ok){
      setSession({
        isLoggedIn:false,
        role:null,
        userId:null
      });
      setView("home");
      setIsNotificationOpen(false);//通知リストを閉じる
    }
  };
  const handleCharacterSelect=async(newCharacter)=>{
    setSession(prevSession=>({
      ...prevSession,//sessionの他の情報をそのままコピー
      selected_character:newCharacter//selected_characterだけ新しい値に更新
    }));
  };
  const unreadCount=notifications.filter(n=>!n.is_read).length;
    //バックエンドにも更新を送る
  const handleUpdatePoints=(newPoints)=>{
    setSession(prev=>({...prev,points:newPoints}));
  };


  if(isLoading){//上のuseEffectが機能していれば必ずfalseになる
    return<div>Loading...</div>
  }
  return (
		<div>
			{/* ログイン状態に応じてコンポーネントを切り替え */}
  
			{session.isLoggedIn ? (//isLoggedIn=trueならログイン中
				// ログイン中
				<div>
          <nav style={{
            display:"flex",//FlexBoxを有効にする
            justifyContent:"space-between",//両端に要素を配置
            alignItems:"center",//上下中央揃え
            padding:"1rem",
            borderBottom:"1px solid #ccc",
            }}>
            {/*PC用のメニュー*/}
            <div className="desktop-nav">
              <button onClick={()=>setView("home")}>ホーム</button>
              <button onClick={()=>setView("summary")}>みんなのごはん</button>
              <button onClick={()=>setView("gacha")}>ガチャ</button>
              {session.role==="admin"&& (
                <button onClick={()=>setView("admin")}>管理者ページ</button>
            )}
            </div>
            <div style={{display:"flex",alignItems:"center"}}>
              <div ref={notificationIconRef}>
                <NotificationIcon
                  unreadCount={unreadCount}
                  onClick={handleNotificationIconClick} 
                />
              </div>
              <div className="desktop-nav">
                <button onClick={handleLogout} style={{marginLeft:"1rem"}}>ログアウト</button>
              </div>
              <div className="mobile-nav">
                <HamburgerIcon 
                  onClick={()=>
                    setIsMobileMenuOpen(!isMobileMenuOpen)
                  }/>
              </div>
            </div>
          </nav>
            {/*スマホ用のメニュー*/}
            {isMobileMenuOpen&&(
              <MobileMenu 
                session={session}
                onViewChange={(view)=>{
                  setView(view);
                  setIsMobileMenuOpen(false);//メニューを閉じる
                }}
                onLogout={()=>{
                  handleLogout();
                  setIsMobileMenuOpen(false);//メニューを閉じる
                }}
              />
            )}
          {view==="home"&&(
            <HomePage
              session={session}
              onCharacterSelect={handleCharacterSelect}
              targetNotiId={targetNotiId}
              onTargetNotiHandled={()=>setTargetNotiId(null)}
            />
          )}
          {view==="summary" && <SummaryPage/>}
          {view==="gacha"&&(<GachaPage 
                              session={session}
                              onUpdatePoints={handleUpdatePoints}
                              points={session.points||0}
                            />
          )}
          {view==="admin" && session.role === "admin"&&<AdminPage session={session}/>}
          {isNotificationOpen && (
            <div ref={notificationListRef}>
              <NotificationList 
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
              />
            </div>
          )}
          
        </div>
			) : (
				// 非ログイン時はLoginPageを表示
				<LoginPage onLogin={handleLogin} />//onLoginをhandleloginとしてLoginpageを描画
			)}
		</div>
  )

}
export default App;
/*Flexboxを使うと、主に以下のことができるようになります。

1. 簡単な横並び・縦並び
display: 'flex'を指定するだけで、中のアイテムが簡単に横一列に並びます。
flex-direction: 'column'とすれば、縦一列にすることもできます。
2.自在な配置（揃え）
justify-content: 水平方向の配置を決めます。
flex-start: 左揃え
center: 中央揃え
flex-end: 右揃え
space-between: 両端揃え（今回使ったもの）
space-around: 均等な間隔を空けて配置
align-items: 垂直方向の配置を決めます。
flex-start: 上揃え
center: 上下中央揃え（今回使ったもの）
flex-end: 下揃え
3.順番の入れ替え
HTMLの構造を変えずに、CSSだけで表示される順番を入れ替えることができます。
*/
