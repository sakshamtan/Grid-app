export default function Leaderboard({ entries, myName, totalCells }) {
  const myEntry = entries.find(e => e.name === myName)
  const myRank = myEntry ? entries.indexOf(myEntry) + 1 : '—'
  const myCount = myEntry?.count ?? 0
  const myPct = totalCells > 0 ? ((myCount / totalCells) * 100).toFixed(1) : '0.0'

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">Leaderboard</div>
        <div className="leaderboard-list">
          {entries.length === 0 && (
            <div className="empty-board">No captures yet</div>
          )}
          {entries.map(e => (
            <div key={e.name} className={`leaderboard-entry ${e.name === myName ? 'me' : ''}`}>
              <span
                className="leader-dot"
                style={{ background: e.color, boxShadow: `0 0 4px ${e.color}` }}
              />
              <span className="leader-name">{e.name}</span>
              <span className="leader-count" style={{ color: e.color }}>{e.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Your Stats</div>
        <div className="stats">
          <div><span className="stat-value">{myCount}</span> cells</div>
          <div><span className="stat-value">{myPct}%</span> territory</div>
          <div><span className="stat-value">#{myRank}</span> rank</div>
        </div>
      </div>
    </aside>
  )
}
