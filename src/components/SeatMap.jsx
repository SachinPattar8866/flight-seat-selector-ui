import { useState } from 'react'
import Seat from './Seat'
import Legend from './Legend'
import { CATEGORIES } from '../data/seatData'
import { formatPrice } from '../state/format'

export default function SeatMap({ seatMap, occupantBySeat, activePassengerId, onSelectSeat }) {
  const [previewSeat, setPreviewSeat] = useState(null)
  const groups = seatMap.layout.groups

  return (
    <section className="panel cabin-panel" aria-labelledby="cabin-title">
      <h2 id="cabin-title">Cabin</h2>

      <p className="seat-detail" aria-live="polite">
        {previewSeat ? (
          <>
            <strong>Seat {previewSeat.id}</strong> · {CATEGORIES[previewSeat.category].label} ·{' '}
            {previewSeat.occupied ? 'Occupied' : formatPrice(previewSeat.price)}
          </>
        ) : (
          'Hover or focus a seat to see its price.'
        )}
      </p>

      <Legend />

      <div className="cabin-scroll">
        <div className="fuselage">
          <div className="seat-row column-heads" aria-hidden="true">
            <span className="row-label" />
            {groups.map((group, gi) => (
              <div className="seat-row-part" key={gi}>
                <div className="seat-group">
                  {group.map((col) => <span key={col} className="col-head">{col}</span>)}
                </div>
                {gi < groups.length - 1 && <span className="aisle" />}
              </div>
            ))}
          </div>

          {seatMap.rows.map((row) => (
            <div className="seat-row" role="group" aria-label={`Row ${row.number}`} key={row.number}>
              <span className="row-label">{row.number}</span>
              {row.groups.map((group, gi) => (
                <div className="seat-row-part" key={gi}>
                  <div className="seat-group">
                    {group.map((seat) => {
                      const occupant = occupantBySeat[seat.id]
                      return (
                        <Seat
                          key={seat.id}
                          seat={seat}
                          occupant={occupant}
                          isActiveOccupant={occupant?.id === activePassengerId}
                          onSelect={onSelectSeat}
                          onPreview={setPreviewSeat}
                        />
                      )
                    })}
                  </div>
                  {gi < row.groups.length - 1 && <span className="aisle" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}