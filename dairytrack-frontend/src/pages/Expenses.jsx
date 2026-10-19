
import { useEffect, useState } from 'react';
import './Expenses.css';

const categories = [
  'FEED',
  'VETERINARY',
  'LABOUR',
  'ELECTRICITY',
  'TRANSPORT',
  'MAINTENANCE',
  'OTHER',
];

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonthStart() {
  const today = new Date();
  return `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, '0')}-01`;
}

const initialForm = {
  expenseDate: getToday(),
  category: 'FEED',
  description: '',
  amount: '',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '-';

  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

function formatCategory(value) {
  if (!value) return '-';

  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function readError(response) {
  try {
    const data = await response.json();
    return data.message || data.detail || data.error || 'Request failed.';
  } catch {
    return 'Request failed. Please try again.';
  }
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getToday());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadExpenses() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/expenses');

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = await response.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load expenses.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  const filteredExpenses = expenses
    .filter((expense) => {
      if (startDate && expense.expenseDate < startDate) return false;
      if (endDate && expense.expenseDate > endDate) return false;
      return true;
    })
    .sort((a, b) => {
      const dateComparison = (b.expenseDate || '').localeCompare(
        a.expenseDate || ''
      );

      if (dateComparison !== 0) return dateComparison;
      return Number(b.id || 0) - Number(a.id || 0);
    });

  const totalExpenses = filteredExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const today = getToday();

  const todayExpenses = expenses
    .filter((expense) => expense.expenseDate === today)
    .reduce((total, expense) => total + Number(expense.amount || 0), 0);

  const categoryTotals = filteredExpenses.reduce((totals, expense) => {
    const category = expense.category || 'OTHER';
    totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
    return totals;
  }, {});

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!form.expenseDate || !form.description.trim() || !form.amount) {
      setError('Please fill in the date, description, and amount.');
      return;
    }

    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    const payload = {
      expenseDate: form.expenseDate,
      category: form.category,
      description: form.description.trim(),
      amount: Number(form.amount),
    };

    setSaving(true);

    try {
      const csrfResponse = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!csrfResponse.ok) {
        throw new Error('Unable to obtain security token. Please try again.');
      }

      const csrfData = await csrfResponse.json();

      if (!csrfData.token) {
        throw new Error('Security token is missing. Please refresh the page.');
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfData.token,
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setForm({
        ...initialForm,
        expenseDate: getToday(),
      });

      setSuccess('Expense recorded successfully.');
      await loadExpenses();
    } catch (err) {
      setError(err.message || 'Unable to record the expense.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRefresh() {
    setSuccess('');
    await loadExpenses();
  }

  return (
    <div className="expenses-page">
      <div className="expenses-header">
        <div>
          <h1>Expenses Management</h1>
          <p>Record, filter, and review your dairy farm expenses.</p>
        </div>

        <button
          type="button"
          className="expenses-refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="expenses-message expenses-error">{error}</div>}
      {success && (
        <div className="expenses-message expenses-success">{success}</div>
      )}

      <div className="expenses-summary">
        <div className="expenses-summary-card">
          <span>Expenses in Selected Period</span>
          <strong>{formatCurrency(totalExpenses)}</strong>
          <small>{filteredExpenses.length} recorded expenses</small>
        </div>

        <div className="expenses-summary-card">
          <span>Today's Expenses</span>
          <strong>{formatCurrency(todayExpenses)}</strong>
          <small>{formatDate(today)}</small>
        </div>

        <div className="expenses-summary-card">
          <span>Expense Categories Used</span>
          <strong>{Object.keys(categoryTotals).length}</strong>
          <small>In the selected period</small>
        </div>
      </div>

      <section className="expenses-panel">
        <div className="expenses-section-heading">
          <div>
            <h2>Record New Expense</h2>
            <p>Enter the details of a farm expense.</p>
          </div>
        </div>

        <form className="expenses-form" onSubmit={handleSubmit}>
          <div className="expenses-form-grid">
            <label className="expenses-field">
              <span>Expense Date *</span>
              <input
                type="date"
                name="expenseDate"
                value={form.expenseDate}
                onChange={handleChange}
                required
              />
            </label>

            <label className="expenses-field">
              <span>Category *</span>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {formatCategory(category)}
                  </option>
                ))}
              </select>
            </label>

            <label className="expenses-field">
              <span>Amount (₹) *</span>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                placeholder="Enter amount"
                required
              />
            </label>

            <label className="expenses-field expenses-description-field">
              <span>Description *</span>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength="250"
                placeholder="e.g. Veterinary checkup"
                required
              />
            </label>
          </div>

          <div className="expenses-form-footer">
            <p>* Required fields</p>
            <button
              type="submit"
              className="expenses-submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </section>

      <section className="expenses-panel">
        <div className="expenses-section-heading">
          <div>
            <h2>Expense History</h2>
            <p>Filter records by date to review spending.</p>
          </div>
        </div>

        <div className="expenses-filters">
          <label className="expenses-field">
            <span>From Date</span>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="expenses-field">
            <span>To Date</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="expenses-clear-filter"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            Show All Dates
          </button>
        </div>

        <div className="expenses-table-wrap">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="expenses-empty">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="expenses-empty">
                    No expenses found for the selected dates.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{formatDate(expense.expenseDate)}</td>
                    <td>
                      <span className="expenses-category">
                        {formatCategory(expense.category)}
                      </span>
                    </td>
                    <td>{expense.description}</td>
                    <td className="expenses-amount">
                      {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {!loading && filteredExpenses.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="3">Selected Period Total</td>
                  <td>{formatCurrency(totalExpenses)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <section className="expenses-panel">
        <div className="expenses-section-heading">
          <div>
            <h2>Spending by Category</h2>
            <p>Breakdown for the selected date range.</p>
          </div>
        </div>

        {Object.keys(categoryTotals).length === 0 ? (
          <p className="expenses-no-categories">
            No category totals to display for this period.
          </p>
        ) : (
          <div className="expenses-category-list">
            {Object.entries(categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => (
                <div className="expenses-category-row" key={category}>
                  <span>{formatCategory(category)}</span>
                  <div className="expenses-category-track">
                    <div
                      className="expenses-category-bar"
                      style={{
                        width: `${Math.min(
                          (amount / Math.max(...Object.values(categoryTotals))) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <strong>{formatCurrency(amount)}</strong>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
