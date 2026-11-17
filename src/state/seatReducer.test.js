import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSeatMap, LAYOUTS } from '../data/seatData.js'
import { initialState, seatReducer, selectPassengers, selectTotals } from './seatReducer.js'
import { restoreState } from './storage.js'

const maps = { '3-2': buildSeatMap('3-2'), '2-3-2': buildSeatMap('2-3-2') }
const seatsById = maps['3-2'].seatsById
const free = (category, skip = []) =>
  Object.values(seatsById).find((s) => s.category === category && !s.occupied && !skip.includes(s.id))
const freeIn = (layout, predicate) =>
  Object.values(maps[layout].seatsById).find((s) => !s.occupied && predicate(s))
const run = (state, ...actions) => actions.reduce(seatReducer, state)
const assign = (seat) => ({ type: 'ASSIGN_SEAT', seat })
const toLayout = (layoutId) => ({ type: 'REQUEST_LAYOUT_CHANGE', layoutId, seatsById: maps[layoutId].seatsById })
const view = (state) => selectPassengers(state, seatsById)
const total = (state) => selectTotals(view(state))

// Three passengers, each with a seat, a name and a meal.
function threePassengers() {
  const [a, b, c] = [free('standard'), free('premium'), free('legroom')]
  const state = run(
    initialState,
    { type: 'ADD_PASSENGER' },
    { type: 'RENAME', id: 1, name: 'Asha' }, { type: 'SET_MEAL', id: 1, mealId: 'chicken-biryani' },
    { type: 'RENAME', id: 2, name: 'Ravi' }, { type: 'SET_MEAL', id: 2, mealId: 'paneer-wrap' },
    { type: 'RENAME', id: 3, name: 'Meera' }, { type: 'SET_MEAL', id: 3, mealId: 'veg-sandwich' },
    { type: 'SET_ACTIVE', id: 1 }, assign(a),
    { type: 'SET_ACTIVE', id: 2 }, assign(b),
    { type: 'SET_ACTIVE', id: 3 }, assign(c)
  )
  return { state, a, b, c }
}

// seat assignment

test('assigning a seat sets it and moves to the next passenger without one', () => {
  const a = free('standard')
  const s = run(initialState, assign(a))
  assert.equal(s.assignments[1], a.id)
  assert.equal(s.activePassengerId, 2)
  assert.equal(s.notice.type, 'success')
})

test('occupied seats and seats held by another passenger are rejected', () => {
  const occupied = Object.values(seatsById).find((x) => x.occupied)
  let s = run(initialState, assign(occupied))
  assert.deepEqual(s.assignments, {})
  assert.equal(s.notice.type, 'error')

  const a = free('standard')
  s = run(initialState, assign(a), { type: 'SET_ACTIVE', id: 2 }, assign(a))
  assert.equal(s.assignments[1], a.id)
  assert.equal(s.assignments[2], undefined)
  assert.equal(s.notice.type, 'error')
})

test('one seat per passenger: a new pick replaces the old one; clicking it again removes it', () => {
  const a = free('standard'), b = free('premium')
  let s = run(initialState, assign(a), { type: 'SET_ACTIVE', id: 1 }, assign(b))
  assert.equal(s.assignments[1], b.id)
  assert.equal(Object.keys(s.assignments).length, 1)
  s = run(s, { type: 'SET_ACTIVE', id: 1 }, assign(b))
  assert.deepEqual(s.assignments, {})
})

test('switching passengers keeps earlier assignments', () => {
  const a = free('standard'), b = free('premium')
  const s = run(initialState, assign(a), assign(b), { type: 'SET_ACTIVE', id: 1 })
  assert.equal(s.assignments[1], a.id)
  assert.equal(s.assignments[2], b.id)
})

test('invalid ids are ignored', () => {
  for (const id of [0, 3, -1, 1.5, 'x', undefined]) {
    assert.equal(run(initialState, { type: 'SET_ACTIVE', id }), initialState)
  }
  assert.equal(run(initialState, { type: 'SET_MEAL', id: 1, mealId: 'nope' }), initialState)
  assert.equal(run(initialState, { type: 'SET_MEAL', id: 99, mealId: 'none' }), initialState)
})

// layout switching: one seat per passenger across the flight

test('seats that exist in the new layout are kept, with no confirmation needed', () => {
  const { state, a, b, c } = threePassengers()
  const s = run(state, toLayout('2-3-2'))
  assert.equal(s.layoutId, '2-3-2')
  assert.equal(s.pendingLayout, null)
  assert.deepEqual(s.assignments, { 1: a.id, 2: b.id, 3: c.id })
  assert.equal(s.notice.type, 'success')
})

