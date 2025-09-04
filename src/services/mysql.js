import mysql from 'mysql2/promise'
export async function mysqlPool() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 10
  })
  return {
    async query(sql, params = []) {
      const [rows, meta] = await pool.query(sql, params)
      return { rows: Array.isArray(rows) ? rows : [], insertId: meta?.insertId, affectedRows: meta?.affectedRows }
    },
    async close() { await pool.end() }
  }
}
