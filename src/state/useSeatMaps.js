import { useCallback, useEffect, useState } from 'react'
import { fetchSeatMaps } from '../data/seatData'

export function useSeatMaps() {
  const [state, setState] = useState({ status: 'loading', maps: null, error: null })

  const load = useCallback(() => {
    setState({ status: 'loading', maps: null, error: null })
    fetchSeatMaps()
      .then((maps) => setState({ status: 'ready', maps, error: null }))
      .catch((error) => setState({ status: 'error', maps: null, error }))
  }, [])

  useEffect(() => { load() }, [load])
  return { ...state, retry: load }
}
