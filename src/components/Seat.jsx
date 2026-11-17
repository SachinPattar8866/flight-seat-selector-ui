import { formatPrice } from '../state/format'
import { CATEGORIES } from '../data/seatData'

export default function Seat({ seat, occupant, isActiveOccupant, onSelect, onPreview }) {
  const status = seat.occupied
    ? 'occupied'
    : occupant
      ? isActiveOccupant
        ? 'selected'
        : 'assigned'
      : 'available'

  const description = [
    `Seat ${seat.id}`,
    CATEGORIES[seat.category].label,
    formatPrice(seat.price),
    seat.occupied ? 'occupied' : occupant ? `assigned to passenger ${occupant.number}` : 'available',
  ].join(', ')

  return (
    <span
      className="seat-wrap"
      onMouseEnter={() => onPreview(seat)}
      onMouseLeave={() => onPreview(null)}
      onFocus={() => onPreview(seat)}
      onBlur={() => onPreview(null)}
    >
      <button
        type="button"
        className={`seat cat-${seat.category} is-${status}`}
        aria-label={description}
        aria-pressed={status === 'selected'}
        disabled={seat.occupied}
        onClick={() => {
          onPreview(seat)
          onSelect(seat)
        }}
      >
        {occupant ? <span className="seat-badge">P{occupant.number}</span> : seat.occupied ? '×' : seat.col}
      </button>
    </span>
  )
}