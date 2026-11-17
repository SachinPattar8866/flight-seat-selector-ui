import { LAYOUTS, MAX_PASSENGERS, MEALS } from '../data/seatData.js'
import { formatPrice } from './format.js'

const createPassenger = (id) => ({ id, name: '', mealId: 'none' })

export const initialState = {
  passengers: [createPassenger(1), createPassenger(2)],
  nextPassengerId: 3,
  activePassengerId: 1,
  layoutId: '3-2',
  assignments: {},
  pendingLayout: null,
  pendingRemovalId: null,
  notice: null,
  noticeCounter: 0,
}

export const passengerLabel = (passenger, index) => passenger.name.trim() || `Passenger ${index + 1}`

const labelById = (state, id) => {
  const index = state.passengers.findIndex((p) => p.id === id)
  return index === -1 ? '' : passengerLabel(state.passengers[index], index)
}

const hasPassenger = (state, id) => state.passengers.some((p) => p.id === id)

const mealPrice = (passenger) => MEALS.find((m) => m.id === passenger.mealId)?.price ?? 0

const withNotice = (state, type, text) => ({
  ...state,
  notice: { id: state.noticeCounter + 1, type, text },
  noticeCounter: state.noticeCounter + 1,
})

const updatePassenger = (state, id, changes) => ({
  ...state,
  passengers: state.passengers.map((p) => (p.id === id ? { ...p, ...changes } : p)),
})

const without = (obj, key) => {
  const { [key]: _removed, ...rest } = obj
  return rest
}

function planSeats(assignments, seatsById) {
  const kept = {}
  const released = []
  for (const [id, seatId] of Object.entries(assignments)) {
    const seat = seatsById[seatId]
    if (seat && !seat.occupied) kept[id] = seatId
    else released.push({ passengerId: Number(id), seatId })
  }
  return { kept, released }
}

const describeReleased = (state, released) =>
  released.map((r) => `${labelById(state, r.passengerId)}'s seat ${r.seatId}`).join(', ')

function applyLayout(state, layoutId, kept, released) {
  const label = LAYOUTS[layoutId].label
  const base = { ...state, layoutId, assignments: kept, pendingLayout: null }
  if (released.length > 0) {
    return withNotice(
      base,
      'info',
      `Switched to the ${label} layout. Released ${describeReleased(state, released)} (not available in this layout).`
    )
  }
  if (Object.keys(kept).length > 0) {
    return withNotice(base, 'success', `Switched to the ${label} layout. Seats kept; charges updated for this layout.`)
  }
  return base
}

function removePassenger(state, id) {
  const index = state.passengers.findIndex((p) => p.id === id)
  if (index === -1 || state.passengers.length <= 1) return state

  const releasedSeat = state.assignments[id]
  const passengers = state.passengers.filter((p) => p.id !== id)

  // Name and meal live on the passenger object, so they leave with it. Remaining passengers keep their own seats, names and meals untouched.
  const activePassengerId =
    state.activePassengerId === id ? passengers[Math.min(index, passengers.length - 1)].id : state.activePassengerId

  return withNotice(
    { ...state, passengers, assignments: without(state.assignments, id), activePassengerId, pendingRemovalId: null },
    'info',
    `${labelById(state, id)} removed${releasedSeat ? `, seat ${releasedSeat} released` : ''}.`
  )
}

