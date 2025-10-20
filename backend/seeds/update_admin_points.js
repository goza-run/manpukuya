/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 管理者(roleが'admin')のポイントを9999999に更新する
  await knex('users')
    .where('role', 'admin')
    .update({
      points: 9999999
    });

  console.log("Admin user points have been updated.");
};