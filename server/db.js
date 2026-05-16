import Database from 'better-sqlite3'

const CELL_COUNT = 1600

export function initDb(path = 'grid.db') {
  const db = new Database(path)
  db.exec(`
    CREATE TABLE IF NOT EXISTS cells (
      id           INTEGER PRIMARY KEY,
      owner_name   TEXT,
      owner_color  TEXT,
      captured_at  INTEGER,
      locked_until INTEGER
    )
  `)
  const { n } = db.prepare('SELECT COUNT(*) as n FROM cells').get()
  if (n < CELL_COUNT) {
    const insert = db.prepare('INSERT OR IGNORE INTO cells (id) VALUES (?)')
    const seed = db.transaction(() => {
      for (let i = 0; i < CELL_COUNT; i++) insert.run(i)
    })
    seed()
  }
  return db
}

export function getAllCells(db) {
  return db.prepare('SELECT * FROM cells ORDER BY id').all()
}

export function updateCell(db, id, { ownerName, ownerColor, capturedAt, lockedUntil }) {
  db.prepare(`
    UPDATE cells
    SET owner_name = ?, owner_color = ?, captured_at = ?, locked_until = ?
    WHERE id = ?
  `).run(ownerName, ownerColor, capturedAt, lockedUntil, id)
}
