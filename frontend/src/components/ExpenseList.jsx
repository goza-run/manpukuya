import ExpenseItem from './ExpenseItem';
function ExpenseList({ expenses, onDeleteExpense,onEditExpense,onOpenComments}) {//onDeleteExpense=handleDeleteExpense
	return (
		<div>
			{expenses.map((expense) => (//expensesデータを全件処理する
				<ExpenseItem
					key={expense.id}
					expense={expense}
					onDelete={() => onDeleteExpense(expense.id)}
					onEdit={onEditExpense}
					onOpenComments={onOpenComments}
				/>
			))}
		</div>
	);
}
export default ExpenseList;
/*
全件処理
最初のループでは、配列の1番目の要素 {id: 1, amount: 500} を取り出し、それにexpenseという名前を付けます。

次のループでは、2番目の要素 {id: 2, amount: 850} を取り出し、それにexpenseという名前を付けます。

これを配列の最後まで繰り返します
*/