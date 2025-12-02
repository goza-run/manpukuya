/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log("ポートフォリオ用にユーザー名を更新しました。")
  const userExists=await knex('users').where("username","demo").first();
  if(userExists){
    console.log("User 'demo' already exists. No changes made.");
  }else{
    const hashedPassword = await require('bcrypt').hash('demo', 10);
    await knex('users').insert({
      username:"demo",
      password:hashedPassword,
      role:"user"
    });
    console.log("User 'demo' has been added.");
  }
};
