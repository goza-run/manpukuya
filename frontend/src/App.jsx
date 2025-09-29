import React, { useEffect, useState } from 'react'
import './App.css'
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import AdminPage from './pages/AdminPage.jsx';
import API_BASE_URL from './config.js';

function App() {
  //ログイン認証のステート
  const [isLoggedIn,setIsLoggedIn]=useState(false);
  //ログイン状態か表すステート
  const[isLoading,setIsLoading]=useState(true);
  const[role,setRole]=useState(null);
  const[view,setView]=useState("home");//表示画面切り替え(home or admin)
  
//画面更新などが合ってもログインを継続する
// (これがないといちいち打ち込んでログインしないといけない)
  useEffect(()=>{
    const checkLoginStatus=async()=>{
      const response=await fetch(`${API_BASE_URL}/api/session`,{
        credentials: 'include'
      });
//routes.jsでセッション中だったらtrue,そうでなければfalseが帰ってくる
      const data=await response.json();
      setIsLoggedIn(data.isLoggedIn);//ここのtrueかfalseかに従って画面が切り替わる
      setRole(data.role);
      setIsLoading(false);
    };
    checkLoginStatus();
  },[]);//空の配列を指定して最初のマウント時(初めて画面が出力される瞬間)に一度実行されるようになる

  const handleLogin=async(user)=>{
    setIsLoggedIn(true);
    setRole(user.role)
  };

  const handleLogout=async()=>{
    const response=await fetch(`${API_BASE_URL}/api/logout`,{
      method: "POST",
      credentials: 'include'
    });
    if(response.ok){
      setIsLoggedIn(false); 
      setRole(null);
      setView("home");
    }
  };

  if(isLoading){//上のuseEffectが機能していれば必ずfalseになる
    return<div>Loading...</div>
  }
  return (
		<div>
			{/* ログイン状態に応じてコンポーネントを切り替え */}
  
			{isLoggedIn ? (//isLoggedIn=trueならログイン中
				// ログイン中
				<div>
          <nav style={{
            display:"flex",//FlexBoxを有効にする
            justifyContent:"space-between",//両端に要素を配置
            alignItems:"center",//上下中央揃え
            padding:"1rem",
            borderBottom:"1px solid #ccc"}}>
            <button onClick={()=>setView("home")}>ホーム</button>
            {role==="admin"&& (
              <button onClick={()=>setView("admin")}>管理者ページ</button>
            )}
            <button onClick={handleLogout}>ログアウト</button>
          </nav>

          {view==="home" && <HomePage/>}
          {view==="admin" && role === "admin"&&<AdminPage/>}
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
