import React, { useEffect, useState } from 'react'
import './App.css'
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import AdminPage from './pages/AdminPage.jsx';
import API_BASE_URL from './config.js';
import { defaultCharacter } from './characters.js';
import { characters } from './characters.js';

function App() {
  //ログイン認証のステート
  //ログイン状態か表すステート
  const[isLoading,setIsLoading]=useState(true);
  const[view,setView]=useState("home");//表示画面切り替え(home or admin)
  const[session,setSession]=useState({
    isLoggedIn:false,//最初はログインしていない
    role:null,
    userId:null
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
        selected_character:data.selected_character
      });
      setIsLoading(false);
    };
    checkLoginStatus();
  },[]);//空の配列を指定して最初のマウント時(初めて画面が出力される瞬間)に一度実行されるようになる

  //sessionが変わるたびにアイコンを更新
   useEffect(() => {
    if (session.isLoggedIn && session.selected_character) {
        const characterId = session.selected_character;
        const characterInfo=characters.find(char => char.id === characterId)||defaultCharacter;
        const characterName = characterInfo.name;

        const favicon=document.getElementById("favicon");
        if(favicon){
            favicon.href=`/${characterId}.png`;
        }
        const appleIcon=document.getElementById("apple-touch-icon");
        if(appleIcon){
            appleIcon.href=`/${characterId}.png`;
        }
        const manifestLink=document.getElementById("manifest");
        if(manifestLink){
            const manifestData={
                "name":"満伏屋 with ${characterName}",
                "short_name":characterName,
                "icons":[
                    {
                        "src":`/${characterId}.png`,
                        "sizes":"192x192",
                        "type":"image/png"
                    },
                    {
                        "src":`/${characterId}.png`,
                        "sizes":"512x512",
                        "type":"image/png"
                    }
                ],
                "start_url":".",
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
      userId:user.id//user 
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
    }
  };
  const handleCharacterSelect=async(newCharacter)=>{
    setSession(prevSession=>({
      ...prevSession,
      selected_character:newCharacter
    }));
  };

    //バックエンドにも更新を送る
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
            borderBottom:"1px solid #ccc"}}>
            <button onClick={()=>setView("home")}>ホーム</button>
            {session.role==="admin"&& (
              <button onClick={()=>setView("admin")}>管理者ページ</button>
            )}
            <button onClick={handleLogout}>ログアウト</button>
          </nav>

          {view==="home" && <HomePage session={session} onCharacterSelect={handleCharacterSelect}/>}
          {view==="admin" && session.role === "admin"&&<AdminPage session={session}/>}
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
