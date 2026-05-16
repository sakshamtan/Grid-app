import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { buildGrid, canCapture, applyCapture, computeLeaderboard } from './grid.js'

const makeDbCells = (count = 1600) =>
  Array.from({ length: count }, (_, i) => ({
    id: i, owner_name: null, owner_color: null, captured_at: null, locked_until: null,
  }))

describe('buildGrid', () => {
  test('creates a Map with 1600 entries', () => {
    const grid = buildGrid(makeDbCells())
    assert.equal(grid.size, 1600)
  })

  test('maps snake_case DB columns to camelCase', () => {
    const cells = makeDbCells(1)
    cells[0] = { id: 0, owner_name: 'alice', owner_color: '#e040fb', captured_at: 100, locked_until: 200 }
    const grid = buildGrid(cells)
    assert.deepEqual(grid.get(0), {
      ownerName: 'alice', ownerColor: '#e040fb', capturedAt: 100, lockedUntil: 200,
    })
  })
})

describe('canCapture', () => {
  test('returns true for unclaimed cell (lockedUntil null)', () => {
    assert.equal(canCapture({ lockedUntil: null }, Date.now()), true)
  })

  test('returns false when lockedUntil is in the future', () => {
    assert.equal(canCapture({ lockedUntil: Date.now() + 5000 }, Date.now()), false)
  })

  test('returns true when lockedUntil is in the past', () => {
    assert.equal(canCapture({ lockedUntil: Date.now() - 1 }, Date.now()), true)
  })

  test('returns true when lockedUntil exactly equals now', () => {
    const now = Date.now()
    assert.equal(canCapture({ lockedUntil: now }, now), true)
  })
})

describe('applyCapture', () => {
  test('returns updated cell with 10s cooldown', () => {
    const now = 1_000_000
    const result = applyCapture({}, 'bob', '#00e5ff', now)
    assert.deepEqual(result, {
      ownerName: 'bob',
      ownerColor: '#00e5ff',
      capturedAt: now,
      lockedUntil: now + 10_000,
    })
  })
})

describe('computeLeaderboard', () => {
  test('returns entries sorted by count descending', () => {
    const grid = new Map([
      [0, { ownerName: 'alice', ownerColor: '#e040fb' }],
      [1, { ownerName: 'bob',   ownerColor: '#00e5ff' }],
      [2, { ownerName: 'alice', ownerColor: '#e040fb' }],
      [3, { ownerName: 'carol', ownerColor: '#76ff03' }],
      [4, { ownerName: 'alice', ownerColor: '#e040fb' }],
    ])
    const board = computeLeaderboard(grid)
    assert.equal(board[0].name, 'alice')
    assert.equal(board[0].count, 3)
    assert.equal(board[1].name, 'bob')
    assert.equal(board[1].count, 1)
  })

  test('limits to 5 entries', () => {
    const grid = new Map(
      Array.from({ length: 10 }, (_, i) => [i, { ownerName: `user${i}`, ownerColor: '#fff' }])
    )
    assert.ok(computeLeaderboard(grid).length <= 5)
  })

  test('skips unclaimed cells', () => {
    const grid = new Map([[0, { ownerName: null, ownerColor: null }]])
    assert.equal(computeLeaderboard(grid).length, 0)
  })
})
