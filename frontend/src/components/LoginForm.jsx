import { useState } from 'react';
import API_BASE_URL from '../config';
function LoginForm({ onLogin }) {
	// ユーザー名とパスワードのステートを定義
	const [username, setUsername] = useState('');//最初は空白の状態で置いとく
	const [password, setPassword] = useState('');
	// エラーメッセージのステートを定義
	const [error, setError] = useState('');
	// フォーム送信時に呼ばれる非同期関数//ExpenseFormにあるやつとは同じ名前だけど違うよ
	const handleSubmit = async (e) => {
		e.preventDefault(); // フォームの送信アクション停止
		// APIエンドポイントにログインリクエストを送信
		const response = await fetch(`${API_BASE_URL}/api/login`, {
			method: 'POST', // POSTリクエスト
			headers: {
				'Content-Type': 'application/json', // タイプをJSONに設定 
			credentials: 'include'
			},
			// ユーザー名とパスワードを設定
			body: JSON.stringify({ username,password}),
		});
		if (response.ok) { // レスポンスが成功した場合
			const userData= await response.json();
			// userDataにはuserIdではなくid,username,roleが入っている
			onLogin(userData);
 // onLogin関数を呼び出す、app.jsx=>LoginPage.jsx=>LoginFormの流れに従ってhandleLogin関数になっている
		} else {
			setError('Invalid username or password'); // エラーを設定
		}
	};
	return (
		<form onSubmit={handleSubmit}>
			<input
				type="text"
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				placeholder="Username"//placeholderはヒントのようなもの、別に意味はないよ
				required
			/>
			<input
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				placeholder="Password"
				required
			/>
			<button type="submit">Login</button>
			{error && <p>{error}</p>}
		</form>
	);//最後は論理アンド演算子(左のerrorがもし偽、もしくは空白であれば左のエラー(ステート設定したやつ)を実行する)
    //はじめっから空白なので何もなければ最後のやつは表示されない
}
export default LoginForm;
//usernameやpasswordを打ち込んでもらい、それをfetchでバックエンドに送ってもらい認証が完了するか(response.ok)
//確認してログイン認証を行う