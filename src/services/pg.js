import pg from 'pg'
export async function pgClient() {
  const client = new pg.Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : undefined,
    max: 10
  })
  return {
    async query(sql, params = []) {
      const res = await client.query(sql, params)
      return { rows: res.rows, affectedRows: res.rowCount }
    },
    async close() { await client.end() }
  }
}
