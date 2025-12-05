/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  const idsToDelete=["char1"];

  if(idsToDelete.length===0) return;

  const count = await knex ("characters")
    .whereIn("id",idsToDelete)
    .del()

  console.log(`${count}体のキャラクターとその関連データを完全に消去しました。`)
};
