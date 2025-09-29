import React, { useState, useEffect } from 'react';
import ExpenseList from '../components/ExpenseList';
import CommentModal from '../components/CommentModal';
function AdminPage() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const[selectUser,setSelectUser]=useState(null);
    const[expenses,setExpenses]=useState([]);
    const[isLoading,setIsLoading]=useState(false);
    const[commenting,setIsCommenting]=useState(null);
    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                // 権限がない場合(403)などのエラーメッセージを設定
                setError('このページにアクセスする権限がありません。');
            }
        };
        fetchUsers();
    }, []);
    useEffect(()=>{
        if(!selectUser) return;//誰も選択しなければ何もしない

        const fetchUserExpenses=async()=>{
            setIsLoading(true);
            const response=await fetch(`/api/admin/expenses/${selectUser.id}`);
            if(response.ok){
                const data=await response.json();
                setExpenses(data);
            }else{
                setError("ユーザーリストの取得に失敗")
            }
            setIsLoading(false);
        };
        fetchUserExpenses();
    },[selectUser]);//selectUserが変わったときだけ実行
    const handleAdminDeleteExpense=async(expenseId)=>{
        if(!window.confirm("本当にこの投稿を削除しますか？")) return;
        const response=await fetch(`/api/admin/expenses/${expenseId}`,{
            method:"DELETE",
        });
        if (response.ok){
            setExpenses(expenses.filter(exp=>exp.id!==expenseId))
        }else{
            alert("削除失敗");
        }
    };
    if (error) {
        return <div><p style={{ color: 'red' }}>{error}</p></div>;
    }

    return (
        <div>
            <h2>管理者ページ - ユーザー一覧</h2>
            <p>ユーザー名をクリックして投稿内容を確認</p>
            <table border="1" style={{ width: '10g0%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}
                            onClick={()=>setSelectUser(user)}
                            style={{cursor:"pointer",backgroundColor:selectUser?.id===user.id?"#e0f7fa":"white"}}
                            //selectedUserがあったらそのidとuser.idを参照して、バックグラウンドカラーを決める
                        >
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>{user.role}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {selectUser&&(
                <div>
                    <hr/>
                    <h3>{selectUser.username}の投稿リスト</h3>
                    {isLoading?(
                        <p>読み込み中...</p>
                    ):(
                        <ExpenseList
                            expenses={expenses}
                            onDeleteExpense={handleAdminDeleteExpense}
                            onOpenComments={setIsCommenting}
                        />
                    )}
                </div>
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

export default AdminPage;