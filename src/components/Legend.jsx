import { CATEGORIES } from '../data/seatData'
import { formatPrice } from '../state/format'

export default function Legend() {
  return (
    <div className="legend" aria-label="Seat legend">
      <section>
        <h3>Seat price</h3>
        <ul>
          {Object.values(CATEGORIES).map((c) => (
            <li key={c.id}>
              <span className={`swatch cat-${c.id}`} />
              {c.label} <strong>{formatPrice(c.price)}</strong>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Seat status</h3>
        <ul>
          <li><span className="swatch is-selected" />Selected passenger</li>
          <li><span className="swatch is-assigned" />Other passenger</li>
          <li><span className="swatch cat-standard" />Available (colour shows price)</li>
          <li><span className="swatch is-occupied" />Occupied</li>
        </ul>
      </section>
    </div>
  )
}