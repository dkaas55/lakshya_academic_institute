import { useCallback, useEffect, useState } from 'react'
import api from '../lib/api'

/**
 * Centralized hook that fetches active batch names from the backend.
 * Replaces all hardcoded BATCH_OPTIONS arrays throughout the app.
 *
 * @returns {{ batches: string[], loading: boolean, error: string, refetch: () => Promise<void> }}
 */
export default function useBatches() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchBatches = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/batches')
      if (data.success) {
        setBatches(data.data.batches)
      } else {
        setError(data.message || 'Failed to load batches')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server.' : 'Failed to load batches')
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  return { batches, loading, error, refetch: fetchBatches }
}
