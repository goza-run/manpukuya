/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function(knex) {
  //キャラ管理テーブル
  await knex.schema.createTable("characters",function(table){
    table.string("id").primary();
    //char0とか普通はincrementsでやるのが普通だけどこっちがidがどのキャラかわかるようにするためにstringにする
    table.string("name").notNullable();
    table.string("imageUrl").notNullable();
    table.boolean("is_default").notNullable().defaultTo(false);//初期キャラかどうか
  });

  //解放キャラの記録テーブル
  await knex.schema.createTable("user_unlocked_characters",function(table){
    table.increments("id").primary();
    //incrementsは自動で番号が増えるnotnullのintegerカラム
    table.integer("userId").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("characterId").notNullable().references("id").inTable("characters").onDelete("CASCADE");
    table.unique(["userId","characterId"]);//組み合わせが全部バラバラになるように

  });
  //セリフ管理テーブル
  await knex.schema.createTable("dialogues",function(table){
    table.increments("id").primary();
    table.string("characterId").nullable().references("id").inTable("characters").onDelete("CASCADE");
    table.string("text",255).notNullable();
  })

  //セリフの記録テーブル
  await knex.schema.createTable("user_unlocked_dialogues",function(table){
    table.increments("id").primary();
    table.integer("userId").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.integer("dialogueId").unsigned().notNullable().references("id").inTable("dialogues").onDelete("CASCADE");
    table.unique(["userId","dialogueId"]);
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('user_unlocked_dialogues');
  await knex.schema.dropTableIfExists('dialogues');
  await knex.schema.dropTableIfExists('user_unlocked_characters');
  await knex.schema.dropTableIfExists('characters');
};
