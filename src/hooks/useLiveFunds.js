import { useState, useEffect } from 'react'
import { FUNDS as STATIC_FUNDS } from '../utils/fundsData'

const API_URL = 'https://kuveytturk-api.vercel.app/api/funds'
const CACHE_KEY = 'kt_funds_cache'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export function useLiveFunds() {
  const [funds, setFunds] = useState(STATIC_FUNDS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    async function fetchFunds() {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_TTL) {
            setFunds(mergeFunds(data))
            setUpdatedAt(data.updatedAt)
            setLoading(false)
            return
          }
        }

        // Fetch from API
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()

        if (data.success && data.funds) {
          const merged = mergeFunds(data)
          setFunds(merged)
          setUpdatedAt(data.updatedAt)

          // Save to cache
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
          }))
        }
      } catch (err) {
        console.warn('API fetch failed, using static data:', err.message)
        setError(err.message)
        // Keep static data as fallback
      } finally {
        setLoading(false)
      }
    }

    fetchFunds()
  }, [])

  return { funds, loading, error, updatedAt }
}

// Merge live API data with static fund metadata
function mergeFunds(apiData) {
  return STATIC_FUNDS.map(staticFund => {
    const live = apiData.funds[staticFund.code]
    if (!live || live.price === null) return staticFund

    return {
      ...staticFund,
      price:         live.price         ?? staticFund.price,
      monthlyReturn: live.monthlyReturn  ?? staticFund.monthlyReturn,
      return3m:      live.return3m       ?? staticFund.return3m,
      return6m:      live.return6m       ?? staticFund.return6m,
      ytd:           live.ytd            ?? staticFund.ytd,
      annualReturn:  live.annualReturn   ?? staticFund.annualReturn,
    }
  })
}
