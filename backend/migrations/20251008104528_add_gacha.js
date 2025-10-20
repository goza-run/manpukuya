/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table("users",function(table){
    table.integer("points").notNullable().defaultTo(1000);//ガチャポイント初期値1000
    table.integer("daily_post_count").notNullable().defaultTo(0)//その日の投稿回数
    table.date("last_post_date");//最後に投稿した日
    table.integer("login_streak").notNullable().defaultTo(0)//連日投稿回数
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.table("users",function(table){
        table.dropColumn("points");
        table.dropColumn("daily_post_count");
        table.dropColumn("last_post_date");
        table.dropColumn("login_streak");
    });  
};
