import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import complexRoutes from './routes/complexRoutes.js'
import listingRoutes from './routes/listingRoutes.js'
import backupRoutes from './routes/backupRoutes.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/complexes', complexRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/backups', backupRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Static files (Frontend)
const frontendPath = path.join(__dirname, '../../frontend/dist')
app.use(express.static(frontendPath))

// SPA support: fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
