import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { initDb, getAllCells, updateCell } from './db.js'
import { buildGrid, canCapture, applyCapture, computeLeaderboard } from './grid.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
})

const db = initDb()
const grid = buildGrid(getAllCells(db))
const users = new Map() // socketId → { name, color }

io.on('connection', (socket) => {
  socket.on('join', ({ name, color }) => {
    if (typeof name !== 'string' || typeof color !== 'string') return
    users.set(socket.id, { name: name.slice(0, 20), color })

    const cells = [...grid.entries()].map(([id, cell]) => ({ id, ...cell }))
    socket.emit('grid_state', { cells })

    io.emit('online_count', { count: users.size })
    io.emit('leaderboard', { entries: computeLeaderboard(grid) })
  })

  socket.on('capture_cell', ({ cellId }) => {
    const user = users.get(socket.id)
    if (!user) return

    const id = Number(cellId)
    if (!Number.isInteger(id) || id < 0 || id >= 1600) return

    const cell = grid.get(id)
    const now = Date.now()

    if (!canCapture(cell, now)) {
      socket.emit('capture_rejected', {
        cellId: id,
        reason: 'cooldown',
        remainingMs: cell.lockedUntil - now,
      })
      return
    }

    const updated = applyCapture(cell, user.name, user.color, now)
    grid.set(id, updated)
    updateCell(db, id, updated)

    io.emit('cell_updated', { id, ...updated })
    io.emit('leaderboard', { entries: computeLeaderboard(grid) })
  })

  socket.on('disconnect', () => {
    users.delete(socket.id)
    io.emit('online_count', { count: users.size })
  })
})

const PORT = 3001
httpServer.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`))
