import { CATEGORIES } from '../data/seatData'
import { formatAmount, formatPrice } from '../state/format'

export default function Summary({ passengers, totals }) {
  return (
    <section className="panel summary" aria-labelledby="sum-title">
      <h2 id="sum-title">Charges</h2>

      {/* Passenger-wise breakdown */}
      <ul className="summary-list">
        {passengers.map((p) => {
          const hasMeal = p.meal.id !== 'none'
          return (
            <li key={p.id}>
              <div className="summary-name">{p.name}</div>
              <div className="summary-line">
                <span>
                  Seat · {p.seat ? `${p.seat.id} (${CATEGORIES[p.seat.category].label})` : 'Not selected'}
                </span>
                <span className={p.seat ? '' : 'muted'}>{p.seat ? formatPrice(p.seat.price) : '—'}</span>
              </div>
              <div className="summary-line">
                <span>Meal · {hasMeal ? p.meal.label.replace(' (complimentary)', '') : 'No meal'}</span>
                <span className={hasMeal ? '' : 'muted'}>{hasMeal ? formatPrice(p.meal.price) : '—'}</span>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Totals */}
      <dl className="totals">
        <div><dt>Seat charges</dt><dd>{formatAmount(totals.seats)}</dd></div>
        <div><dt>Meal charges</dt><dd>{formatAmount(totals.meals)}</dd></div>
        <div className="grand"><dt>Total amount</dt><dd aria-live="polite">{formatAmount(totals.total)}</dd></div>
      </dl>
    </section>
  )
}