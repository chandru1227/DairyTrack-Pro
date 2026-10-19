
import { useEffect, useState } from 'react'

const getToday = () => {
  const today = new Date()

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
}

const calculateExpectedDate = (matingDate) => {
  if (!matingDate) return ''

  const date = new Date(`${matingDate}T12:00:00`)
  date.setDate(date.getDate() + 283)

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function Livestock() {
  const [cows, setCows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [editingId, setEditingId] = useState(null)

  const [cowCode, setCowCode] = useState('')
  const [breed, setBreed] = useState('')
  const [joiningDate, setJoiningDate] = useState(getToday())
  const [matingDate, setMatingDate] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [expectedDateManuallyChanged, setExpectedDateManuallyChanged] =
    useState(false)

  const loadCows = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/cows')

      if (!response.ok) {
        throw new Error('Unable to load livestock records.')
      }

      setCows(await response.json())
    } catch (err) {
      setError(err.message || 'Unable to load livestock.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCows()
  }, [])

  const activeCount = cows.filter(
    (cow) => cow.status === 'ACTIVE'
  ).length

  const inactiveCount = cows.filter(
    (cow) => cow.status === 'INACTIVE'
  ).length

  const resetForm = () => {
    setEditingId(null)
    setCowCode('')
    setBreed('')
    setJoiningDate(getToday())
    setMatingDate('')
    setExpectedDeliveryDate('')
    setStatus('ACTIVE')
    setExpectedDateManuallyChanged(false)
  }

  const handleMatingDateChange = (value) => {
    setMatingDate(value)
    setExpectedDeliveryDate(calculateExpectedDate(value))
    setExpectedDateManuallyChanged(false)
  }

  const startEditing = (cow) => {
    setError('')
    setSuccess('')
    setEditingId(cow.id)
    setCowCode(cow.cowCode || '')
    setBreed(cow.breed || '')
    setJoiningDate(cow.joiningDate || '')
    setMatingDate(cow.matingDate || '')
    setExpectedDeliveryDate(cow.expectedDeliveryDate || '')
    setStatus(cow.status || 'ACTIVE')
    setExpectedDateManuallyChanged(false)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const trimmedCode = cowCode.trim()
    const trimmedBreed = breed.trim()

    if (!trimmedCode || !trimmedBreed || !joiningDate) {
      setError('Please fill in the cow code, breed and joining date.')
      return
    }

    if (matingDate && matingDate < joiningDate) {
      setError('Mating date cannot be before the joining date.')
      return
    }

    if (expectedDeliveryDate && !matingDate) {
      setError('Enter a mating date before an expected delivery date.')
      return
    }

    if (
      matingDate &&
      expectedDeliveryDate &&
      expectedDeliveryDate <= matingDate
    ) {
      setError('Expected delivery date must be after the mating date.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        cowCode: trimmedCode,
        breed: trimmedBreed,
        joiningDate,
        matingDate: matingDate || null,
        expectedDeliveryDate: expectedDeliveryDate || null,
        status,
      }

      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/cows/${editingId}`
        : '/api/cows'

      
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

const response = await fetch(url, {
  method: isEditing ? 'PUT' : 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': csrfData.token,
  },
  credentials: 'same-origin',
  body: JSON.stringify(payload),
})


      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.message ||
            `Could not ${isEditing ? 'update' : 'register'} the cow.`
        )
      }

      setSuccess(
        isEditing
          ? `Cow ${trimmedCode} updated successfully.`
          : `Cow ${trimmedCode} registered successfully.`
      )

      resetForm()
      await loadCows()
    } catch (err) {
      setError(err.message || 'Unable to save cow details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="milk-page">
      <header className="milk-header">
        <div>
          <p className="milk-breadcrumb">Workspace / Livestock</p>
          <h1>Livestock</h1>
          <p className="milk-subtitle">
            Register cows and manage breeding records.
          </p>
        </div>

        <button
          className="milk-refresh"
          type="button"
          onClick={loadCows}
          disabled={loading || saving}
        >
          Refresh
        </button>
      </header>

      {error && (
        <div className="milk-message error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="milk-message success" role="status">
          {success}
        </div>
      )}

      <section className="milk-summary">
        <article className="milk-summary-card">
          <span>Total registered cows</span>
          <strong>{loading ? '...' : cows.length}</strong>
          <small>All livestock records</small>
        </article>

        <article className="milk-summary-card">
          <span>Active cows</span>
          <strong>{loading ? '...' : activeCount}</strong>
          <small>Currently active</small>
        </article>

        <article className="milk-summary-card">
          <span>Inactive cows</span>
          <strong>{loading ? '...' : inactiveCount}</strong>
          <small>Historical records preserved</small>
        </article>
      </section>

      <section className="milk-panel">
        <div className="milk-panel-heading">
          <div>
            <h2>{editingId !== null ? 'Edit cow' : 'Register a cow'}</h2>
            <p>
              {editingId !== null
                ? `Updating ${cowCode}. Change the fields and save.`
                : 'Breeding dates are optional and can be left blank.'}
            </p>
          </div>
        </div>

        <form className="milk-form" onSubmit={handleSubmit}>
          <div className="milk-field">
            <label htmlFor="cow-code">Cow code</label>
            <input
              id="cow-code"
              type="text"
              value={cowCode}
              onChange={(event) => setCowCode(event.target.value)}
              maxLength={30}
              required
            />
          </div>

          <div className="milk-field">
            <label htmlFor="cow-breed">Breed</label>
            <input
              id="cow-breed"
              type="text"
              value={breed}
              onChange={(event) => setBreed(event.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="milk-field">
            <label htmlFor="joining-date">Joining date</label>
            <input
              id="joining-date"
              type="date"
              value={joiningDate}
              onChange={(event) => setJoiningDate(event.target.value)}
              required
            />
          </div>

          <div className="milk-field">
            <label htmlFor="mating-date">Mating date (optional)</label>
            <input
              id="mating-date"
              type="date"
              value={matingDate}
              min={joiningDate || undefined}
              onChange={(event) =>
                handleMatingDateChange(event.target.value)
              }
            />
          </div>

          <div className="milk-field">
            <label htmlFor="expected-delivery-date">
              Expected delivery date
            </label>
            <input
              id="expected-delivery-date"
              type="date"
              value={expectedDeliveryDate}
              min={matingDate || undefined}
              disabled={!matingDate}
              onChange={(event) => {
                setExpectedDeliveryDate(event.target.value)
                setExpectedDateManuallyChanged(true)
              }}
            />
          </div>

          <div className="milk-field">
            <label htmlFor="cow-status">Status</label>
            <select
              id="cow-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              required
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {matingDate && (
            <p className="milk-form-note">
              {expectedDateManuallyChanged
                ? 'Expected date manually adjusted.'
                : 'Expected date is calculated using 283 days from the mating date. You can correct it manually.'}
            </p>
          )}

          <button
            className="milk-submit"
            type="submit"
            disabled={saving || loading}
          >
            {saving
              ? 'Saving...'
              : editingId !== null
                ? 'Save Changes'
                : 'Register Cow'}
          </button>

          {editingId !== null && (
            <button
              className="milk-refresh"
              type="button"
              onClick={() => {
                resetForm()
                setError('')
                setSuccess('')
              }}
              disabled={saving}
            >
              Cancel Editing
            </button>
          )}
        </form>
      </section>

      <section className="milk-panel">
        <div className="milk-panel-heading">
          <div>
            <h2>Registered livestock</h2>
            <p>Information retrieved from your database.</p>
          </div>
        </div>

        <div className="milk-table-wrap">
          <table className="milk-table">
            <thead>
              <tr>
                <th>Cow code</th>
                <th>Breed</th>
                <th>Joining date</th>
                <th>Mating date</th>
                <th>Expected delivery</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="milk-empty">
                    Loading livestock...
                  </td>
                </tr>
              ) : cows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="milk-empty">
                    No livestock records found. Register your first cow above.
                  </td>
                </tr>
              ) : (
                cows.map((cow) => (
                  <tr key={cow.id}>
                    <td>{cow.cowCode}</td>
                    <td>{cow.breed || '—'}</td>
                    <td>{cow.joiningDate || '—'}</td>
                    <td>{cow.matingDate || '—'}</td>
                    <td>{cow.expectedDeliveryDate || '—'}</td>
                    <td>
                      <span className="milk-session-badge">
                        {cow.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="milk-refresh"
                        type="button"
                        onClick={() => startEditing(cow)}
                        disabled={saving}
                      >
                        Edit
                      </button>
                    </td>
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

export default Livestock
