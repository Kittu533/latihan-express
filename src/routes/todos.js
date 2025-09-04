import { Router } from 'express'
import { z } from 'zod'
import db from '../services/db.js'

const r = Router()
const DIALECT = (process.env.DB_TYPE || 'mysql').toLowerCase()
const todoSchema = z.object({ title: z.string().min(1).max(200), completed: z.boolean().optional() })

const SQL = {
  count: DIALECT === 'mysql' ? 'SELECT COUNT(*) AS c FROM todos' : 'SELECT COUNT(*)::int AS c FROM todos',
  pageMy: 'SELECT id,title,completed,created_at,updated_at FROM todos ORDER BY id DESC LIMIT ? OFFSET ?',
  pagePg: 'SELECT id,title,completed,created_at,updated_at FROM todos ORDER BY id DESC LIMIT $1 OFFSET $2',
  byIdMy: 'SELECT id,title,completed,created_at,updated_at FROM todos WHERE id=?',
  byIdPg: 'SELECT id,title,completed,created_at,updated_at FROM todos WHERE id=$1',
  insMy:  'INSERT INTO todos (title,completed) VALUES (?,?)',
  insPg:  'INSERT INTO todos (title,completed) VALUES ($1,$2) RETURNING *',
  updMy:  'UPDATE todos SET title=?, completed=?, updated_at=NOW() WHERE id=?',
  updPg:  'UPDATE todos SET title=$1, completed=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
  delMy:  'DELETE FROM todos WHERE id=?',
  delPg:  'DELETE FROM todos WHERE id=$1'
}

r.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page||'1'),1)
    const limit = Math.min(Math.max(parseInt(req.query.limit||'10'),1),100)
    const offset = (page-1)*limit
    const t = await db.query(SQL.count)
    const total = t.rows?.[0]?.c || 0
    const items = (DIALECT==='mysql')
      ? (await db.query(SQL.pageMy, [limit, offset])).rows
      : (await db.query(SQL.pagePg, [limit, offset])).rows
    res.json({ page, limit, total, items })
  } catch (e) { next(e) }
})

r.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const q = DIALECT==='mysql' ? SQL.byIdMy : SQL.byIdPg
    const todo = (await db.query(q, [id])).rows?.[0]
    if (!todo) return res.status(404).json({ error: 'Not found' })
    res.json(todo)
  } catch (e) { next(e) }
})

r.post('/', async (req, res, next) => {
  try {
    const p = todoSchema.safeParse(req.body)
    if (!p.success) return res.status(400).json({ error: p.error.issues.map(i=>i.message) })
    const { title, completed=false } = p.data
    if (DIALECT==='mysql') {
      const ins = await db.query(SQL.insMy, [title, completed?1:0])
      const id = ins.insertId
      const got = await db.query(SQL.byIdMy, [id])
      return res.status(201).json(got.rows[0])
    } else {
      const ins = await db.query(SQL.insPg, [title, completed])
      return res.status(201).json(ins.rows[0])
    }
  } catch (e) { next(e) }
})

r.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const body = todoSchema.partial().parse(req.body)
    const prev = (DIALECT==='mysql'
      ? await db.query(SQL.byIdMy, [id])
      : await db.query(SQL.byIdPg, [id])
    ).rows?.[0]
    if (!prev) return res.status(404).json({ error: 'Not found' })
    const title = body.title ?? prev.title
    const completed = (typeof body.completed==='boolean') ? body.completed : !!prev.completed
    if (DIALECT==='mysql') {
      await db.query(SQL.updMy, [title, completed?1:0, id])
      const got = await db.query(SQL.byIdMy, [id])
      return res.json(got.rows[0])
    } else {
      const up = await db.query(SQL.updPg, [title, completed, id])
      return res.json(up.rows[0])
    }
  } catch (e) { next(e) }
})

r.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const del = await db.query(DIALECT==='mysql' ? SQL.delMy : SQL.delPg, [id])
    const affected = del.affectedRows ?? del.rowCount ?? 0
    if (!affected) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

export default r
