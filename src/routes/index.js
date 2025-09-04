import { Router } from 'express'
import todos from './todos.js'
const r = Router()
r.use('/todos', todos)
export default r
