/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  const userExists=await knex('users').where("username","takatan").first();
  if(userExists){
    await knex('users').where("username","takatan").del();
  }else{
    console.log("User 'takatan' does not exist. No changes made.");
  } 
};
