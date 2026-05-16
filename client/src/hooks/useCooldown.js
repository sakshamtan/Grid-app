import { useState, useEffect } from 'react'

function getRemaining(lockedUntil) {
  if (!lockedUntil) return 0
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
}

export default function useCooldown(lockedUntil) {
  const [remaining, setRemaining] = useState(() => getRemaining(lockedUntil))

  useEffect(() => {
    setRemaining(getRemaining(lockedUntil))
    if (!lockedUntil || lockedUntil <= Date.now()) return

    const id = setInterval(() => {
      const r = getRemaining(lockedUntil)
      setRemaining(r)
      if (r <= 0) clearInterval(id)
    }, 500)

    return () => clearInterval(id)
  }, [lockedUntil])

  return remaining
}
