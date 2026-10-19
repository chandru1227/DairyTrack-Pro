
import { useEffect, useState } from 'react';
import './Reports.css';

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

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
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

export default function Reports() {
  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getToday());

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        `/api/reports/profitability?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err.message || 'Unable to load the profitability report.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(getMonthStart(), getToday());
  }, []);

  const profit = Number(report?.estimatedProfit || 0);
  const isProfit = profit >= 0;

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Reports &amp; Analytics</h1>
          <p>
            Review dairy farm performance using your recorded business data.
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

      {error && <div className="reports-message reports-error">{error}</div>}

      {loading && !report ? (
        <section className="reports-panel reports-loading">
          Generating your profitability report...
        </section>
      ) : report ? (
        <>
          <div className="reports-period-label">
            Report period: <strong>{report.startDate}</strong> to{' '}
            <strong>{report.endDate}</strong>
          </div>

          <div className="reports-summary">
            <div className="reports-summary-card">
              <span>Total Revenue</span>
              <strong>{formatCurrency(report.totalRevenue)}</strong>
              <small>Value of recorded sales</small>
            </div>

            <div className="reports-summary-card">
              <span>Total Expenses</span>
              <strong>{formatCurrency(report.totalExpenses)}</strong>
              <small>Recorded business expenses</small>
            </div>

            <div
              className={`reports-summary-card ${
                isProfit ? 'reports-positive' : 'reports-negative'
              }`}
            >
              <span>Estimated {isProfit ? 'Profit' : 'Loss'}</span>
              <strong>{formatCurrency(report.estimatedProfit)}</strong>
              <small>Revenue minus recorded expenses</small>
            </div>
          </div>

          <section className="reports-panel">
            <div className="reports-section-heading">
              <div>
                <h2>Milk Production &amp; Sales</h2>
                <p>Milk volume recorded during the selected period.</p>
              </div>
            </div>

            <div className="reports-metrics-grid">
              <div className="reports-metric">
                <span>Milk Produced</span>
                <strong>
                  {formatNumber(report.totalLitresProduced, 3)} L
                </strong>
              </div>

              <div className="reports-metric">
                <span>Milk Sold</span>
                <strong>{formatNumber(report.totalLitresSold, 3)} L</strong>
              </div>

              <div className="reports-metric">
                <span>Revenue per Litre Sold</span>
                <strong>
                  {formatCurrency(report.revenuePerLitreSold)}
                </strong>
              </div>

              <div className="reports-metric">
                <span>Expense per Litre Produced</span>
                <strong>
                  {formatCurrency(report.expensePerLitreProduced)}
                </strong>
              </div>
            </div>
          </section>

          <section className="reports-panel">
            <div className="reports-section-heading">
              <div>
                <h2>Profitability Analysis</h2>
                <p>Key financial indicators calculated by the backend.</p>
              </div>
            </div>

            <div className="reports-margin">
              <div className="reports-margin-heading">
                <span>Profit Margin</span>
                <strong>
                  {formatNumber(report.profitMarginPercentage)}%
                </strong>
              </div>

              <div className="reports-margin-track">
                <div
                  className={`reports-margin-bar ${
                    Number(report.profitMarginPercentage) < 0
                      ? 'reports-margin-negative'
                      : ''
                  }`}
                  style={{
                    width: `${Math.min(
                      Math.abs(Number(report.profitMarginPercentage) || 0),
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="reports-explanation">
                Profit margin is based on estimated profit divided by recorded
                revenue. A negative percentage means recorded expenses exceed
                recorded revenue for this period.
              </p>
            </div>
          </section>

          <div className="reports-disclaimer">
            <strong>Important:</strong> This is an estimated profitability
            report based on the records currently entered in DairyTrack. It
            does not automatically include unrecorded costs, inventory
            valuation adjustments, or other accounting entries. Revenue
            represents the full value of recorded sales, not just payments
            received.
          </div>
        </>
      ) : (
        !loading && (
          <section className="reports-panel reports-loading">
            Select a date range and generate a report.
          </section>
        )
      )}
    </div>
  );
}
