import React from 'react';
import LoginForm from '../components/LoginForm';
function LoginPage({ onLogin }) {
	return (
		<div>
			<h2>Login</h2>
			<LoginForm onLogin={onLogin} />
		</div>
	);//LoginFormにApp.jsからもらってきたonlogin(handleLogin)を適応
}
export default LoginPage;