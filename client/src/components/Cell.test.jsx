import { render, screen, fireEvent } from '@testing-library/react'
import Cell from './Cell'

const baseProps = {
  id: 5,
  ownerName: null,
  ownerColor: null,
  lockedUntil: null,
  onCapture: () => {},
  myName: 'alice',
  isFlashing: false,
  isRejected: false,
}

test('renders a button', () => {
  render(<Cell {...baseProps} />)
  expect(screen.getByRole('button')).toBeInTheDocument()
})

test('calls onCapture with cell id when clicked', () => {
  const onCapture = vi.fn()
  render(<Cell {...baseProps} onCapture={onCapture} />)
  fireEvent.click(screen.getByRole('button'))
  expect(onCapture).toHaveBeenCalledWith(5)
})

test('shows owner name in title when owned', () => {
  render(<Cell {...baseProps} ownerName="bob" ownerColor="#00e5ff" />)
  expect(screen.getByTitle('bob')).toBeInTheDocument()
})

test('shows "unclaimed" in title when unowned', () => {
  render(<Cell {...baseProps} />)
  expect(screen.getByTitle('unclaimed')).toBeInTheDocument()
})

test('shows cooldown label when lockedUntil is in the future', () => {
  render(<Cell {...baseProps} ownerName="bob" ownerColor="#00e5ff" lockedUntil={Date.now() + 8000} />)
  expect(screen.getByText(/\ds/)).toBeInTheDocument()
})

test('does not show cooldown label when lockedUntil is null', () => {
  render(<Cell {...baseProps} />)
  expect(screen.queryByText(/\ds/)).not.toBeInTheDocument()
})
