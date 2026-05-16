import useCooldown from '../hooks/useCooldown'

export default function Cell({ id, ownerName, ownerColor, lockedUntil, onCapture, myName, isFlashing, isRejected }) {
  const remaining = useCooldown(lockedUntil)
  const isOwned = !!ownerName
  const isMine = ownerName === myName
  const isCooling = remaining > 0

  const style = {
    background: isOwned ? ownerColor : '#111128',
    boxShadow: isOwned ? `0 0 6px ${ownerColor}88` : 'none',
    borderColor: isMine ? ownerColor : 'transparent',
  }

  const classes = [
    'cell',
    isOwned && 'owned',
    isMine && 'mine',
    isCooling && 'cooling',
    isFlashing && 'just-captured',
    isRejected && 'rejected',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      style={style}
      onClick={() => onCapture(id)}
      title={ownerName ?? 'unclaimed'}
      aria-label={`cell ${id}${ownerName ? `, owned by ${ownerName}` : ''}`}
    >
      {isCooling && <span className="cooldown-label">{remaining}s</span>}
    </button>
  )
}
