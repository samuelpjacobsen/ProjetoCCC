import pool from "./connection.js";

async function migrateRbac() {
  console.log("Executando migration RBAC...");
  try {
    await pool.query("ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'tutor'");
    await pool.query("ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'pendente'");

    await pool.query(`
      DELETE FROM oficina_tutores;
      ALTER TABLE oficina_tutores DROP CONSTRAINT IF EXISTS oficina_tutores_tutor_id_fkey;
      ALTER TABLE oficina_tutores ADD CONSTRAINT oficina_tutores_tutor_id_fkey
        FOREIGN KEY (tutor_id) REFERENCES profiles(id) ON DELETE CASCADE;
      DROP TABLE IF EXISTS tutores;
    `);

    console.log("Migration RBAC executada com sucesso!");
  } catch (error) {
    console.error("Erro na migration RBAC:", error);
  } finally {
    await pool.end();
  }
}

migrateRbac();
