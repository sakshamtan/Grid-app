import { render, screen, fireEvent } from '@testing-library/react'
import UserModal from './UserModal'

test('renders name input and color swatches', () => {
  render(<UserModal onSubmit={() => {}} />)
  expect(screen.getByPlaceholderText('your name...')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /enter/i })).toBeInTheDocument()
})

test('calls onSubmit with trimmed name and selected color', () => {
  const onSubmit = vi.fn()
  render(<UserModal onSubmit={onSubmit} />)
  fireEvent.change(screen.getByPlaceholderText('your name...'), {
    target: { value: '  alice  ' },
  })
  fireEvent.click(screen.getByRole('button', { name: /enter/i }))
  expect(onSubmit).toHaveBeenCalledWith({ name: 'alice', color: expect.any(String) })
})

test('does not call onSubmit when name is empty', () => {
  const onSubmit = vi.fn()
  render(<UserModal onSubmit={onSubmit} />)
  fireEvent.click(screen.getByRole('button', { name: /enter/i }))
  expect(onSubmit).not.toHaveBeenCalled()
})

test('does not call onSubmit when name is only whitespace', () => {
  const onSubmit = vi.fn()
  render(<UserModal onSubmit={onSubmit} />)
  fireEvent.change(screen.getByPlaceholderText('your name...'), {
    target: { value: '   ' },
  })
  fireEvent.click(screen.getByRole('button', { name: /enter/i }))
  expect(onSubmit).not.toHaveBeenCalled()
})

test('Enter key submits the form', () => {
  const onSubmit = vi.fn()
  render(<UserModal onSubmit={onSubmit} />)
  fireEvent.change(screen.getByPlaceholderText('your name...'), {
    target: { value: 'bob' },
  })
  fireEvent.keyDown(screen.getByPlaceholderText('your name...'), { key: 'Enter' })
  expect(onSubmit).toHaveBeenCalledWith({ name: 'bob', color: expect.any(String) })
})
