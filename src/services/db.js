import 'dotenv/config'

const type = (process.env.DB_TYPE || 'mysql').toLowerCase()
let db
if (type === 'mysql') {
  const { mysqlPool } = await import('./mysql.js')
  db = await mysqlPool()
} else if (type === 'supabase') {
  const { pgClient } = await import('./pg.js')
  db = await pgClient()
} else {
  throw new Error('DB_TYPE harus "mysql" atau "supabase"')
}
export default db
