export default function TopBar({ onlineCount, userName, userColor }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="brand-dot" />
        <span className="brand-name">GRID</span>
      </div>
      <div className="topbar-right">
        <div className="online-count">
          <span className="online-dot" />
          <span>{onlineCount} online</span>
        </div>
        <div className="identity-chip">
          <span
            className="identity-dot"
            style={{ background: userColor, boxShadow: `0 0 6px ${userColor}` }}
          />
          <span>{userName}</span>
        </div>
      </div>
    </header>
  )
}