export function seatReducer(state, action) {
  switch (action.type) {
    case 'ADD_PASSENGER': {
      if (state.passengers.length >= MAX_PASSENGERS) return state
      return {
        ...state,
        passengers: [...state.passengers, createPassenger(state.nextPassengerId)],
        nextPassengerId: state.nextPassengerId + 1,
        activePassengerId: state.nextPassengerId,
      }
    }

// Asks for confirmation only when removing would discard a seat or a paid meal
    case 'REQUEST_REMOVE_PASSENGER': {
      const passenger = state.passengers.find((p) => p.id === action.id)
      if (!passenger || state.passengers.length <= 1) return state
      const needsConfirmation = Boolean(state.assignments[passenger.id]) || mealPrice(passenger) > 0
      return needsConfirmation ? { ...state, pendingRemovalId: passenger.id } : removePassenger(state, passenger.id)
    }

    case 'CONFIRM_REMOVE_PASSENGER':
      if (state.pendingRemovalId === null) return state
      return removePassenger({ ...state, pendingRemovalId: null }, state.pendingRemovalId)

    case 'CANCEL_REMOVE_PASSENGER':
      return { ...state, pendingRemovalId: null }

    case 'REMOVE_PASSENGER':
      return removePassenger(state, action.id)

    case 'SET_ACTIVE':
      return hasPassenger(state, action.id) ? { ...state, activePassengerId: action.id } : state

    case 'RENAME':
      return hasPassenger(state, action.id) ? updatePassenger(state, action.id, { name: action.name }) : state

    case 'SET_MEAL':
      if (!hasPassenger(state, action.id) || !MEALS.some((m) => m.id === action.mealId)) return state
      return updatePassenger(state, action.id, { mealId: action.mealId })

    case 'REQUEST_LAYOUT_CHANGE': {
      const { layoutId, seatsById } = action
      if (!Object.hasOwn(LAYOUTS, layoutId) || layoutId === state.layoutId || !seatsById) return state
      const { kept, released } = planSeats(state.assignments, seatsById)
      if (released.length === 0) return applyLayout(state, layoutId, kept, released)
      return { ...state, pendingLayout: { layoutId, kept, released } }
    }

    case 'CONFIRM_LAYOUT_CHANGE': {
      if (!state.pendingLayout) return state
      const { layoutId, kept, released } = state.pendingLayout
      return applyLayout(state, layoutId, kept, released)
    }

    case 'CANCEL_LAYOUT_CHANGE':
      return { ...state, pendingLayout: null }

    case 'SYNC_SEATS': {
      const { kept, released } = planSeats(state.assignments, action.seatsById)
      if (released.length === 0) return state
      return withNotice(
        { ...state, assignments: kept },
        'error',
        `Released ${describeReleased(state, released)}: no longer available.`
      )
    }

    case 'REMOVE_SEAT': {
      const seatId = state.assignments[action.id]
      if (!seatId) return state
      return withNotice(
        { ...state, assignments: without(state.assignments, action.id), activePassengerId: action.id },
        'info',
        `Seat ${seatId} removed from ${labelById(state, action.id)}.`
      )
    }

    case 'ASSIGN_SEAT': {
      const { seat } = action
      const active = state.activePassengerId

      if (seat.occupied) {
        return withNotice(state, 'error', `Seat ${seat.id} is already taken. Choose another seat.`)
      }

      const ownerEntry = Object.entries(state.assignments).find(([, seatId]) => seatId === seat.id)
      const ownerId = ownerEntry ? Number(ownerEntry[0]) : null

      if (ownerId === active) {
        return withNotice(
          { ...state, assignments: without(state.assignments, active) },
          'info',
          `Seat ${seat.id} removed from ${labelById(state, active)}.`
        )
      }

      if (ownerId !== null) {
        return withNotice(
          state,
          'error',
          `Seat ${seat.id} is assigned to ${labelById(state, ownerId)}. Remove it from them first.`
        )
      }

      const assignments = { ...state.assignments, [active]: seat.id } // replaces any previous seat

      const order = state.passengers.map((p) => p.id)
      const start = order.indexOf(active)
      const rotated = [...order.slice(start + 1), ...order.slice(0, start + 1)]
      const nextPassenger = rotated.find((id) => !assignments[id]) ?? active

      return withNotice(
        { ...state, assignments, activePassengerId: nextPassenger },
        'success',
        `${labelById(state, active)} → seat ${seat.id} (${formatPrice(seat.price)})`
      )
    }

    case 'DISMISS_NOTICE':
      return state.notice?.id === action.id ? { ...state, notice: null } : state

    default:
      return state
  }
}

export function selectPassengers(state, seatsById) {
  return state.passengers.map((p, index) => ({
    id: p.id,
    number: index + 1,
    name: passengerLabel(p, index),
    customName: p.name,
    seat: seatsById[state.assignments[p.id]] ?? null,
    meal: MEALS.find((m) => m.id === p.mealId) ?? MEALS[0],
  }))
}

export function selectTotals(passengers) {
  const seats = passengers.reduce((sum, p) => sum + (p.seat?.price ?? 0), 0)
  const meals = passengers.reduce((sum, p) => sum + p.meal.price, 0)
  return { seats, meals, total: seats + meals }
}