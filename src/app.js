import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import 'dotenv/config'
import routes from './routes/index.js'
import { notFound } from './middlewares/notFound.js'
import { errorHandler } from './middlewares/error.js'

const app = express()
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1)

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use('/api', routes)
app.use(notFound)
app.use(errorHandler)

export default app
