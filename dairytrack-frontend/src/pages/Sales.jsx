import { useEffect, useState } from 'react';
import './Sales.css';

function getToday() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
}

function getMonthStart() {
  const today = new Date();

  return `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, '0')}-01`;
}

const initialForm = {
  saleDate: getToday(),
  customerId: '',
  quantityLitres: '',
  pricePerLitre: '',
  notes: '',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '-';

  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

function formatStatus(status) {
  if (!status) return '-';

  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSaleTotal(sale) {
  return (
    Number(sale.quantityLitres || 0) *
    Number(sale.pricePerLitre || 0)
  );
}

async function readError(response) {
  try {
    const data = await response.json();
    return data.message || data.detail || data.error || 'Request failed.';
  } catch {
    return 'Request failed. Please try again.';
  }
}

// Get a fresh CSRF token before every write request.
async function getCsrfToken() {
  const response = await fetch('/api/auth/csrf', {
    method: 'GET',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error('Unable to obtain security token. Please try again.');
  }

  const data = await response.json();

  if (!data.token) {
    throw new Error('Security token is missing. Please refresh the page.');
  }

  return data.token;
}

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [paymentAmounts, setPaymentAmounts] = useState({});

  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getToday());

  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payingSaleId, setPayingSaleId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadSales() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sales');

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = await response.json();
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load sales.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    setCustomersLoading(true);

    try {
      const response = await fetch('/api/customers');

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        `Unable to load registered customers. ${
          err.message || 'Please retry.'
        }`
      );
    } finally {
      setCustomersLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
    loadCustomers();
  }, []);

  const filteredSales = sales
    .filter((sale) => {
      if (startDate && sale.saleDate < startDate) return false;
      if (endDate && sale.saleDate > endDate) return false;
      return true;
    })
    .sort((a, b) => {
      const dateComparison = (b.saleDate || '').localeCompare(
        a.saleDate || ''
      );

      if (dateComparison !== 0) return dateComparison;
      return Number(b.id || 0) - Number(a.id || 0);
    });

  const totalRevenue = filteredSales.reduce(
    (total, sale) => total + getSaleTotal(sale),
    0
  );

  const totalReceived = filteredSales.reduce(
    (total, sale) => total + Number(sale.amountPaid || 0),
    0
  );

  const totalOutstanding = filteredSales.reduce(
    (total, sale) =>
      total +
      Math.max(
        0,
        getSaleTotal(sale) - Number(sale.amountPaid || 0)
      ),
    0
  );

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

    if (
      !form.saleDate ||
      !form.customerId ||
      !form.quantityLitres ||
      !form.pricePerLitre
    ) {
      setError('Please complete the date, customer, quantity, and rate.');
      return;
    }

    if (
      !Number.isFinite(Number(form.quantityLitres)) ||
      Number(form.quantityLitres) <= 0
    ) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (
      !Number.isFinite(Number(form.pricePerLitre)) ||
      Number(form.pricePerLitre) <= 0
    ) {
      setError('Price per litre must be greater than zero.');
      return;
    }

    const selectedCustomer = customers.find(
      (customer) => String(customer.id) === String(form.customerId)
    );

    if (!selectedCustomer) {
      setError('Please select a valid registered customer.');
      return;
    }

    const payload = {
      saleDate: form.saleDate,
      customerId: Number(form.customerId),
      customerName: selectedCustomer.name,
      quantityLitres: Number(form.quantityLitres),
      pricePerLitre: Number(form.pricePerLitre),
      notes: form.notes.trim(),
    };

    setSaving(true);

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken,
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setForm({
        ...initialForm,
        saleDate: getToday(),
      });

      setSuccess('Sale recorded successfully for the selected customer.');
      await loadSales();
    } catch (err) {
      setError(err.message || 'Unable to record the sale.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePayment(sale) {
    setError('');
    setSuccess('');

    const amount = Number(paymentAmounts[sale.id]);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(`Enter a valid payment amount for sale #${sale.id}.`);
      return;
    }

    const outstanding =
      getSaleTotal(sale) - Number(sale.amountPaid || 0);

    if (amount > outstanding + 0.00001) {
      setError(
        `Payment exceeds the outstanding balance for sale #${sale.id}. Outstanding: ${formatCurrency(
          Math.max(0, outstanding)
        )}.`
      );
      return;
    }

    setPayingSaleId(sale.id);

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(`/api/sales/${sale.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setPaymentAmounts((previous) => ({
        ...previous,
        [sale.id]: '',
      }));

      setSuccess(`Payment recorded for sale #${sale.id}.`);
      await loadSales();
    } catch (err) {
      setError(err.message || 'Unable to record payment.');
    } finally {
      setPayingSaleId(null);
    }
  }

  async function handleRefresh() {
    setSuccess('');
    await Promise.all([loadSales(), loadCustomers()]);
  }

  return (
    <div className="sales-page">
      <div className="sales-header">
        <div>
          <h1>Sales &amp; Revenue</h1>
          <p>
            Manage milk sales, customer payments, and outstanding balances.
          </p>
        </div>

        <button
          type="button"
          className="sales-refresh"
          onClick={handleRefresh}
          disabled={loading || customersLoading}
        >
          {loading || customersLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="sales-message sales-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="sales-message sales-success" role="status">
          {success}
        </div>
      )}

      <div className="sales-summary">
        <div className="sales-summary-card">
          <span>Sales Revenue</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
          <small>{filteredSales.length} sales in selected period</small>
        </div>

        <div className="sales-summary-card">
          <span>Payments Received</span>
          <strong>{formatCurrency(totalReceived)}</strong>
          <small>Payments recorded for these sales</small>
        </div>

        <div className="sales-summary-card">
          <span>Outstanding Balance</span>
          <strong>{formatCurrency(totalOutstanding)}</strong>
          <small>Amount still due from customers</small>
        </div>
      </div>

      <section className="sales-panel">
        <div className="sales-section-heading">
          <div>
            <h2>Record New Sale</h2>
            <p>
              Select a registered customer and enter the milk quantity and
              selling rate.
            </p>
          </div>
        </div>

        <form className="sales-form" onSubmit={handleSubmit}>
          <div className="sales-form-grid">
            <label className="sales-field">
              <span>Sale Date *</span>
              <input
                type="date"
                name="saleDate"
                value={form.saleDate}
                onChange={handleChange}
                required
              />
            </label>

            <label className="sales-field">
              <span>Registered Customer *</span>
              <select
                name="customerId"
                value={form.customerId}
                onChange={handleChange}
                required
                disabled={customersLoading || customers.length === 0}
              >
                <option value="">
                  {customersLoading
                    ? 'Loading customers...'
                    : customers.length === 0
                      ? 'No registered customers'
                      : 'Select a customer'}
                </option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.phoneNumber
                      ? ` — ${customer.phoneNumber}`
                      : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="sales-field">
              <span>Quantity (litres) *</span>
              <input
                type="number"
                name="quantityLitres"
                value={form.quantityLitres}
                onChange={handleChange}
                min="0.001"
                step="0.001"
                placeholder="Enter litres"
                required
              />
            </label>

            <label className="sales-field">
              <span>Price per Litre (₹) *</span>
              <input
                type="number"
                name="pricePerLitre"
                value={form.pricePerLitre}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                placeholder="Enter rate"
                required
              />
            </label>

            <label className="sales-field sales-notes-field">
              <span>Notes</span>
              <input
                type="text"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                maxLength="500"
                placeholder="Optional notes"
              />
            </label>
          </div>

          <div className="sales-preview">
            <span>Sale Total</span>
            <strong>
              {formatCurrency(
                Number(form.quantityLitres || 0) *
                  Number(form.pricePerLitre || 0)
              )}
            </strong>
          </div>

          <div className="sales-form-footer">
            <p>* Required fields</p>
            <button
              type="submit"
              className="sales-submit"
              disabled={saving || customersLoading || customers.length === 0}
            >
              {saving ? 'Saving...' : 'Record Sale'}
            </button>
          </div>
        </form>
      </section>

      <section className="sales-panel">
        <div className="sales-section-heading">
          <div>
            <h2>Sales History</h2>
            <p>
              Review sales and record payments against outstanding balances.
            </p>
          </div>
        </div>

        <div className="sales-filters">
          <label className="sales-field">
            <span>From Date</span>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="sales-field">
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
            className="sales-clear-filter"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            Show All Dates
          </button>
        </div>

        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Sale Total</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Record Payment</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="sales-empty">
                    Loading sales...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="9" className="sales-empty">
                    No sales found for the selected dates.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const saleTotal = getSaleTotal(sale);
                  const paid = Number(sale.amountPaid || 0);
                  const outstanding = Math.max(0, saleTotal - paid);

                  return (
                    <tr key={sale.id}>
                      <td>{formatDate(sale.saleDate)}</td>

                      <td>
                        <strong>{sale.customerName}</strong>

                        {sale.notes && (
                          <small className="sales-notes">
                            {sale.notes}
                          </small>
                        )}

                        {sale.customerId != null && (
                          <small className="sales-notes">
                            Customer ID: {sale.customerId}
                          </small>
                        )}
                      </td>

                      <td>
                        {Number(sale.quantityLitres).toLocaleString('en-IN')} L
                      </td>

                      <td>{formatCurrency(sale.pricePerLitre)}</td>

                      <td className="sales-money">
                        {formatCurrency(saleTotal)}
                      </td>

                      <td>{formatCurrency(paid)}</td>

                      <td className="sales-outstanding">
                        {formatCurrency(outstanding)}
                      </td>

                      <td>
                        <span
                          className={`sales-status sales-status-${String(
                            sale.paymentStatus || 'PENDING'
                          ).toLowerCase()}`}
                        >
                          {formatStatus(sale.paymentStatus)}
                        </span>
                      </td>

                      <td>
                        {outstanding > 0 ? (
                          <div className="sales-payment-control">
                            <input
                              type="number"
                              min="0.01"
                              max={outstanding}
                              step="0.01"
                              aria-label={`Payment amount for sale ${sale.id}`}
                              placeholder="₹ Amount"
                              value={paymentAmounts[sale.id] ?? ''}
                              onChange={(event) =>
                                setPaymentAmounts((previous) => ({
                                  ...previous,
                                  [sale.id]: event.target.value,
                                }))
                              }
                            />

                            <button
                              type="button"
                              onClick={() => handlePayment(sale)}
                              disabled={payingSaleId === sale.id}
                            >
                              {payingSaleId === sale.id ? 'Saving...' : 'Pay'}
                            </button>
                          </div>
                        ) : (
                          <span className="sales-paid-label">Fully paid</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {!loading && filteredSales.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="4">Selected Period Total</td>
                  <td>{formatCurrency(totalRevenue)}</td>
                  <td>{formatCurrency(totalReceived)}</td>
                  <td>{formatCurrency(totalOutstanding)}</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}