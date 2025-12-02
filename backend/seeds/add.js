/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {

  console.log("ポートフォリオ用にユーザー名を更新しました。")
  const userExists=await knex('users').where("username","demo_1").first();
  if(userExists){
    console.log("User 'demo_1' already exists. No changes made.");
  }else{
    const hashedPassword = await require('bcrypt').hash('1234demo', 10);
    await knex('users').insert({
      username:"demo_1",
      password:hashedPassword,
      role:"user"
    });
    console.log("User 'demo_1' has been added.");
  }
};
