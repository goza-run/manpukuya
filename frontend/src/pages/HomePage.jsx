import React from"react";
import { useState, useEffect } from 'react';
import ExpenseList from '../components/ExpenseList';
// ブックマーク追加フォームのコンポーネント
import ExpenseForm from '../components/ExpenseForm';
import EditExpenseModal from "../components/EditExpenseModal";
import Budget from "../components/Budget";
import CommentModal from "../components/CommentModal";

function HomePage({ onLogout }) {
	// 食費データの配列を管理するステートを定義
	const [expenses, setExpense] = useState([]);
	const[budget,setBudget]=useState(null);
	const [currentMonth,setCurrentMonth]=useState(new Date().toISOString().substring(0, 7))
	const[isEditModal,setIsEditModal]=useState(false);//モーダル=ちっちゃいウィンドウ
	const[editing,setIsEditing]=useState(null);
	const[commenting,setIsCommenting]=useState(null);

// []の中身がどんな時expenseを実行するかと言うもので今回みたいな空白の場合はページを開いた時のみになる
	// 食費データ、目標金額を取得する非同期関数
	const fetchExpense = async () => {
		// 食費データを取得するAPIリクエスト
		const expenseResponse = await fetch('/api/expenses');//methodを指定していないためrouter.getの方が出る
		if (expenseResponse.ok) { // レスポンスが成功した場合 
			const expenseData = await expenseResponse.json(); // JSONデータを取得
			setExpense(expenseData); // ステートにセット
		}
		//目標データを取得するAPIリクエスト
		const budgetResponse=await fetch(`/api/budget/${currentMonth}`);
		if(budgetResponse.ok){
			const budgetData=await budgetResponse.json();
			setBudget(budgetData);
		}
	};
	useEffect(() => {
		fetchExpense();
	}, [currentMonth]);//月が変わったら再取得
	//目標金額を設定する関数
	const handleSetBudget=async (amount)=>{
		const response=await fetch("/api/budget",{
			method:"POST",
			headers:{"Content-Type":"application/json"},
			body:JSON.stringify({month:currentMonth,amount:amount})	
		});
		if(response.ok){
			fetchExpense();
		}
	}; 
	// 新しい食費データを追加する非同期関数
	const handleAddExpense = async (formData) => {
	//ExpenseFormからもらった情報をformDataというもの1つにまとめてる
	// (別にformDataって名前じゃなくてもいいけどこっちの方が手間が省ける)
		const response = await fetch('/api/expenses', {
			method: 'POST', // POSTリクエスト
			body: formData, 
		});
		if (response.ok) { // レスポンスが成功した場合
			fetchExpense(); // リストを再取得して更新
		}
	};
	// 食費データを削除するための非同期関数
	const handleDeleteExpense = async (id) => {
		const response = await fetch(`/api/expenses/${id}`, {
			method: 'DELETE', // DELETEリクエスト
		});

		if (response.ok) { // レスポンスが成功した場合
			// 食費リストから削除したデータのidだけをのぞいた奴らで再収集
			setExpense(expenses.filter(expense => expense.id !== id));
            //expensesステートに入っているid(expense)と消したいidを参照している(別にexpenseである必要はない、ただの変数)
		}
	};
	//食事データを編集
	
	const handleUpdateExpense=async (id,formData)=>{
		const response=await fetch(`/api/expenses/${id}`,{
			method:"PUT",
			body:formData,
			//JSONはテキストや数値だけの時優秀、ファイルを使うときはformdata
		});
		if (response.ok){
			fetchExpense();//編集完了したらデータを再取得
			setIsEditModal(false);
		}
	};
	//編集ボタンが押された時
	const handleOpenEditModal=(expense)=>{
		setIsEditing(expense);
		setIsEditModal(true);
	}

	//配列を月毎にグループ分け（集約処理)
	const groupedExpenses=expenses.reduce((acc,expense)=>{
		const month=expense.expense_date.substring(0,7);//2025-09-17から2025-09だけ取り出す
		//もしその月がまだなければ新しくリストを作る
		if(!acc[month]){
			acc[month]=[];
		}
		//その月のリストにexpenseデータを入れる
		acc[month].push(expense);
		//{"2025-09":[食事内容],"2025-08":[食事内容]}
		return acc;
	},{});//初期値は空のオブジェクト

	//月の並び替え(調整しないと辞書順で昔の日にちが上になるので逆にする)
	const sortedMonths=Object.keys(groupedExpenses).sort((a,b)=>b.localeCompare(a));
	//Object.keys()はオブジェクトのキー(今回は月の名前)を抜き出す

	//合計金額を計算(月毎で分けれない)
	//const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

	//reduceは集約処理、sumはこれまでの計算結果の保持、expenseが現在処理している配列の要素(別にexpenseである必要はない、ただの変数)
	//expensesのデータの1つ1つをexpenseで取り出し、そのうちamountのデータを取り出して1個ずつ計算する
	//sumの初期値は0
	return (//onLogout=handleLogout
		<div>
			<h2>満伏屋</h2>
			<hr/>
			<h3>{currentMonth}月の目標金額</h3>
			<Budget budget={budget} onSetBudget={handleSetBudget}/>
			<h3>食事を記録してね</h3>
			<ExpenseForm onAddExpense={handleAddExpense} />
			<hr />
			<h3>食事内容</h3>
			{sortedMonths.map(month=>{//sortedMonthsから月を順番にmonthに代入していく
				const monthlyExpenses=groupedExpenses[month];
				const monthlyTotal=monthlyExpenses.reduce((sum,expense)=>sum+expense.amount,0);
			//複数のシステムをグループ化するためにReact.Fragmentを用いる
				const monthlyBudget=month===currentMonth? budget:null;
				const remainingAmount=monthlyBudget? monthlyBudget.amount-monthlyTotal:null;
				const budgetStatusClass=remainingAmount<0 ? "budget-over":"budget-in-range"
				return(
					<React.Fragment key={month}>
						<h2>{month}(合計：{monthlyTotal}円)</h2>
						{remainingAmount!==null&&(
							<p className={budgetStatusClass}>
							目標まであと：{remainingAmount}円
							</p>
						)}
						<ExpenseList
							expenses={monthlyExpenses}
							onDeleteExpense={handleDeleteExpense}
							onEditExpense={handleOpenEditModal}
							//ここからeditingステートに入れる値をもらう
							onOpenComments={setIsCommenting}
							//ExpenseItemで食費記録をこの中に入れてもらう、
							//そうするとcommentingが更新されるのでCommentModalにその情報が届くようになる
						/>
					</React.Fragment>
				);
			})}
			{isEditModal&&(
				<EditExpenseModal
					expense={editing}
					onClose={()=>setIsEditModal(false)}
					onSave={handleUpdateExpense}
				/>
			)}
			{commenting&&(
				<CommentModal
					expense={commenting}
					onClose={()=>setIsCommenting(null)}
				/>
			)}
		</div>
	);
}
export default HomePage;