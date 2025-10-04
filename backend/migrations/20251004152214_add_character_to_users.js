/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
//カラムを追加する場合はup、削除する場合はdownに書く
//upはnpx knex migrate:latest(最新の状態にする)用
exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.string("selected_character").notNullable().defaultTo("char0");//char0がデフォルト
  });
},
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
//downはnpx knex migrate:rollback(元に戻す)用
exports.down = function(knex) {
    return knex.schema.table('users', function(table) {
        table.dropColumn("selected_character");
    });  
};
