import { renderHook } from '@testing-library/react'
import useCooldown from './useCooldown'

test('returns 0 when lockedUntil is null', () => {
  const { result } = renderHook(() => useCooldown(null))
  expect(result.current).toBe(0)
})

test('returns 0 when lockedUntil is in the past', () => {
  const { result } = renderHook(() => useCooldown(Date.now() - 5000))
  expect(result.current).toBe(0)
})

test('returns positive seconds when lockedUntil is in the future', () => {
  const { result } = renderHook(() => useCooldown(Date.now() + 7000))
  expect(result.current).toBeGreaterThan(0)
  expect(result.current).toBeLessThanOrEqual(7)
})
