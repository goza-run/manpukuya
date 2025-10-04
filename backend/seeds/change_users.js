/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
const bcrypt=require('bcrypt');

exports.seed = async function(knex) {
  const userExists=await knex('users').where("username","たなせん").first();
  if(userExists){
    console.log("User 'たなせん' already exists. No changes made.");
  }else{
    // Deletes ALL existing entries
    await knex('users').where("username","tanasen").del();
    await knex('users').where("username","yukiya").del();
    // Inserts seed entries
    const hashedPassword_tanasen = await require('bcrypt').hash('nakazakinoketsu', 10);
    await knex('users').insert({
      username:"たなせん",
      password:hashedPassword_tanasen,
      role:"user"
    });
    const hashedPassword_yukiya = await require('bcrypt').hash('1215', 10);
    await knex('users').insert({
      username:"ゆきまんこ",
      password:hashedPassword_yukiya,
      role:"user"
    });
  };
};
