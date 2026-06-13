import 'dotenv/config';
import { Pool } from 'pg';

const ORG = {
  id: '9ed47d8e-f82d-4016-a770-fc3c93563762',
  name: 'Richmond Jollyland Corp.',
  address: '1722 Tondo',
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(
      `INSERT INTO "organizations" ("id", "name", "address", "created_at", "updated_at")
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("id") DO UPDATE
         SET "name" = EXCLUDED."name",
             "address" = EXCLUDED."address",
             "updated_at" = CURRENT_TIMESTAMP`,
      [ORG.id, ORG.name, ORG.address],
    );
    console.log(`seeded organization: ${ORG.id} (${ORG.name})`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
