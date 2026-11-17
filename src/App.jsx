import { useEffect, useMemo, useReducer } from 'react'
import { LAYOUTS } from './data/seatData'
import { formatPrice } from './state/format'
import { initialState, seatReducer, selectPassengers, selectTotals } from './state/seatReducer'
import { loadState, saveState } from './state/storage'
import { useSeatMaps } from './state/useSeatMaps'
import PassengerPanel from './components/PassengerPanel'
import SeatMap from './components/SeatMap'
import Summary from './components/Summary'
import TotalBar from './components/TotalBar'
import LayoutSwitcher from './components/LayoutSwitcher'
import ConfirmDialog from './components/ConfirmDialog'
import { ErrorState, LoadingState, Toast } from './components/Status'
import PlaneIcon from './components/PlaneIcon'

export default function App() {
  const { status, maps, error, retry } = useSeatMaps()
  const [state, dispatch] = useReducer(seatReducer, initialState, loadState)

  useEffect(() => {
    saveState(state)
  }, [state.passengers, state.nextPassengerId, state.activePassengerId, state.layoutId, state.assignments])

  useEffect(() => {
    if (!state.notice) return
    const timer = setTimeout(() => dispatch({ type: 'DISMISS_NOTICE', id: state.notice.id }), 3500)
    return () => clearTimeout(timer)
  }, [state.notice])

  const seatMap = maps?.[state.layoutId]

  useEffect(() => {
    if (seatMap) dispatch({ type: 'SYNC_SEATS', seatsById: seatMap.seatsById })
  }, [seatMap])

  const passengers = useMemo(
    () => (seatMap ? selectPassengers(state, seatMap.seatsById) : []),
    [state, seatMap]
  )
  const totals = useMemo(() => selectTotals(passengers), [passengers])

  const occupantBySeat = useMemo(
    () =>
      Object.fromEntries(
        passengers.filter((p) => p.seat).map((p) => [p.seat.id, { id: p.id, number: p.number }])
      ),
    [passengers]
  )

  const nameOf = (id) => passengers.find((p) => p.id === id)?.name ?? 'Passenger'

  const layoutPrompt = state.pendingLayout
  const layoutMessage = layoutPrompt
    ? `Switching to the ${LAYOUTS[layoutPrompt.layoutId].label} layout will release ` +
      `${layoutPrompt.released.map((r) => `${nameOf(r.passengerId)} (${r.seatId})`).join(', ')}, because ` +
      `${layoutPrompt.released.length === 1 ? 'that seat isn’t' : 'those seats aren’t'} available there. ` +
      'All other seats are kept. Continue?'
    : ''

  const removing = passengers.find((p) => p.id === state.pendingRemovalId)
  const removalItems = removing
    ? [
        removing.seat && `seat ${removing.seat.id}`,
        removing.meal.price > 0 && `${removing.meal.label} (${formatPrice(removing.meal.price)})`,
      ].filter(Boolean)
    : []
  const removalMessage = removing
    ? `Remove ${removing.name}? Their ${removalItems.join(' and ')} will be removed and your total updated.`
    : ''

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Choose your seats</h1>
          <p className="flight-info">
            <PlaneIcon />
            <span>BLR → DEL · Flight 6E 2028</span>
          </p>
        </div>
        {status === 'ready' && (
          <LayoutSwitcher
            layoutId={state.layoutId}
            onChange={(layoutId) =>
              dispatch({ type: 'REQUEST_LAYOUT_CHANGE', layoutId, seatsById: maps[layoutId].seatsById })
            }
          />
        )}
      </header>

      {status === 'loading' && <LoadingState />}
      {status === 'error' && <ErrorState message={error.message} onRetry={retry} />}

      {status === 'ready' && (
        <>
          <main className="layout">
            <div className="area-passengers">
              <PassengerPanel passengers={passengers} activeId={state.activePassengerId} dispatch={dispatch} />
            </div>
            <div className="area-cabin">
              <SeatMap
                seatMap={seatMap}
                occupantBySeat={occupantBySeat}
                activePassengerId={state.activePassengerId}
                onSelectSeat={(seat) => dispatch({ type: 'ASSIGN_SEAT', seat })}
              />
            </div>
            <div className="area-summary">
              <Summary passengers={passengers} totals={totals} />
            </div>
          </main>
          <TotalBar total={totals.total} assigned={passengers.filter((p) => p.seat).length} count={passengers.length} />
        </>
      )}

      <ConfirmDialog
        open={layoutPrompt !== null}
        message={layoutMessage}
        confirmLabel="Continue"
        onConfirm={() => dispatch({ type: 'CONFIRM_LAYOUT_CHANGE' })}
        onCancel={() => dispatch({ type: 'CANCEL_LAYOUT_CHANGE' })}
      />
      <ConfirmDialog
        open={removing !== undefined}
        message={removalMessage}
        confirmLabel="Remove"
        onConfirm={() => dispatch({ type: 'CONFIRM_REMOVE_PASSENGER' })}
        onCancel={() => dispatch({ type: 'CANCEL_REMOVE_PASSENGER' })}
      />

      <Toast notice={state.notice} onDismiss={() => dispatch({ type: 'DISMISS_NOTICE', id: state.notice?.id })} />
    </div>
  )
}