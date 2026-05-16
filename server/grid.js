const COOLDOWN_MS = 10_000

export function buildGrid(dbCells) {
  const grid = new Map()
  for (const cell of dbCells) {
    grid.set(cell.id, {
      ownerName: cell.owner_name,
      ownerColor: cell.owner_color,
      capturedAt: cell.captured_at,
      lockedUntil: cell.locked_until,
    })
  }
  return grid
}

export function canCapture(cell, now) {
  return !cell.lockedUntil || cell.lockedUntil <= now
}

export function applyCapture(_cell, ownerName, ownerColor, now) {
  return { ownerName, ownerColor, capturedAt: now, lockedUntil: now + COOLDOWN_MS }
}

export function computeLeaderboard(grid) {
  const counts = new Map()
  const colors = new Map()
  for (const cell of grid.values()) {
    if (!cell.ownerName) continue
    counts.set(cell.ownerName, (counts.get(cell.ownerName) ?? 0) + 1)
    colors.set(cell.ownerName, cell.ownerColor)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, color: colors.get(name), count }))
}
