import { MAX_PASSENGERS, MEALS } from '../data/seatData'
import { formatPrice } from '../state/format'

export default function PassengerPanel({ passengers, activeId, dispatch }) {
  const count = passengers.length
  const requestRemove = (id) => dispatch({ type: 'REQUEST_REMOVE_PASSENGER', id })

  return (
    <section className="panel" aria-labelledby="pax-title">
      <div className="panel-head">
        <h2 id="pax-title">Passengers</h2>
        <div className="stepper" role="group" aria-label="Number of passengers">
          <button type="button" aria-label="Remove the last passenger" disabled={count <= 1}
            onClick={() => requestRemove(passengers[count - 1].id)}>−</button>
          <output aria-live="polite">{count}</output>
          <button type="button" aria-label="Add a passenger" disabled={count >= MAX_PASSENGERS}
            onClick={() => dispatch({ type: 'ADD_PASSENGER' })}>+</button>
        </div>
      </div>

      <ul className="passenger-list">
        {passengers.map((p) => {
          const isActive = p.id === activeId
          return (
            <li key={p.id} className={`passenger ${isActive ? 'is-active' : ''} ${p.seat ? 'has-seat' : ''}`}>
              <div className="passenger-row">
                <button type="button" className="passenger-select" aria-pressed={isActive}
                  onClick={() => dispatch({ type: 'SET_ACTIVE', id: p.id })}>
                  <span className="passenger-avatar" aria-hidden="true">{p.seat ? '✓' : p.number}</span>
                  <span className="passenger-main">
                    <span className="passenger-name">{p.name}</span>
                    <span className="passenger-seat">
                      {p.seat ? `Seat ${p.seat.id} · ${formatPrice(p.seat.price)}` : 'No seat yet'}
                    </span>
                  </span>
                  {p.seat ? (
                    <span className="pill pill-assigned">Assigned</span>
                  ) : (
                    isActive && <span className="pill pill-active">Selecting</span>
                  )}
                </button>
                <button type="button" className="icon-remove" aria-label={`Remove ${p.name}`}
                  title={count <= 1 ? 'At least one passenger is required' : `Remove ${p.name}`}
                  disabled={count <= 1} onClick={() => requestRemove(p.id)}>×</button>
              </div>

              {isActive && (
                <div className="passenger-details">
                  <label>
                    Name
                    <input type="text" value={p.customName} placeholder={`Passenger ${p.number}`} maxLength={24}
                      onChange={(e) => dispatch({ type: 'RENAME', id: p.id, name: e.target.value })} />
                  </label>
                  <label>
                    Meal
                    <select value={p.meal.id}
                      onChange={(e) => dispatch({ type: 'SET_MEAL', id: p.id, mealId: e.target.value })}>
                      {MEALS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}{m.price > 0 ? ` – ${formatPrice(m.price)}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  {p.seat && (
                    <button type="button" className="link-button"
                      onClick={() => dispatch({ type: 'REMOVE_SEAT', id: p.id })}>
                      Remove seat {p.seat.id}
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}