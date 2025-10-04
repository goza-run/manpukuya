import CommentItem from "./CommentItem";
function CommentList({comments,onDeleteComment,onOpenComments,session}) {
	return (
		<div>
			{comments.map((comment) => (//commentデータを全件処理する
				<CommentItem
					key={comment.id}
					comment={comment}
					onDelete={() => onDeleteComment(comment.id)}
					onOpenComments={onOpenComments}
                    session={session}
				/>
			))}
		</div>
	);
}
export default CommentList;