import { formatAmount } from '../state/format'

export default function TotalBar({ total, assigned, count }) {
  return (
    <div className="total-bar" role="status">
      <span>{assigned}/{count} seats selected</span>
      <strong>Total {formatAmount(total)}</strong>
    </div>
  )
}