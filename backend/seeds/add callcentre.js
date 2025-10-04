/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  const userExists=await knex('users').where("username","callcentre").first();
  if(userExists){
    console.log("User 'callcentre' already exists. No changes made.");
  }else{
    const hashedPassword = await require('bcrypt').hash('ilovekoichi', 10);
    await knex('users').insert({
      username:"callcentre",
      password:hashedPassword,
      role:"user"
    });
    console.log("User 'callcentre' has been added.");
  }
  
};
