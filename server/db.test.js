import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { initDb, getAllCells, updateCell } from './db.js'

describe('db', () => {
  let db

  before(() => {
    db = initDb(':memory:')
  })

  test('seeds 1600 cells on init', () => {
    const cells = getAllCells(db)
    assert.equal(cells.length, 1600)
  })

  test('all cells start with null owner', () => {
    const cells = getAllCells(db)
    assert.ok(cells.every(c => c.owner_name === null))
  })

  test('cells are ordered by id 0–1599', () => {
    const cells = getAllCells(db)
    assert.equal(cells[0].id, 0)
    assert.equal(cells[1599].id, 1599)
  })

  test('updateCell persists owner fields', () => {
    updateCell(db, 42, {
      ownerName: 'alice',
      ownerColor: '#e040fb',
      capturedAt: 1000,
      lockedUntil: 11000,
    })
    const cells = getAllCells(db)
    const cell = cells.find(c => c.id === 42)
    assert.equal(cell.owner_name, 'alice')
    assert.equal(cell.owner_color, '#e040fb')
    assert.equal(cell.captured_at, 1000)
    assert.equal(cell.locked_until, 11000)
  })

  test('updateCell can overwrite existing owner', () => {
    updateCell(db, 42, {
      ownerName: 'bob',
      ownerColor: '#00e5ff',
      capturedAt: 2000,
      lockedUntil: 12000,
    })
    const cells = getAllCells(db)
    const cell = cells.find(c => c.id === 42)
    assert.equal(cell.owner_name, 'bob')
  })
})
