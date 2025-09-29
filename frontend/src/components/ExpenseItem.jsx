import API_BASE_URL from "../config";

const mealTypeMap={
	breakfast:"朝ごはん",
	lunch:"昼ごはん",
	dinner:"夜ごはん",
	other:"その他"//データ上記録されているものをもう一度日本語に変える
}
function ExpenseItem({ expense, onDelete,onEdit,onOpenComments }) {//onDelete=onDeleteExpense(expense.id)
	const date=new Date(expense.expense_date);//2025-09-17をdateオブジェクトへ変換
	const displayDate=`${date.getMonth()+1}月${date.getDate()}日`;//getMonthで月を取り出す(0月からスタートなので+1)
	const mealTypeText=mealTypeMap[expense.meal_type]||"不明";//エラー時の保険で不明を入れてる
	return (
		<div className="expense-item">
			<div className="expense-item-header">
				<strong>{displayDate}<br></br>({mealTypeText})</strong>
				<br></br>
				<span>{expense.amount}円</span>
			</div>
			{expense.photo_path&&(
//expense.photo_path=trueであれば以下を実行
				<img
					src={`${API_BASE_URL}/${expense.photo_path}`}
					alt="食費の記録写真"
					style={{maxWidth:"200px",height:"auto"}}
				/>
			)}
			<p>{expense.description}</p>
			<div className="expense-item-actions">
				<button className="comment"
					onClick={()=>onOpenComments(expense)}>コメント</button>
				<button className="edit"
					onClick={()=>onEdit(expense)}>編集</button>
				<button className='delete'
					onClick={onDelete}>削除</button>
			
			</div>
		</div>
	);
}
export default ExpenseItem;