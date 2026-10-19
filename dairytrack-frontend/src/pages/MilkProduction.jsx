
import { useEffect, useState } from 'react'
import './MilkProduction.css'

function MilkProduction({ userRole }) {
  const getToday = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const [date, setDate] = useState(getToday)
  const [records, setRecords] = useState([])
  const [dailyTotal, setDailyTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [cows, setCows] = useState([])
  const [cowsLoading, setCowsLoading] = useState(true)
  const [cowId, setCowId] = useState('')
  const [session, setSession] = useState('MORNING')
  const [quantity, setQuantity] = useState('')
  const [editingId, setEditingId] = useState(null)

  // Load active cows dynamically from the backend.
  useEffect(() => {
    const loadCows = async () => {
      try {
        const response = await fetch('/api/cows/active-options')

        if (!response.ok) {
          throw new Error('Unable to load active cows.')
        }

        const data = await response.json()
        setCows(data)

        if (data.length === 0) {
          setError('No active cows found. Add an active cow first.')
        }
      } catch (err) {
        setError(err.message || 'Unable to load active cows.')
      } finally {
        setCowsLoading(false)
      }
    }

    loadCows()
  }, [])

  // Load production records for the selected date.
  const loadRecords = async () => {
    setLoading(true)
    setError('')

    try {
      const [recordsResponse, totalResponse] = await Promise.all([
        fetch(`/api/milk-production?date=${date}`),
        fetch(`/api/milk-production/daily-total?date=${date}`),
      ])

      if (!recordsResponse.ok || !totalResponse.ok) {
        throw new Error('Unable to load milk production records.')
      }

      const recordsData = await recordsResponse.json()
      const totalData = await totalResponse.json()

      setRecords(recordsData)
      setDailyTotal(Number(totalData))
    } catch (err) {
      setError(err.message || 'Unable to load production data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [date])

  // Save a milk production entry.
  
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (
      !cowId ||
      quantity === '' ||
      !Number.isFinite(Number(quantity)) ||
      Number(quantity) < 0
    ) {
      setError('Select a cow and enter a valid milk quantity.')
      return
    }

    try {
      // Step 1: Obtain the CSRF token.
      const csrfResponse = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'same-origin',
      })

      if (!csrfResponse.ok) {
        throw new Error('Unable to obtain security token. Please try again.')
      }

      const csrfData = await csrfResponse.json()

      if (!csrfData.token) {
        throw new Error('Security token is missing. Please refresh the page.')
      }

      // Step 2: Prepare the milk production request.
      const params = new URLSearchParams({
        cowId,
        date,
        session,
        quantityLitres: quantity,
      })

      // Step 3: Send the request with the CSRF token.
      
  const response = await fetch(
    editingId
      ? `/api/milk-production/${editingId}?${params.toString()}`
      : `/api/milk-production?${params.toString()}`,
    {
      method: editingId ? 'PUT' : 'POST',
      headers: {
        'X-XSRF-TOKEN': csrfData.token,
      },
      credentials: 'same-origin',
    }
  )


      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.message || `Could not save the milk entry (${response.status}).`
        )
      }

      
  setSuccess(
    editingId
      ? 'Milk production entry updated successfully.'
      : 'Milk production entry saved successfully.'
  )
  setEditingId(null)
  setCowId('')
  setSession('MORNING')
  setQuantity('')


      await loadRecords()
    } catch (err) {
      setError(err.message || 'Could not save the milk entry.')
    }
  }
  
  const handleEdit = (record) => {
    if (userRole !== 'OWNER') {
      setError('Only the owner can edit milk production records.')
      return
    }

    setEditingId(record.id)
    setCowId(String(record.cowId))
    setSession(record.session)
    setQuantity(String(record.quantityLitres))
    setDate(record.productionDate || date)
    setError('')
    setSuccess('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setCowId('')
    setSession('MORNING')
    setQuantity('')
    setError('')
    setSuccess('')
  }


  return (
    <div className="milk-page">
      <header className="milk-header">
        <div>
          <p className="milk-breadcrumb">Workspace / Milk Production</p>
          <h1>Milk Production</h1>
          <p className="milk-subtitle">
            Record and monitor daily milk production.
          </p>
        </div>

        <div className="milk-date-control">
          <label htmlFor="production-date">Production date</label>
          <input
            id="production-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </header>

      {error && <div className="milk-message error">{error}</div>}
      {success && <div className="milk-message success">{success}</div>}

      <section className="milk-summary">
        <article className="milk-summary-card">
          <span>Total milk produced</span>
          <strong>{loading ? '...' : `${dailyTotal} L`}</strong>
          <small>Selected date</small>
        </article>

        <article className="milk-summary-card">
          <span>Entries recorded</span>
          <strong>{loading ? '...' : records.length}</strong>
          <small>Morning and evening records</small>
        </article>
      </section>

      <section className="milk-panel">
        <div className="milk-panel-heading">
          <div>
            <h2>{editingId ? 'Edit milk production' : 'Record milk production'}</h2>
<p>
  {editingId
    ? 'Correct the milk production details and save your changes.'
    : 'Enter the quantity measured for a cow and session.'}
</p>
          </div>
        </div>

        <form className="milk-form" onSubmit={handleSubmit}>
          <div className="milk-field">
            <label htmlFor="cow-id">Cow</label>
            <select
              id="cow-id"
              value={cowId}
              onChange={(event) => setCowId(event.target.value)}
              required
              disabled={cowsLoading || cows.length === 0}
            >
              <option value="">
                {cowsLoading ? 'Loading cows...' : 'Select a cow'}
              </option>

              {cows.map((cow) => (
                <option key={cow.id} value={cow.id}>
                  {cow.cowCode}
                </option>
              ))}
            </select>
          </div>

          <div className="milk-field">
            <label htmlFor="milk-session">Session</label>
            <select
              id="milk-session"
              value={session}
              onChange={(event) => setSession(event.target.value)}
            >
              <option value="MORNING">Morning</option>
              <option value="EVENING">Evening</option>
            </select>
          </div>

          <div className="milk-field">
            <label htmlFor="milk-quantity">Quantity (litres)</label>
            <input
              id="milk-quantity"
              type="number"
              min="0"
              max="999999999"
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <button
            className="milk-submit"
            type="submit"
            disabled={loading || cowsLoading || cows.length === 0}
          >
            {editingId ? 'Update milk entry' : 'Save milk entry'}
          </button>
          {editingId && (
  <button
    className="milk-refresh"
    type="button"
    onClick={cancelEdit}
  >
    Cancel
  </button>
)}
        </form>

        <p className="milk-form-note">
          Zero litres is allowed when a cow produces no milk. Each cow can
          have one morning and one evening entry per date.
        </p>
      </section>

      <section className="milk-panel">
        <div className="milk-panel-heading">
          <div>
            <h2>Production records</h2>
            <p>Records for {date}</p>
          </div>

          <button
            className="milk-refresh"
            type="button"
            onClick={loadRecords}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="milk-table-wrap">
          <table className="milk-table">
            
<thead>
  <tr>
    <th>Cow code</th>
    <th>Session</th>
    <th>Quantity</th>
    {userRole === 'OWNER' && <th>Actions</th>}
  </tr>
</thead>


            
<tbody>
  {loading ? (
    <tr>
      <td
        colSpan={userRole === 'OWNER' ? 4 : 3}
        className="milk-empty"
      >
        Loading production records...
      </td>
    </tr>
  ) : records.length === 0 ? (
    <tr>
      <td
        colSpan={userRole === 'OWNER' ? 4 : 3}
        className="milk-empty"
      >
        No production records for this date.
      </td>
    </tr>
  ) : (
    records.map((record) => (
      <tr key={record.id}>
        <td>{record.cowCode}</td>
        <td>
          <span className="milk-session-badge">
            {record.session}
          </span>
        </td>
        <td>{record.quantityLitres} L</td>

        {userRole === 'OWNER' && (
          <td>
            <button
              type="button"
              className="milk-refresh"
              onClick={() => handleEdit(record)}
            >
              Edit
            </button>
          </td>
        )}
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

export default MilkProduction
