import { LAYOUTS, MAX_PASSENGERS, MEALS } from '../data/seatData.js'

const STORAGE_KEY = 'seat-selector:v2'

export function restoreState(saved, fallback) {
  if (!saved || typeof saved !== 'object') return fallback

  const seenIds = new Set()
  const passengers = (Array.isArray(saved.passengers) ? saved.passengers : [])
    .filter((p) => p && Number.isInteger(p.id) && p.id > 0 && !seenIds.has(p.id) && seenIds.add(p.id))
    .slice(0, MAX_PASSENGERS)
    .map((p) => ({
      id: p.id,
      name: typeof p.name === 'string' ? p.name.slice(0, 24) : '',
      mealId: MEALS.some((m) => m.id === p.mealId) ? p.mealId : 'none',
    }))
  if (passengers.length === 0) return fallback

  const ids = passengers.map((p) => p.id)
  const takenSeats = new Set()
  const assignments = {}
  for (const id of ids) {
    const seatId = saved.assignments?.[id]
    if (typeof seatId === 'string' && !takenSeats.has(seatId)) {
      takenSeats.add(seatId)
      assignments[id] = seatId
    }
  }

  return {
    ...fallback,
    passengers,
    nextPassengerId: Math.max(Number(saved.nextPassengerId) || 0, Math.max(...ids) + 1),
    activePassengerId: ids.includes(saved.activePassengerId) ? saved.activePassengerId : ids[0],
    layoutId: Object.hasOwn(LAYOUTS, saved.layoutId) ? saved.layoutId : fallback.layoutId,
    assignments,
  }
}

export function loadState(fallback) {
  try {
    return restoreState(JSON.parse(localStorage.getItem(STORAGE_KEY)), fallback)
  } catch {
    return fallback
  }
}

export function saveState(state) {
  try {
    const { passengers, nextPassengerId, activePassengerId, layoutId, assignments } = state
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ passengers, nextPassengerId, activePassengerId, layoutId, assignments })
    )
  } catch {
  }
}