test('seats missing from the new layout need confirmation; other seats and details survive', () => {
  const g = freeIn('2-3-2', (x) => x.col === 'G')
  const a = freeIn('2-3-2', (x) => x.col === 'A' && x.id !== g.id)
  let s = run(initialState, toLayout('2-3-2'), { type: 'RENAME', id: 1, name: 'Asha' },
    { type: 'SET_MEAL', id: 1, mealId: 'paneer-wrap' }, assign(a), assign(g))
  assert.deepEqual(s.assignments, { 1: a.id, 2: g.id })

  const requested = run(s, toLayout('3-2'))
  assert.equal(requested.layoutId, '2-3-2')
  assert.deepEqual(requested.pendingLayout.released, [{ passengerId: 2, seatId: g.id }])
  assert.deepEqual(requested.pendingLayout.kept, { 1: a.id })

  const confirmed = run(requested, { type: 'CONFIRM_LAYOUT_CHANGE' })
  assert.equal(confirmed.layoutId, '3-2')
  assert.deepEqual(confirmed.assignments, { 1: a.id })
  assert.equal(confirmed.pendingLayout, null)
  assert.deepEqual(confirmed.passengers, s.passengers)
  assert.match(confirmed.notice.text, new RegExp(`Passenger 2's seat ${g.id}`))

  const cancelled = run(requested, { type: 'CANCEL_LAYOUT_CHANGE' })
  assert.equal(cancelled.layoutId, '2-3-2')
  assert.deepEqual(cancelled.assignments, s.assignments)
})

test('a passenger never ends up with a seat in two layouts', () => {
  const { state } = threePassengers()
  const s = run(state, toLayout('2-3-2'), toLayout('3-2'))
  for (const p of s.passengers) assert.ok(typeof s.assignments[p.id] !== 'object')
  assert.equal(Object.keys(s.assignments).length, 3)
})

test('bad or same layouts are ignored', () => {
  for (const layoutId of ['4-4', undefined, '__proto__', '3-2']) {
    assert.equal(run(initialState, { ...toLayout('3-2'), layoutId }), initialState)
  }
  assert.equal(run(initialState, { type: 'REQUEST_LAYOUT_CHANGE', layoutId: '2-3-2' }), initialState)
  assert.equal(run(initialState, { type: 'CONFIRM_LAYOUT_CHANGE' }), initialState)
})

test('SYNC_SEATS releases saved seats that are occupied or missing', () => {
  const occupied = Object.values(seatsById).find((x) => x.occupied)
  const ok = free('standard')
  const stale = { ...initialState, assignments: { 1: occupied.id, 2: ok.id } }
  const s = run(stale, { type: 'SYNC_SEATS', seatsById })
  assert.deepEqual(s.assignments, { 2: ok.id })
  assert.equal(s.notice.type, 'error')
  assert.equal(run(s, { type: 'SYNC_SEATS', seatsById }), s) 
})

// removing an individual passenger

test('removing a middle passenger releases only their seat, name and meal', () => {
  const { state, a, c } = threePassengers()
  const before = total(state)
  const s = run(state, { type: 'REMOVE_PASSENGER', id: 2 })

  assert.deepEqual(s.passengers.map((p) => p.id), [1, 3])
  assert.deepEqual(s.assignments, { 1: a.id, 3: c.id })
  const [p1, p3] = view(s)
  assert.equal(p1.name, 'Asha'); assert.equal(p1.meal.id, 'chicken-biryani'); assert.equal(p1.seat.id, a.id)
  assert.equal(p3.name, 'Meera'); assert.equal(p3.meal.id, 'veg-sandwich'); assert.equal(p3.seat.id, c.id)
  assert.equal(p3.number, 2)
  assert.equal(total(s).total, before.total - 250 - 180)
  assert.match(s.notice.text, /Ravi removed, seat .* released/)
})

test('removing a passenger with a seat or a paid meal asks first; others are removed straight away', () => {
  const { state } = threePassengers()
  let s = run(state, { type: 'REQUEST_REMOVE_PASSENGER', id: 2 })
  assert.equal(s.pendingRemovalId, 2)
  assert.equal(s.passengers.length, 3)
  const cancelled = run(s, { type: 'CANCEL_REMOVE_PASSENGER' })
  assert.equal(cancelled.pendingRemovalId, null)
  assert.equal(cancelled.passengers.length, 3)
  s = run(s, { type: 'CONFIRM_REMOVE_PASSENGER' })
  assert.deepEqual(s.passengers.map((p) => p.id), [1, 3])
  assert.equal(s.pendingRemovalId, null)

  // Seat only, no meal -> still asks. Free meal, no seat -> removed immediately
  const seatOnly = run(initialState, assign(free('standard')), { type: 'SET_ACTIVE', id: 1 })
  assert.equal(run(seatOnly, { type: 'REQUEST_REMOVE_PASSENGER', id: 1 }).pendingRemovalId, 1)
  const noSeat = run(initialState, { type: 'SET_MEAL', id: 2, mealId: 'veg-sandwich' })
  assert.deepEqual(run(noSeat, { type: 'REQUEST_REMOVE_PASSENGER', id: 2 }).passengers.map((p) => p.id), [1])
})

