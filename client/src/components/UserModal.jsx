import { useState } from 'react'

const COLORS = ['#e040fb', '#00e5ff', '#76ff03', '#ff6d00', '#ff4081', '#40c4ff']

export default function UserModal({ onSubmit }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

  function handleSubmit() {
    if (!name.trim()) return
    onSubmit({ name: name.trim(), color })
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Welcome to GRID</h2>
        <p className="modal-subtitle">Choose your identity to start capturing</p>
        <input
          className="modal-input"
          placeholder="your name..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          maxLength={20}
          autoFocus
        />
        <div className="color-label">PICK A COLOR</div>
        <div className="color-picker">
          {COLORS.map(c => (
            <button
              key={c}
              className={`color-swatch ${c === color ? 'selected' : ''}`}
              style={{ background: c, boxShadow: c === color ? `0 0 10px ${c}` : 'none' }}
              onClick={() => setColor(c)}
              aria-label={`color ${c}`}
            />
          ))}
        </div>
        <button className="modal-cta" onClick={handleSubmit}>
          Enter the Grid →
        </button>
      </div>
    </div>
  )
}
