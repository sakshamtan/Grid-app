import { useState, useEffect, useCallback, useRef } from 'react'
import socket from './socket'
import UserModal from './components/UserModal'
import TopBar from './components/TopBar'
import Grid from './components/Grid'
import Leaderboard from './components/Leaderboard'

const STORAGE_KEY = 'grid-identity'
const TOTAL_CELLS = 1600

function loadIdentity() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

function makeEmptyGrid() {
  return Array.from({ length: TOTAL_CELLS }, (_, id) => ({
    id, ownerName: null, ownerColor: null, capturedAt: null, lockedUntil: null,
  }))
}

export default function App() {
  const [identity, setIdentity] = useState(() => loadIdentity())
  const [cells, setCells] = useState(makeEmptyGrid)
  const [onlineCount, setOnlineCount] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [flashingCellId, setFlashingCellId] = useState(null)
  const [rejectedCellId, setRejectedCellId] = useState(null)
  const flashTimer = useRef(null)
  const rejectTimer = useRef(null)

  useEffect(() => {
    if (!identity) return

    socket.connect()
    socket.emit('join', identity)

    socket.on('grid_state', ({ cells: incoming }) => setCells(incoming))

    socket.on('cell_updated', (updated) => {
      setCells(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
      setFlashingCellId(updated.id)
      clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setFlashingCellId(null), 300)
    })

    socket.on('capture_rejected', ({ cellId }) => {
      setRejectedCellId(cellId)
      clearTimeout(rejectTimer.current)
      rejectTimer.current = setTimeout(() => setRejectedCellId(null), 400)
    })

    socket.on('online_count', ({ count }) => setOnlineCount(count))
    socket.on('leaderboard', ({ entries }) => setLeaderboard(entries))

    return () => {
      socket.off('grid_state')
      socket.off('cell_updated')
      socket.off('capture_rejected')
      socket.off('online_count')
      socket.off('leaderboard')
      socket.disconnect()
    }
  }, [identity])

  const handleIdentity = useCallback((id) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(id))
    setIdentity(id)
  }, [])

  const handleCapture = useCallback((cellId) => {
    socket.emit('capture_cell', { cellId })
  }, [])

  if (!identity) return <UserModal onSubmit={handleIdentity} />

  return (
    <div className="app">
      <TopBar onlineCount={onlineCount} userName={identity.name} userColor={identity.color} />
      <div className="main">
        <div className="grid-container">
          <Grid
            cells={cells}
            onCapture={handleCapture}
            myName={identity.name}
            flashingCellId={flashingCellId}
            rejectedCellId={rejectedCellId}
          />
        </div>
        <Leaderboard entries={leaderboard} myName={identity.name} totalCells={TOTAL_CELLS} />
      </div>
    </div>
  )
}
