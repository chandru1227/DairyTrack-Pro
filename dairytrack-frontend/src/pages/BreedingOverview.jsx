
import { useEffect, useState } from 'react'

function BreedingOverview() {
  const [cows, setCows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCows = async () => {
      try {
        const response = await fetch('/api/cows')

        if (!response.ok) {
          throw new Error('Unable to load breeding records.')
        }

        const data = await response.json()
        setCows(data)
      } catch (err) {
        setError(err.message || 'Unable to load breeding records.')
      } finally {
        setLoading(false)
      }
    }

    loadCows()
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const datedCows = cows
    .filter(
      (cow) =>
        cow.status === 'ACTIVE' &&
        cow.matingDate &&
        cow.expectedDeliveryDate
    )
    .map((cow) => {
      const deliveryDate = new Date(
        `${cow.expectedDeliveryDate}T00:00:00`
      )

      const daysRemaining = Math.round(
        (deliveryDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      )

      return { ...cow, daysRemaining }
    })
    .sort(
      (a, b) =>
        a.expectedDeliveryDate.localeCompare(b.expectedDeliveryDate)
    )

  const upcoming7Days = datedCows.filter(
    (cow) => cow.daysRemaining >= 0 && cow.daysRemaining <= 7
  )

  const upcoming30Days = datedCows.filter(
    (cow) => cow.daysRemaining >= 0 && cow.daysRemaining <= 30
  )

  const overdueCows = datedCows.filter(
    (cow) => cow.daysRemaining < 0
  )

  const formatDays = (days) => {
    if (days < 0) {
      return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
    }

    if (days === 0) return 'Expected today'
    if (days === 1) return '1 day remaining'

    return `${days} days remaining`
  }

  return (
    <div className="milk-page">
      <header className="milk-header">
        <div>
          <p className="milk-breadcrumb">
            Workspace / Breeding & Calving
          </p>
          <h1>Breeding & Calving</h1>
          <p className="milk-subtitle">
            Track upcoming and overdue expected delivery dates.
          </p>
        </div>

        <button
          className="milk-refresh"
          type="button"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </header>

      {error && (
        <div className="milk-message error" role="alert">
          {error}
        </div>
      )}

      <section className="milk-summary">
        <article className="milk-summary-card">
          <span>Expected in 7 days</span>
          <strong>{loading ? '...' : upcoming7Days.length}</strong>
          <small>Active cows</small>
        </article>

        <article className="milk-summary-card">
          <span>Expected in 30 days</span>
          <strong>{loading ? '...' : upcoming30Days.length}</strong>
          <small>Active cows</small>
        </article>

        <article className="milk-summary-card">
          <span>Overdue dates</span>
          <strong>{loading ? '...' : overdueCows.length}</strong>
          <small>Requires attention</small>
        </article>
      </section>

      <section className="milk-panel">
        <div className="milk-panel-heading">
          <div>
            <h2>Breeding records</h2>
            <p>
              Active cows with recorded mating and expected delivery dates.
            </p>
          </div>
        </div>

        <div className="milk-table-wrap">
          <table className="milk-table">
            <thead>
              <tr>
                <th>Cow code</th>
                <th>Breed</th>
                <th>Mating date</th>
                <th>Expected delivery</th>
                <th>Time remaining</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="milk-empty">
                    Loading breeding records...
                  </td>
                </tr>
              ) : datedCows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="milk-empty">
                    No active cows have complete breeding dates yet.
                  </td>
                </tr>
              ) : (
                datedCows.map((cow) => (
                  <tr key={cow.id}>
                    <td>{cow.cowCode}</td>
                    <td>{cow.breed || '—'}</td>
                    <td>{cow.matingDate}</td>
                    <td>{cow.expectedDeliveryDate}</td>
                    <td>{formatDays(cow.daysRemaining)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default BreedingOverview
