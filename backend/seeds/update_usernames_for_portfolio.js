/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
const bcrypt=require('bcrypt');
exports.seed = async function(knex) {
  await knex("users").where("username","ゆきまんこ").update({username:"ゆきや"})
  console.log("ポートフォリオ用にユーザー名を更新しました。")
  const userExists=await knex('users').where("username","test").first();
  if(userExists){
    console.log("User 'test' already exists. No changes made.");
  }else{
    const hashedPassword = await require('bcrypt').hash('1234test', 10);
    await knex('users').insert({
      username:"test",
      password:hashedPassword,
      role:"user"
    });
    console.log("User 'test' has been added.");
  }
};
