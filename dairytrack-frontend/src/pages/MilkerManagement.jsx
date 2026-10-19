import { useCallback, useEffect, useState } from 'react';
import './MilkerManagement.css';

const API = '/api/milkers';

const today = new Date();
const localDate = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0'),
].join('-');

const firstDayOfMonth = `${localDate.slice(0, 7)}-01`;

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

// Shared request helper with CSRF protection for write operations.
async function request(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();

  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfResponse = await fetch('/api/auth/csrf', {
      method: 'GET',
      credentials: 'same-origin',
    });

    if (!csrfResponse.ok) {
      throw new Error(
        'Unable to obtain security token. Please refresh the page and try again.'
      );
    }

    const csrfData = await csrfResponse.json();

    if (!csrfData.token) {
      throw new Error(
        'Security token is missing. Please refresh the page and try again.'
      );
    }

    headers['X-XSRF-TOKEN'] = csrfData.token;
  }

  const response = await fetch(url, {
    ...options,
    method,
    credentials: 'same-origin',
    headers,
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        (typeof data === 'string' ? data : null) ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

function MilkerManagement() {
  const [milkers, setMilkers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(localDate);
  const [attendanceDate, setAttendanceDate] = useState(localDate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [paymentRecord, setPaymentRecord] = useState(null);

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phoneNumber: '',
    morningRate: '300',
    eveningRate: '300',
  });

  const [attendanceForm, setAttendanceForm] = useState({
    session: 'MORNING',
    status: 'PRESENT',
    notes: '',
  });

  const selectedMilker = milkers.find(
    (milker) => String(milker.id) === String(selectedId)
  );

  const loadMilkers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await request(API);
      const list = Array.isArray(data) ? data : [];

      setMilkers(list);

      setSelectedId((previous) => {
        if (list.some((milker) => String(milker.id) === String(previous))) {
          return previous;
        }

        return list.length ? String(list[0].id) : '';
      });
    } catch (err) {
      setError(err.message || 'Could not load milkers.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    if (!selectedId) {
      setAttendance([]);
      setPayments([]);
      return;
    }

    setError('');

    try {
      const query = `startDate=${encodeURIComponent(
        startDate
      )}&endDate=${encodeURIComponent(endDate)}`;

      const [attendanceData, paymentData] = await Promise.all([
        request(`${API}/${selectedId}/attendance?${query}`),
        request(`${API}/${selectedId}/salary-payments?${query}`),
      ]);

      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
    } catch (err) {
      setError(err.message || 'Could not load attendance and payments.');
    }
  }, [selectedId, startDate, endDate]);

  useEffect(() => {
    loadMilkers();
  }, [loadMilkers]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  function resetProfileForm() {
    setProfileForm({
      fullName: '',
      phoneNumber: '',
      morningRate: '300',
      eveningRate: '300',
    });

    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(milker) {
    setProfileForm({
      fullName: milker.fullName || '',
      phoneNumber: milker.phoneNumber || '',
      morningRate: String(milker.morningRate ?? 300),
      eveningRate: String(milker.eveningRate ?? 300),
    });

    setEditingId(milker.id);
    setShowForm(true);
    setMessage('');
    setError('');
  }

  // Create or update a milker profile.
  async function saveProfile(event) {
    event.preventDefault();

    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      fullName: profileForm.fullName.trim(),
      phoneNumber: profileForm.phoneNumber.trim(),
      morningRate: Number(profileForm.morningRate),
      eveningRate: Number(profileForm.eveningRate),
    };

    try {
      const saved = await request(
        editingId ? `${API}/${editingId}` : API,
        {
          method: editingId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      await loadMilkers();
      setSelectedId(String(saved.id));

      setMessage(
        editingId ? 'Milker profile updated.' : 'Milker added.'
      );

      resetProfileForm();
    } catch (err) {
      setError(err.message || 'Could not save milker profile.');
    } finally {
      setSaving(false);
    }
  }

  // Record morning or evening attendance.
  async function saveAttendance(event) {
    event.preventDefault();

    if (!selectedId) {
      setError('Select a milker first.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await request(`${API}/${selectedId}/attendance`, {
        method: 'POST',
        body: JSON.stringify({
          attendanceDate,
          session: attendanceForm.session,
          status: attendanceForm.status,
          notes: attendanceForm.notes.trim(),
        }),
      });

      setAttendanceForm({
        session: 'MORNING',
        status: 'PRESENT',
        notes: '',
      });

      setMessage('Attendance recorded successfully.');
      await loadRecords();
    } catch (err) {
      setError(err.message || 'Could not record attendance.');
    } finally {
      setSaving(false);
    }
  }

  function paySalary(record) {
  if (record.status !== 'PRESENT') {
    setError('Salary can only be paid for present attendance.');
    return;
  }

  const alreadyPaid = payments.some(
    (payment) => payment.attendance?.id === record.id
  );

  if (alreadyPaid) {
    setError('This session has already been paid.');
    return;
  }

  setError('');
  setMessage('');
  setPaymentRecord(record);
}

async function confirmSalaryPayment() {
  if (!paymentRecord || saving) {
    return;
  }

  const record = paymentRecord;

  setSaving(true);
  setError('');
  setMessage('');

  try {
    await request(
      `${API}/${selectedId}/attendance/${record.id}/pay?paymentDate=${encodeURIComponent(
        record.attendanceDate
      )}`,
      { method: 'POST' }
    );

    setPaymentRecord(null);

    setMessage(
      `Salary paid: ${money(record.salaryEarned)}. A labour expense was recorded.`
    );

    await Promise.all([loadRecords(), loadMilkers()]);
  } catch (err) {
    setError(err.message || 'Could not pay salary.');
  } finally {
    setSaving(false);
  }
}

  const totalEarned = attendance.reduce(
    (sum, record) => sum + Number(record.salaryEarned || 0),
    0
  );

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const paidAttendanceIds = new Set(
    payments.map((payment) => payment.attendance?.id)
  );

  const presentSessions = attendance.filter(
    (record) => record.status === 'PRESENT'
  ).length;

  const absentSessions = attendance.filter(
    (record) => record.status === 'ABSENT'
  ).length;

  return (
    <div className="milker-page">
      <header className="milker-header">
        <div>
          <div className="milker-eyebrow">DAILY OPERATIONS</div>
          <h1>Milker Management</h1>
          <p>Manage profiles, session attendance and daily salary payments.</p>
        </div>

        <button
          type="button"
          className="milker-primary-button"
          onClick={() => {
            setError('');
            setMessage('');
            setEditingId(null);

            setProfileForm({
              fullName: '',
              phoneNumber: '',
              morningRate: '300',
              eveningRate: '300',
            });

            setShowForm((value) => !value);
          }}
        >
          {showForm && !editingId ? 'Close form' : '+ Add milker'}
        </button>
      </header>

      {error && (
        <div className="milker-alert milker-alert-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="milker-alert milker-alert-success" role="status">
          {message}
        </div>
      )}
      {paymentRecord && (
  <div
    className="salary-modal-overlay"
    onMouseDown={(event) => {
      if (
        event.target === event.currentTarget &&
        !saving
      ) {
        setPaymentRecord(null);
      }
    }}
  >
    <section
      className="salary-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="salary-modal-title"
    >
      <div className="salary-modal-header">
        <div className="salary-modal-icon">₹</div>

        <button
          type="button"
          className="salary-modal-close"
          aria-label="Close payment confirmation"
          disabled={saving}
          onClick={() => setPaymentRecord(null)}
        >
          ×
        </button>
      </div>

      <h2 id="salary-modal-title">Confirm Salary Payment</h2>

      <p className="salary-modal-description">
        Confirm that you have paid this milker outside the application.
      </p>

      <div className="salary-modal-details">
        <div>
          <span>Milker</span>
          <strong>{selectedMilker?.fullName || '—'}</strong>
        </div>

        <div>
          <span>Attendance date</span>
          <strong>{paymentRecord.attendanceDate}</strong>
        </div>

        <div>
          <span>Session</span>
          <strong>
            {paymentRecord.session === 'MORNING'
              ? 'Morning'
              : 'Evening'}
          </strong>
        </div>

        <div>
          <span>Attendance</span>
          <strong className="salary-modal-present">Present</strong>
        </div>
      </div>

      <div className="salary-modal-amount">
        <span>Salary amount</span>
        <strong>{money(paymentRecord.salaryEarned)}</strong>
      </div>

      <p className="salary-modal-note">
        Confirming records the salary payment and its corresponding labour
        expense. No money is transferred by this action.
      </p>

      <div className="salary-modal-actions">
        <button
          type="button"
          className="milker-secondary-button"
          disabled={saving}
          onClick={() => setPaymentRecord(null)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="milker-primary-button"
          disabled={saving}
          onClick={confirmSalaryPayment}
        >
          {saving ? 'Processing...' : 'Confirm Payment'}
        </button>
      </div>
    </section>
  </div>
)}
      {showForm && (
        <section className="milker-panel">
          <div className="milker-section-heading">
            <div>
              <h2>{editingId ? 'Edit milker profile' : 'Add a milker'}</h2>
              <p>Rates apply to new attendance records.</p>
            </div>
          </div>

          <form className="milker-form" onSubmit={saveProfile}>
            <label>
              Full name *
              <input
                required
                maxLength={120}
                value={profileForm.fullName}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    fullName: event.target.value,
                  })
                }
                placeholder="Enter full name"
              />
            </label>

            <label>
              Phone number
              <input
                value={profileForm.phoneNumber}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    phoneNumber: event.target.value,
                  })
                }
                placeholder="Optional"
              />
            </label>

            <label>
              Morning rate (₹) *
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={profileForm.morningRate}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    morningRate: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Evening rate (₹) *
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={profileForm.eveningRate}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    eveningRate: event.target.value,
                  })
                }
              />
            </label>

            <div className="milker-form-actions">
              <button
                className="milker-primary-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save changes'
                    : 'Create milker'}
              </button>

              <button
                className="milker-secondary-button"
                type="button"
                onClick={resetProfileForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="milker-panel">
        <div className="milker-section-heading">
          <div>
            <h2>Milker profiles</h2>
            <p>{milkers.length} registered milker(s)</p>
          </div>

          <button
            type="button"
            className="milker-secondary-button"
            onClick={loadMilkers}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="milker-muted">Loading milker profiles...</p>
        ) : milkers.length === 0 ? (
          <p className="milker-empty">
            No milkers registered yet. Add your first milker to begin.
          </p>
        ) : (
          <div className="milker-profile-grid">
            {milkers.map((milker) => (
              <article
                key={milker.id}
                className={`milker-profile-card ${
                  String(milker.id) === String(selectedId)
                    ? 'milker-profile-selected'
                    : ''
                }`}
              >
                <div className="milker-profile-top">
                  <div className="milker-avatar">
                    {(milker.fullName || 'M').charAt(0).toUpperCase()}
                  </div>

                  <span
                    className={
                      milker.active
                        ? 'milker-status-active'
                        : 'milker-status-inactive'
                    }
                  >
                    {milker.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3>{milker.fullName}</h3>

                <p className="milker-phone">
                  {milker.phoneNumber || 'No phone number'}
                </p>

                <div className="milker-rate-row">
                  <span>Morning</span>
                  <strong>{money(milker.morningRate)}</strong>
                </div>

                <div className="milker-rate-row">
                  <span>Evening</span>
                  <strong>{money(milker.eveningRate)}</strong>
                </div>

                <div className="milker-card-actions">
                  <button
                    type="button"
                    className="milker-secondary-button"
                    onClick={() => {
                      setSelectedId(String(milker.id));
                      setMessage('');
                      setError('');
                    }}
                  >
                    {String(milker.id) === String(selectedId)
                      ? 'Selected'
                      : 'View records'}
                  </button>

                  <button
                    type="button"
                    className="milker-text-button"
                    onClick={() => startEdit(milker)}
                  >
                    Edit profile
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedMilker && (
        <>
          <section className="milker-panel">
            <div className="milker-section-heading">
              <div>
                <h2>Attendance & salary</h2>
                <p>
                  Selected milker: <strong>{selectedMilker.fullName}</strong>
                </p>
              </div>
            </div>

            <form className="milker-form" onSubmit={saveAttendance}>
              <label>
                Attendance date *
                <input
                  type="date"
                  required
                  max={localDate}
                  value={attendanceDate}
                  onChange={(event) => setAttendanceDate(event.target.value)}
                />
              </label>

              <label>
                Session *
                <select
                  value={attendanceForm.session}
                  onChange={(event) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      session: event.target.value,
                    })
                  }
                >
                  <option value="MORNING">Morning</option>
                  <option value="EVENING">Evening</option>
                </select>
              </label>

              <label>
                Attendance status *
                <select
                  value={attendanceForm.status}
                  onChange={(event) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      status: event.target.value,
                    })
                  }
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </label>

              <label>
                Notes
                <input
                  maxLength={500}
                  value={attendanceForm.notes}
                  onChange={(event) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      notes: event.target.value,
                    })
                  }
                  placeholder="Optional note"
                />
              </label>

              <div className="milker-form-actions">
                <button
                  type="submit"
                  className="milker-primary-button"
                  disabled={saving || !selectedMilker.active}
                >
                  {saving ? 'Saving...' : 'Record attendance'}
                </button>
              </div>
            </form>

            {!selectedMilker.active && (
              <p className="milker-muted">
                This milker is inactive. Attendance cannot be added from this
                form.
              </p>
            )}
          </section>

          <section className="milker-panel">
            <div className="milker-section-heading">
              <div>
                <h2>Attendance history</h2>
                <p>Record attendance and pay each present session separately.</p>
              </div>
            </div>

            <div className="milker-filters">
              <label>
                From
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>

              <label>
                To
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={localDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>

              <button
                type="button"
                className="milker-secondary-button"
                onClick={loadRecords}
                disabled={saving}
              >
                Refresh records
              </button>
            </div>

            <div className="milker-summary-grid">
              <article>
                <span>Present sessions</span>
                <strong>{presentSessions}</strong>
              </article>

              <article>
                <span>Absent sessions</span>
                <strong>{absentSessions}</strong>
              </article>

              <article>
                <span>Salary earned</span>
                <strong>{money(totalEarned)}</strong>
              </article>

              <article>
                <span>Salary paid</span>
                <strong>{money(totalPaid)}</strong>
              </article>
            </div>

            <div className="milker-table-wrapper">
              <table className="milker-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Session</th>
                    <th>Status</th>
                    <th>Salary earned</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {attendance.map((record) => {
                    const paid = paidAttendanceIds.has(record.id);

                    return (
                      <tr key={record.id}>
                        <td>{record.attendanceDate}</td>
                        <td>{record.session}</td>

                        <td>
                          <span
                            className={
                              record.status === 'PRESENT'
                                ? 'milker-status-active'
                                : 'milker-status-inactive'
                            }
                          >
                            {record.status}
                          </span>
                        </td>

                        <td>{money(record.salaryEarned)}</td>

                        <td>
                          <span
                            className={
                              paid ? 'milker-status-active' : 'milker-muted'
                            }
                          >
                            {paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>

                        <td>
                          {record.status === 'PRESENT' && !paid ? (
                            <button
                              type="button"
                              className="milker-pay-button"
                              disabled={saving}
                              onClick={() => paySalary(record)}
                            >
                              Pay {money(record.salaryEarned)}
                            </button>
                          ) : paid ? (
                            <span className="milker-muted">
                              Payment complete
                            </span>
                          ) : (
                            <span className="milker-muted">
                              No salary due
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan="6" className="milker-empty-cell">
                        No attendance records found for this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="milker-panel">
            <div className="milker-section-heading">
              <div>
                <h2>Salary payment history</h2>
                <p>Confirmed payments for the selected date range.</p>
              </div>
            </div>

            <div className="milker-table-wrapper">
              <table className="milker-table">
                <thead>
                  <tr>
                    <th>Payment date</th>
                    <th>Attendance date</th>
                    <th>Session</th>
                    <th>Amount</th>
                    <th>Expense ID</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.paymentDate}</td>
                      <td>{payment.attendance?.attendanceDate || '—'}</td>
                      <td>{payment.attendance?.session || '—'}</td>
                      <td>{money(payment.amount)}</td>
                      <td>{payment.expenseId ?? '—'}</td>
                    </tr>
                  ))}

                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="5" className="milker-empty-cell">
                        No salary payments found for this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default MilkerManagement;