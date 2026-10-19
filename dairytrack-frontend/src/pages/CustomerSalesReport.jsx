
import { useEffect, useState } from 'react';
import './Reports.css';
import './CustomerSalesReport.css';

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

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatNumber(value, maximumFractionDigits = 3) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits,
  }).format(Number(value) || 0);
}

async function readError(response) {
  try {
    const data = await response.json();
    return data.message || data.detail || data.error || 'Request failed.';
  } catch {
    return 'Request failed. Please try again.';
  }
}

export default function CustomerSalesReport() {
  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getToday());
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  async function loadReport(fromDate = startDate, toDate = endDate) {
    if (!fromDate || !toDate) {
      setError('Please select both a start date and an end date.');
      return;
    }

    if (fromDate > toDate) {
      setError('Start date cannot be after the end date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        startDate: fromDate,
        endDate: toDate,
      });

      const response = await fetch(
        `/api/sales/customer-summary?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setCustomers(await response.json());
    } catch (err) {
      setError(err.message || 'Unable to load the customer sales report.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomerHistory(customer) {
    setSelectedCustomer(customer);
    setHistory([]);
    setHistoryError('');
    setHistoryLoading(true);

    try {
      const response = await fetch(
        `/api/sales/customer/${customer.customerId}/history`
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setHistory(await response.json());
    } catch (err) {
      setHistoryError(err.message || 'Unable to load customer history.');
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    setSelectedCustomer(null);
    setHistory([]);
    setHistoryError('');
  }

  useEffect(() => {
    loadReport(getMonthStart(), getToday());
  }, []);

  const totals = customers.reduce(
    (result, customer) => ({
      sales: result.sales + Number(customer.totalSales || 0),
      litres: result.litres + Number(customer.totalLitres || 0),
      amount: result.amount + Number(customer.totalAmount || 0),
      paid: result.paid + Number(customer.totalPaid || 0),
      outstanding:
        result.outstanding + Number(customer.outstandingAmount || 0),
    }),
    { sales: 0, litres: 0, amount: 0, paid: 0, outstanding: 0 }
  );

  const historyTotals = history.reduce(
    (result, sale) => {
      const saleAmount =
        Number(sale.quantityLitres || 0) * Number(sale.pricePerLitre || 0);

      return {
        litres: result.litres + Number(sale.quantityLitres || 0),
        amount: result.amount + saleAmount,
        paid: result.paid + Number(sale.amountPaid || 0),
        outstanding:
          result.outstanding + Math.max(0, saleAmount - Number(sale.amountPaid || 0)),
      };
    },
    { litres: 0, amount: 0, paid: 0, outstanding: 0 }
  );

  return (
    <div className="reports-page customer-sales-report">
      <div className="reports-header">
        <div>
          <h1>Customer Sales &amp; Outstanding</h1>
          <p>
            Review customer purchases, payments received, and outstanding
            balances.
          </p>
        </div>

        <button
          type="button"
          className="reports-refresh"
          onClick={() => loadReport()}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Refresh Report'}
        </button>
      </div>

      <section className="reports-panel reports-filter-panel">
        <div className="reports-section-heading">
          <div>
            <h2>Report Period</h2>
            <p>Select the period you want to analyse.</p>
          </div>
        </div>

        <form
          className="reports-filters"
          onSubmit={(event) => {
            event.preventDefault();
            loadReport();
          }}
        >
          <label className="reports-field">
            <span>From Date</span>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>

          <label className="reports-field">
            <span>To Date</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            className="reports-generate"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </form>
      </section>

      {error && (
        <div className="reports-message reports-error" role="alert">
          {error}
        </div>
      )}

      <div className="reports-period-label">
        Report period: <strong>{startDate}</strong> to{' '}
        <strong>{endDate}</strong>
      </div>

      <section className="reports-summary customer-sales-summary">
        <div className="reports-summary-card">
          <span>Total Sales</span>
          <strong>{totals.sales}</strong>
          <small>Number of recorded sales</small>
        </div>

        <div className="reports-summary-card">
          <span>Total Sales Value</span>
          <strong>{formatCurrency(totals.amount)}</strong>
          <small>Full value of recorded sales</small>
        </div>

        <div className="reports-summary-card reports-positive">
          <span>Payments Received</span>
          <strong>{formatCurrency(totals.paid)}</strong>
          <small>Payments recorded against sales</small>
        </div>

        <div
          className={`reports-summary-card ${
            totals.outstanding > 0 ? 'reports-negative' : 'reports-positive'
          }`}
        >
          <span>Outstanding Balance</span>
          <strong>{formatCurrency(totals.outstanding)}</strong>
          <small>Remaining amount owed</small>
        </div>
      </section>

      <section className="reports-panel">
        <div className="reports-section-heading">
          <div>
            <h2>Customer-wise Sales</h2>
            <p>
              Select a registered customer to view their individual sales
              records and payment status.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="reports-loading">Generating customer sales report...</div>
        ) : customers.length === 0 && !error ? (
          <div className="reports-loading">No sales found for the selected period.</div>
        ) : (
          <div className="customer-sales-table-wrapper">
            <table className="customer-sales-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Sales</th>
                  <th>Litres</th>
                  <th>Sales Value</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                  <th>History</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer, index) => (
                  <tr
                    key={`${customer.customerId ?? 'legacy'}-${customer.customerName}-${index}`}
                  >
                    <td>
                      <strong className="customer-sales-name">
                        {customer.customerName}
                      </strong>
                      {customer.customerId == null && (
                        <small className="customer-sales-legacy">
                          Legacy sale — no customer ID
                        </small>
                      )}
                    </td>
                    <td>{customer.totalSales}</td>
                    <td>{formatNumber(customer.totalLitres)}</td>
                    <td>{formatCurrency(customer.totalAmount)}</td>
                    <td>{formatCurrency(customer.totalPaid)}</td>
                    <td
                      className={
                        Number(customer.outstandingAmount) > 0
                          ? 'customer-sales-due'
                          : 'customer-sales-settled'
                      }
                    >
                      {formatCurrency(customer.outstandingAmount)}
                    </td>
                    <td>
                      {customer.customerId != null ? (
                        <button
                          type="button"
                          className="reports-generate customer-history-button"
                          onClick={() => loadCustomerHistory(customer)}
                        >
                          View History
                        </button>
                      ) : (
                        <span>Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              {customers.length > 0 && (
                <tfoot>
                  <tr>
                    <th>Total</th>
                    <th>{totals.sales}</th>
                    <th>{formatNumber(totals.litres)}</th>
                    <th>{formatCurrency(totals.amount)}</th>
                    <th>{formatCurrency(totals.paid)}</th>
                    <th>{formatCurrency(totals.outstanding)}</th>
                    <th></th>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </section>

      {selectedCustomer && (
        <section className="reports-panel customer-history-panel">
          <div className="reports-section-heading customer-history-heading">
            <div>
              <h2>Sales History: {selectedCustomer.customerName}</h2>
              <p>Customer ID: {selectedCustomer.customerId}</p>
            </div>

            <button
              type="button"
              className="reports-refresh"
              onClick={closeHistory}
            >
              Close History
            </button>
          </div>

          {historyLoading ? (
            <div className="reports-loading">Loading customer history...</div>
          ) : historyError ? (
            <div className="reports-message reports-error" role="alert">
              {historyError}
            </div>
          ) : history.length === 0 ? (
            <div className="reports-loading">
              No sales history found for this customer.
            </div>
          ) : (
            <>
              <div className="reports-metrics-grid">
                <div className="reports-metric">
                  <span>Total Litres</span>
                  <strong>{formatNumber(historyTotals.litres)} L</strong>
                </div>
                <div className="reports-metric">
                  <span>Total Sales</span>
                  <strong>{formatCurrency(historyTotals.amount)}</strong>
                </div>
                <div className="reports-metric">
                  <span>Total Paid</span>
                  <strong>{formatCurrency(historyTotals.paid)}</strong>
                </div>
                <div className="reports-metric">
                  <span>Outstanding</span>
                  <strong>{formatCurrency(historyTotals.outstanding)}</strong>
                </div>
              </div>

              <div className="customer-sales-table-wrapper">
                <table className="customer-sales-table">
                  <thead>
                    <tr>
                      <th>Sale Date</th>
                      <th>Litres</th>
                      <th>Price / Litre</th>
                      <th>Sale Amount</th>
                      <th>Paid</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((sale) => {
                      const amount =
                        Number(sale.quantityLitres || 0) *
                        Number(sale.pricePerLitre || 0);
                      const outstanding = Math.max(
                        0,
                        amount - Number(sale.amountPaid || 0)
                      );

                      return (
                        <tr key={sale.id}>
                          <td>{sale.saleDate}</td>
                          <td>{formatNumber(sale.quantityLitres)}</td>
                          <td>{formatCurrency(sale.pricePerLitre)}</td>
                          <td>{formatCurrency(amount)}</td>
                          <td>{formatCurrency(sale.amountPaid)}</td>
                          <td
                            className={
                              outstanding > 0
                                ? 'customer-sales-due'
                                : 'customer-sales-settled'
                            }
                          >
                            {formatCurrency(outstanding)}
                          </td>
                          <td>
                            <span
                              className={`customer-payment-status customer-status-${String(
                                sale.paymentStatus || 'pending'
                              ).toLowerCase()}`}
                            >
                              {String(sale.paymentStatus || 'PENDING').replace(
                                '_',
                                ' '
                              )}
                            </span>
                          </td>
                          <td>{sale.notes || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      <div className="reports-disclaimer">
        <strong>Important:</strong> This report includes sales recorded within
        the selected date range. Older sales without a registered customer ID
        remain in the summary but do not have a registered customer's history
        view.
      </div>
    </div>
  );
}
