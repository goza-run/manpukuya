/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.increments('id').primary();
    table.integer("recipientId").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    //recipientIdは通知を受け取った人のId
    table.integer("senderId").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    //senderIdは通知を送った人のId
    table.string('senderName').notNullable();//通知を送った人の名前
    table.string('type').notNullable();//通知の種類（例：コメント、いいねなど）
    table.integer("expenseId").unsigned().notNullable().references("id").inTable("expenses").onDelete("CASCADE");
    //expenseIdはどの食費投稿に関する通知か
    table.boolean('is_read').notNullable().defaultTo(false);//既読かどうか
    table.timestamps(true,true)//作成日時と更新日時
  });
};
/*
table.integer("recipientId")=recipientIdという名前のinteger型のカラムを作成
.unsigned()=負の値を許可しない
.notNullable()=nullを許可しない
.references("id").inTable("users")=usersテーブルのidカラムを参照する外部キー制約を追加
.onDelete("CASCADE")=usersテーブルの該当する行が削除されたときに、このテーブルの関連する行も自動的に削除されるようにする 
boolean=true/falseの値を持つカラム
timestamp(true,true)
1つ目のtrue=created_atとupdated_atの両方のカラムを作成
2つ目のtrue=これらのカラムが自動的に現在のタイムスタンプで設定されるようにする
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('notifications');
};
