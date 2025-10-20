import React from"react";
import { useState, useEffect } from 'react';
import ExpenseList from '../components/ExpenseList';
// ブックマーク追加フォームのコンポーネント
import ExpenseForm from '../components/ExpenseForm';
import EditExpenseModal from "../components/EditExpenseModal";
import Budget from "../components/Budget";
import CommentModal from "../components/CommentModal";
import CharacterSelectionModal from "../components/CharacterSelectionModal";
import{characters,defaultCharacter} from "../characters";
import API_BASE_URL from "../config";
import "./HomePage.css";
import { useRef } from "react";

function HomePage({session,onCharacterSelect,targetNotiId,onTargetNotiHandled,onUpdatePoints}) {
	// 食費データの配列を管理するステートを定義
	const [expenses, setExpense] = useState([]);
	const[budget,setBudget]=useState(null);
	const [currentMonth,setCurrentMonth]=useState(new Date().toISOString().substring(0, 7))//今月の年月を取得(2025-09みたいな感じ)
	const[isEditModal,setIsEditModal]=useState(false);//モーダル=ちっちゃいウィンドウ
	const[editing,setIsEditing]=useState(null);
	const[commenting,setIsCommenting]=useState(null);
	const[isCharacterModal,setIsCharacterModal]=useState(false);
	const[dialogues,setDialogues]=useState([])//解放済みセリフ
	const[currentDialogue,setCurrentDialogue]=useState("")//表示中のセリフ
	const[characters,setCharacters]=useState([])//解放済みキャラ
	const[isJumping,setIsJumping]=useState(false)
	const timeoutIdRef=useRef(null);
	const audioRef=useRef(null)
	// 食費データ、目標金額を取得する非同期関数
	const fetchExpense = async () => {
		// 食費データを取得するAPIリクエスト
		const expenseResponse = await fetch(`${API_BASE_URL}/api/expenses`,{
			credentials: 'include'
		});//methodを指定していないためrouter.getの方が出る
		if (expenseResponse.ok) { // レスポンスが成功した場合 
			const expenseData = await expenseResponse.json(); // JSONデータを取得
			setExpense(expenseData); // ステートにセット
		}
		//目標データを取得するAPIリクエスト
		const budgetResponse=await fetch(`${API_BASE_URL}/api/budget/${currentMonth}`,{
			credentials: 'include'
		});
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
		const response=await fetch(`${API_BASE_URL}/api/budget`,{
			method:"POST",
			headers:{"Content-Type":"application/json"},
			body:JSON.stringify({month:currentMonth,amount:amount}),
			credentials: 'include'	
		});
		if(response.ok){
			fetchExpense();
		}
	}; 
	// 新しい食費データを追加する非同期関数
	const handleAddExpense = async (formData) => {
	//ExpenseFormからもらった情報をformDataというもの1つにまとめてる
	// (別にformDataって名前じゃなくてもいいけどこっちの方が手間が省ける)
		const response = await fetch(`${API_BASE_URL}/api/expenses`, {
			method: 'POST', // POSTリクエスト
			body: formData,
			credentials: 'include' 
		});
		if (response.ok) { // レスポンスが成功した場合
			const data=await response.json();//ポイントの更新をもらう
			if(data.newTotalPoints!==undefined){
				onUpdatePoints(data.newTotalPoints);
			}
			fetchExpense(); // リストを再取得して更新
		}
	};
	// 食費データを削除するための非同期関数
	const handleDeleteExpense = async (id) => {
		const response = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
			method: 'DELETE', // DELETEリクエスト
			credentials: 'include'
		});

		if (response.ok) { // レスポンスが成功した場合
			// 食費リストから削除したデータのidだけをのぞいた奴らで再収集
			setExpense(expenses.filter(expense => expense.id !== id));
            //expensesステートに入っているid(expense)と消したいidを参照している(別にexpenseである必要はない、ただの変数)
		}
	};
	//食事データを編集
	const handleUpdateExpense=async (id,formData)=>{
		const response=await fetch(`${API_BASE_URL}/api/expenses/${id}`,{
			method:"PUT",
			body:formData,
			credentials: 'include'
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
	
	//ma計算
	let idealMa=0;
	let actualMa=0;

	const today=new Date();
	const year=today.getFullYear();
	const getmonth=today.getMonth()+1;//0が1月なので+1する
	const daysInMonth=new Date(year,getmonth,0).getDate();//その月の日数を取得
	const currrentDay=today.getDate();//今日の日にちを取得

	if(budget){
		const dailyBudget=budget.amount/daysInMonth;//1日あたりの予算
		idealMa=(dailyBudget/600).toFixed(2);//小数点第2位まで表示
	}

	const monthlyExpenses=groupedExpenses[currentMonth]||[];//今月のデータだけ取り出す
	const expensesUntilToday=monthlyExpenses.filter(expense=>{
		const expenseDate=new Date(expense.expense_date);
		return expenseDate.getDate()<=currrentDay//今日の日にちよりも小さいものだけ取り出す
	});//今日までのデータだけ取り出す
	const totalExpenseToday=expensesUntilToday.reduce((sum,expense)=>sum+expense.amount,0);
	
	if(totalExpenseToday>0&&currrentDay>0){
		const dailyActualExpense=totalExpenseToday/currrentDay;//今日までの1日あたりの食費
		actualMa=(dailyActualExpense/600).toFixed(2);
	}

	//通知が来たら指定のコメントモーダルに移動するシステム
	useEffect(()=>{
		const openCommentModalFor=async (expenseId)=>{
			//自分の投稿リストから同じやつがあるか探す
			let targetExpense=expenses.find(exp=>exp.id===expenseId);
			//なかったらAPIを叩いて取得しにいく(admin用)
			if(!targetExpense){
				console.log("自分の投稿リストにないのでAPIから取得します。");
				const response=await fetch(`${API_BASE_URL}/api/expense/${expenseId}`,{
					credentials:"include"
				});
				if (response.ok){
					targetExpense=await response.json();
				}
			}
			if(targetExpense){
				setIsCommenting(targetExpense);
			}
			onTargetNotiHandled();
		};
		if(targetNotiId){
			openCommentModalFor(targetNotiId);
		}
		//if(targetNotiId){
		//	const targetNoti=expenses.find(exp=>exp.id===targetNotiId)
		//	 if (targetNoti){
		//		setIsCommenting(targetNoti);
		//	 }
		//	 onTargetNotiHandled();
		//}
	},[targetNotiId,expenses,onTargetNotiHandled])

	//お供セリフ
	useEffect(()=>{
		const fetchDialogues=async()=>{
			const response=await fetch(`${API_BASE_URL}/api/dialogues`,{
				credentials:"include"
			});
			if(response.ok){
				const data =await response.json();
				setDialogues(data);
			}
		};
		fetchDialogues()
	},[])
	const handleCharacterClick=()=>{
		console.log("--- Character Click Debug ---");
    	console.log("現在のお供のID:", session.selected_character);
    	console.log("解放済みの全セリフ:", dialogues);
    	console.log("--------------------------");
		setIsJumping(true);//ぴょんぴょんさせる
		if(audioRef.current){
			audioRef.current.pause();
			audioRef.current.currentTime=0;
		}
		if(dialogues.length===0) return;//台詞なしは何もしない
		clearTimeout(timeoutIdRef.current)//既存のタイマーがあればキャンセル
		const selectedCharacterId=session.selected_character;

		const availabeDialogues=dialogues.filter(
			d=>d.characterId===selectedCharacterId||d.characterId===null
		);//dialoguesテーブルのセリフとキャラクターを結ぶ

		if(availabeDialogues.length>0){
			const randomIndex=Math.floor(Math.random()*availabeDialogues.length);
			//Math.random()は0~1までの乱数
			// availabeDialoguesの数だけのランダムな数字を取り出す(Math.floorは小数点切り捨て)
			const randomDialogue=availabeDialogues[randomIndex];
			setCurrentDialogue(randomDialogue.text);
			
			let voiceToPlay=null;
			const AYA_ID="char3";
			//個別セリフでかつボイスがある場合
			if(randomDialogue.characterId!==null&&randomDialogue.voiceUrl){
				voiceToPlay=randomDialogue.voiceUrl;
			}
			//共通セリフでかつAYAである場合
			else if(randomDialogue.characterId===null&&selectedCharacterId===AYA_ID&&randomDialogue.voiceUrl){
				voiceToPlay=randomDialogue.voiceUrl;
			}
			if(voiceToPlay){
				const audio=new Audio(voiceToPlay);
				audioRef.current=audio;
				audio.play();
			}
			timeoutIdRef.current=setTimeout(()=>{
				setCurrentDialogue("");
			},5000)
			
		}
	};
	
	//キャラ解放
	useEffect(()=>{
		const fetchUnlockedCharacters=async()=>{
			const response=await fetch(`${API_BASE_URL}/api/characters/unlocked`,{
				credentials:"include"
			});
			if (response.ok){
				const data=await response.json();
				setCharacters(data);
			}
		};
		fetchUnlockedCharacters();
	},[]);

	//月の並び替え(調整しないと辞書順で昔の日にちが上になるので逆にする)
	const sortedMonths=Object.keys(groupedExpenses).sort((a,b)=>b.localeCompare(a));
	//Object.keys()はオブジェクトのキー(今回は月の名前)を抜き出す

	//合計金額を計算(月毎で分けれない)
	//const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

	//reduceは集約処理、sumはこれまでの計算結果の保持、expenseが現在処理している配列の要素(別にexpenseである必要はない、ただの変数)
	//expensesのデータの1つ1つをexpenseで取り出し、そのうちamountのデータを取り出して1個ずつ計算する
	//sumの初期値は0
	const selectedCharacter=characters.find(char=>char.id===session.selected_character)||defaultCharacter;
	//session.selected_characterがnullのときにエラーになるのを防ぐために||defaultcharacterをつけている
	//selectedCharacter={id:"char0",name:"まんぷくん",imageUrl:"/Manpukun.png"}みたいな感じ
	return (//onLogout=handleLogout
		<div>
			<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:"10px"}}>
				<h2>満伏屋</h2>
				<div
					onClick={handleCharacterClick}
					style={{cursor:"pointer",position:"relative"}}
				>
					<img
						src={selectedCharacter.imageUrl}
						alt={selectedCharacter.name}
						className={isJumping?"jump-animation":""}
						onAnimationEnd={()=>setIsJumping(false)}//アニメーション終わったらまたfalseに
						style={{width:"100px",height:"100px",borderRadius:"50%"}}
					/>
					{currentDialogue&&(
						<div className="dialogue-bubble">
							{currentDialogue}
						</div>
					)}
				</div>
			</div>
			<hr/>
			<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:"20px"}}>
				<span style={{fontWeight:"bold",}}>お供：{selectedCharacter.name}</span>
				<button onClick={()=>setIsCharacterModal(true)}>お供を変更</button>
			</div>
			{isCharacterModal&&(
				<CharacterSelectionModal
					onClose={()=>setIsCharacterModal(false)}
					onCharacterSelect={onCharacterSelect}
					unlockedCharacters={characters}
				/>
			)}
			
			<h3>{currentMonth}月の目標金額</h3>
			<Budget budget={budget} onSetBudget={handleSetBudget}/>
			<div className="ma-status-container">
				<p>理想のma/day：<span className="ma-value">{idealMa} ma/day</span></p>
				<p>今日までの実際のma/day：<span className={actualMa>idealMa?"ma-value-bad":"ma-value-good"}>
					{actualMa} ma/day
					</span>
				</p>
				<p>※ma：松のやで食べることのできる定食の最低金額(1ma=600円)のこと</p>
				<p>理想のma/dayは目標金額を達成するために1日平均何maで過ごせば良いか</p>
			</div>
			<h3>食事を記録してね</h3>
			<ExpenseForm onAddExpense={handleAddExpense} />
			<hr />
			<h3>食事内容</h3>
			{sortedMonths.map(month=>{//sortedMonthsから月を順番にmonthに代入していく
				const monthlyExpenses=groupedExpenses[month];
				const monthlyTotalExpense=monthlyExpenses.reduce((sum,expense)=>sum+expense.amount,0);
				const monthlyTotalNomikai=monthlyExpenses.reduce((sum,expense)=>sum+(expense.nomikai? expense.nomikai:0),0);
				const monthlyTotal=monthlyExpenses.reduce((sum,expense)=>sum+expense.amount+(expense.nomikai? Number(expense.nomikai)-1000:0),0);
				const nomikainumber=monthlyExpenses.filter(expense=>expense.meal_type==="nomikai").length;
			//複数のシステムをグループ化するためにReact.Fragmentを用いる
				const monthlyBudget=month===currentMonth? budget:null;
				const remainingAmount=monthlyBudget? monthlyBudget.amount-monthlyTotalExpense:null;
				const budgetStatusClass=remainingAmount<0 ? "budget-over":"budget-in-range"
				return(
					<React.Fragment key={month}>
						<h2>{month}  合計：{monthlyTotal}円<br></br>
						食費：{monthlyTotalExpense}円、飲み会({nomikainumber}回)：{monthlyTotalNomikai}円</h2>
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
					expense={commenting}//ここにはExpenseItemでクリックした食事内容がある
					onClose={()=>setIsCommenting(null)}
					session={session}
				/>
			)}
		</div>
	);
}
export default HomePage;