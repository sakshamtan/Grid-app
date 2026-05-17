import Cell from './Cell'

export default function Grid({ cells, onCapture, myName, flashingCellId, rejectedCellId }) {
  return (
    <div className="grid">
      {cells.map(cell => (
        <Cell
          key={cell.id}
          id={cell.id}
          ownerName={cell.ownerName}
          ownerColor={cell.ownerColor}
          lockedUntil={cell.lockedUntil}
          onCapture={onCapture}
          myName={myName}
          isFlashing={cell.id === flashingCellId}
          isRejected={cell.id === rejectedCellId}
        />
      ))}
    </div>
  )
}
