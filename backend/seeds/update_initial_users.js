/**ここではユーザーの消去、追加を行っている
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 * knexはコネックスとよむ、SQL文担当
 */
const bcrypt=require('bcrypt');


exports.seed = async function(knex) {
  const userExists=await knex('users').where("username","浦野勝男").first();
  if(userExists){
    console.log("User '浦野勝男' already exists. No changes made.");
  }else{
    // Deletes ALL existing entries
    await knex('users').where("username","takatan").del();
    // Inserts seed entries
    const hashedPassword = await require('bcrypt').hash('urachan228', 10);
    await knex('users').insert({
      username:"浦野勝男",
      password:hashedPassword,
      role:"user"
    });
  };
};
