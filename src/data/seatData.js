//Mock data: layouts, pricing categories, meals
export const MAX_PASSENGERS = 6
export const ROW_COUNT = 18

export const LAYOUTS = {
  '3-2': { id: '3-2', label: '3–2', groups: [['A', 'B', 'C'], ['D', 'E']] },
  '2-3-2': { id: '2-3-2', label: '2–3–2', groups: [['A', 'B'], ['C', 'D', 'E'], ['F', 'G']] },
}

export const CATEGORIES = {
  standard: { id: 'standard', label: 'Standard', price: 0 },
  preferred: { id: 'preferred', label: 'Preferred window', price: 150 },
  premium: { id: 'premium', label: 'Premium', price: 250 },
  legroom: { id: 'legroom', label: 'Extra legroom', price: 350 },
}

export const MEALS = [
  { id: 'none', label: 'No meal', price: 0 },
  { id: 'veg-sandwich', label: 'Veg sandwich (complimentary)', price: 0 },
  { id: 'fruit-nuts', label: 'Fruit & nuts box', price: 120 },
  { id: 'paneer-wrap', label: 'Paneer tikka wrap', price: 180 },
  { id: 'chicken-biryani', label: 'Chicken biryani', price: 260 },
]

function categoryFor(row, isWindow) {
  if (row === 1 || row === 9) return 'legroom'
  if (row >= 2 && row <= 4) return 'premium'
  if (isWindow && row >= 5 && row <= 12) return 'preferred'
  return 'standard'
}

const OCCUPANCY_SEED = 20261116
const OCCUPANCY_RATE = 0.22
const SEAT_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

function createRandom(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const OCCUPIED_SEAT_IDS = (() => {
  const random = createRandom(OCCUPANCY_SEED)
  const ids = new Set()
  for (let row = 1; row <= ROW_COUNT; row++) {
    for (const col of SEAT_COLUMNS) {
      if (random() < OCCUPANCY_RATE) ids.add(`${row}${col}`)
    }
  }
  return ids
})()

export function buildSeatMap(layoutId) {
  const layout = LAYOUTS[layoutId]
  const allCols = layout.groups.flat()
  const seatsById = {}

  const rows = Array.from({ length: ROW_COUNT }, (_, i) => {
    const row = i + 1
    const groups = layout.groups.map((cols) =>
      cols.map((col) => {
        const colIndex = allCols.indexOf(col)
        const isWindow = colIndex === 0 || colIndex === allCols.length - 1
        const category = categoryFor(row, isWindow)
        const seat = {
          id: `${row}${col}`,
          row,
          col,
          category,
          price: CATEGORIES[category].price,
          occupied: OCCUPIED_SEAT_IDS.has(`${row}${col}`),        }
        seatsById[seat.id] = seat
        return seat
      })
    )
    return { number: row, groups }
  })

  return { layout, rows, seatsById }
}

export function fetchSeatMaps() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (new URLSearchParams(window.location.search).has('error')) {
        reject(new Error('Could not load the aircraft seat map.'))
        return
      }
      resolve(Object.fromEntries(Object.keys(LAYOUTS).map((id) => [id, buildSeatMap(id)])))
    }, 700)
  })
}