test('removed seats can be picked by someone else; ids are never reused', () => {
  const { state, b } = threePassengers()
  let s = run(state, { type: 'REMOVE_PASSENGER', id: 2 }, { type: 'SET_ACTIVE', id: 3 }, assign(b))
  assert.equal(s.assignments[3], b.id)
  s = run(s, { type: 'ADD_PASSENGER' })
  assert.equal(s.passengers.at(-1).id, 4)
  assert.equal(s.passengers.at(-1).name, '')
  assert.equal(s.passengers.at(-1).mealId, 'none')
})

test('removing the active passenger selects a neighbour; the last passenger cannot be removed', () => {
  const { state } = threePassengers()
  let s = run(state, { type: 'SET_ACTIVE', id: 3 }, { type: 'REMOVE_PASSENGER', id: 3 })
  assert.equal(s.activePassengerId, 2)
  s = run(s, { type: 'REMOVE_PASSENGER', id: 2 })
  assert.equal(s.passengers.length, 1)
  assert.equal(run(s, { type: 'REMOVE_PASSENGER', id: 1 }), s)
  assert.equal(run(s, { type: 'REQUEST_REMOVE_PASSENGER', id: 1 }), s)
  assert.equal(run(s, { type: 'REMOVE_PASSENGER', id: 99 }), s)
})

test('passenger count stops at 6', () => {
  let s = initialState
  for (let i = 0; i < 10; i++) s = run(s, { type: 'ADD_PASSENGER' })
  assert.equal(s.passengers.length, 6)
})

// totals

test('totals add seats and meals, and update after changes and removals', () => {
  const { state } = threePassengers()
  assert.deepEqual(total(state), { seats: 600, meals: 440, total: 1040 })
  const s = run(state, { type: 'REMOVE_SEAT', id: 3 })
  assert.equal(total(s).seats, 250)
})

// saved state (refresh)

test('restoreState brings back a valid saved session', () => {
  const { state } = threePassengers()
  const saved = JSON.parse(JSON.stringify({ ...state, layoutId: '2-3-2' }))
  const restored = restoreState(saved, initialState)
  assert.deepEqual(restored.passengers, state.passengers)
  assert.deepEqual(restored.assignments, state.assignments)
  assert.equal(restored.layoutId, '2-3-2')
  assert.equal(restored.nextPassengerId, 4)
  assert.equal(restored.pendingLayout, null)
})

test('restoreState repairs or rejects bad data', () => {
  assert.equal(restoreState(null, initialState), initialState)
  assert.equal(restoreState({ passengers: [] }, initialState), initialState)
  const bad = restoreState({
    passengers: [{ id: 1, name: 5, mealId: 'nope' }, { id: 1, name: 'dup' }, { id: 2, name: 'B' }],
    assignments: { 1: '3C', 2: '3C', 9: '4A' },
    layoutId: 'weird', activePassengerId: 77, nextPassengerId: 'x',
  }, initialState)
  assert.deepEqual(bad.passengers, [{ id: 1, name: '', mealId: 'none' }, { id: 2, name: 'B', mealId: 'none' }])
  assert.deepEqual(bad.assignments, { 1: '3C' })
  assert.equal(bad.layoutId, '3-2')
  assert.equal(bad.activePassengerId, 1)
  assert.equal(bad.nextPassengerId, 3)
})

// seat maps

test('occupied seats are scattered, consistent across layouts, and not a fixed diagonal pattern', () => {
  const ids = (layout) => Object.values(maps[layout].seatsById).filter((s) => s.occupied).map((s) => s.id)
  for (const id of Object.keys(LAYOUTS)) {
    const map = maps[id]
    const perRow = map.layout.groups.flat().length
    assert.ok(map.rows.every((r) => r.groups.flat().length === perRow))
    assert.equal(Object.keys(map.seatsById).length, map.rows.length * perRow)
    assert.ok(map.rows.every((r) => r.groups.flat().some((s) => !s.occupied)), 'no completely full row')
    const all = Object.values(map.seatsById)
    assert.ok(all.some((x) => x.price === 0) && all.some((x) => x.price > 0) && all.some((x) => x.occupied))
  }

  for (const id of ids('3-2')) assert.equal(maps['2-3-2'].seatsById[id].occupied, true)
  const oldPattern = new Set()
  maps['3-2'].rows.forEach((r) => r.groups.flat().forEach((s, i) => {
    if ((r.number * 7 + i * 13) % 5 === 0) oldPattern.add(s.id)
  }))
  assert.notDeepEqual(new Set(ids('3-2')), oldPattern)
})