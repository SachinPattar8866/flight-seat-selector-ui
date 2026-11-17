import { LAYOUTS } from '../data/seatData'

export default function LayoutSwitcher({ layoutId, onChange }) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Aircraft layout">
      {Object.values(LAYOUTS).map((l) => (
        <button key={l.id} type="button" role="radio" aria-checked={l.id === layoutId}
          className={l.id === layoutId ? 'is-on' : ''} onClick={() => onChange(l.id)}>
          {l.label}
        </button>
      ))}
    </div>
  )
}
