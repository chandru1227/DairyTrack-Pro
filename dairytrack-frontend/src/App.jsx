import { useEffect, useState } from 'react';
import './App.css';
import CustomerSalesReport from './pages/CustomerSalesReport';
import Expenses from './pages/Expenses';
import Livestock from './pages/Livestock';
import MilkProduction from './pages/MilkProduction';
import BreedingOverview from './pages/BreedingOverview';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Customers from './pages/Customers';
import MilkerManagement from './pages/MilkerManagement';
import Login from './pages/Login';
function App() {
    const [user, setUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(
    window.location.hash.slice(1) || 'dashboard'
  );

    useEffect(() => {
      let cancelled = false;

      async function checkSession() {
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'same-origin',
          });

          if (response.ok) {
            const data = await response.json();

            if (!cancelled) {
              setUser(data);
            }
          }
        } catch {
          // The user will be asked to log in.
        } finally {
          if (!cancelled) {
            setAuthChecked(true);
          }
        }
      }

      checkSession();

      return () => {
        cancelled = true;
      };
    }, []);
const handleLogin = (loggedInUser) => {
  setUser(loggedInUser);
  setAuthChecked(true);
};

const handleLogout = async () => {
  try {
    const csrfResponse = await fetch('/api/auth/csrf', {
      method: 'GET',
      credentials: 'same-origin',
    });

    if (!csrfResponse.ok) {
      throw new Error('Unable to obtain CSRF token for logout.');
    }

    const csrfData = await csrfResponse.json();

    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'X-XSRF-TOKEN': csrfData.token,
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Logout failed: ${response.status}`);
    }
  } catch (err) {
    console.error('Logout request failed:', err);
  } finally {
    setUser(null);
    setSummary(null);
    setCurrentPage('dashboard');
    window.location.hash = '';
  }
};

  async function loadDashboardSummary() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/dashboard/summary');

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data);
    } catch {
      setError(
        'Could not load dashboard data. Check that the backend is running on port 8081.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authChecked && user?.role === 'OWNER') {
      loadDashboardSummary();
    }
  }, [authChecked, user]);

  useEffect(() => {
    function handleHashChange() {
      const page = window.location.hash.slice(1) || 'dashboard';

      const validPages = [
        'dashboard',
        'livestock',
        'breeding',
        'milk',
        'inventory',
        'expenses',
        'sales',
        'customers',
        'customer-sales-report',
        'reports',
        'milkers',
      ];

      setCurrentPage(validPages.includes(page) ? page : 'dashboard');
    }

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);

    if (window.location.hash !== `#${page}`) {
      window.location.hash = page;
    }
  };
if (!authChecked) {
  return <div style={{ padding: '24px' }}>Checking login session...</div>;
}

if (!user) {
  return <Login onLogin={handleLogin} />;
}

if (user.role === 'MILKER') {
  return (
    <div className="app">
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace / Milk Production</div>
            <h1>Milker Dashboard</h1>
          </div>

          <div className="profile">
            <div className="profile-avatar">M</div>
            <div>
              <strong>{user.username}</strong>
              <span>Milker</span>
            </div>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <MilkProduction userRole={user.role} />
      </main>
    </div>
  );
}
  const formatMoney = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const formatLitres = (value) =>
    new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const renderPage = () => {
    if (currentPage === 'customers') return <Customers />;
    if (currentPage === 'milk') return <MilkProduction userRole={user.role} />;
    if (currentPage === 'livestock') return <Livestock />;
    if (currentPage === 'reports') return <Reports />;
    if (currentPage === 'breeding') return <BreedingOverview />;
    if (currentPage === 'sales') return <Sales />;
    if (currentPage === 'inventory') return <Inventory />;
    if (currentPage === 'expenses') return <Expenses />;
    if (currentPage === 'customer-sales-report') {
      return <CustomerSalesReport />;
    }
    if (currentPage === 'milkers') return <MilkerManagement />;

    return (
      <>
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace / Dashboard</div>
            <h1>Farm Overview</h1>
          </div>

          <div className="profile">
            <div className="profile-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{user.username}</strong>
              <span>Owner</span>
            </div>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="welcome">
          <div>
            <span className="eyebrow">DAILY OPERATIONS</span>
            <h2>Welcome to your farm dashboard</h2>
            <p>
              Monitor production, expenses and farm performance in one place.
            </p>
          </div>

          <div className="date-chip">
            <span>REPORT DATE</span>
            <strong>
              {summary?.reportDate
                ? new Date(`${summary.reportDate}T12:00:00`).toLocaleDateString(
                    'en-IN',
                    {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }
                  )
                : new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
            </strong>
          </div>
        </section>

        {error && (
          <div role="alert" className="dashboard-error">
            <p>{error}</p>
            <button
              type="button"
              className="dashboard-retry"
              onClick={loadDashboardSummary}
              disabled={loading}
            >
              Retry
            </button>
          </div>
        )}

        <section className="section-heading">
          <div>
            <h2>Performance summary</h2>
            <p>Your key farm indicators at a glance</p>
          </div>
          <span className="period-chip">Today's overview</span>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top">
              <span>Milk produced</span>
              <span className="stat-icon green">🥛</span>
            </div>
            <div className="stat-value">
              {loading
                ? '...'
                : summary
                  ? formatLitres(summary.todayMilkProducedLitres)
                  : '—'}
              {!loading && summary && <small>litres</small>}
            </div>
            <div className="stat-note">Today's production</div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Sales revenue</span>
              <span className="stat-icon blue">₹</span>
            </div>
            <div className="stat-value">
              {loading
                ? '...'
                : summary
                  ? formatMoney(summary.todayRevenue)
                  : '—'}
            </div>
            <div className="stat-note">Today's recorded sales</div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Expenses</span>
              <span className="stat-icon orange">↗</span>
            </div>
            <div className="stat-value">
              {loading
                ? '...'
                : summary
                  ? formatMoney(summary.todayExpenses)
                  : '—'}
            </div>
            <div className="stat-note">Today's recorded expenses</div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Active cows</span>
              <span className="stat-icon purple">🐄</span>
            </div>
            <div className="stat-value">
              {loading ? '...' : summary ? summary.activeCows : '—'}
            </div>
            <div className="stat-note">Currently active livestock</div>
          </article>
        </section>

        <section className="section-heading lower-heading">
          <div>
            <h2>Monthly performance</h2>
            <p>Revenue, expenses and inventory alerts for the current month</p>
          </div>
          <button
            type="button"
            className="dashboard-refresh"
            onClick={loadDashboardSummary}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh data'}
          </button>
        </section>

        <section className="stats-grid dashboard-monthly-grid">
          <article className="stat-card">
            <div className="stat-top">
              <span>Monthly revenue</span>
              <span className="stat-icon green">₹</span>
            </div>
            <div className="stat-value">
              {loading
                ? '...'
                : summary
                  ? formatMoney(summary.monthlyRevenue)
                  : '—'}
            </div>
            <div className="stat-note">Total value of recorded sales</div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Monthly expenses</span>
              <span className="stat-icon orange">↗</span>
            </div>
            <div className="stat-value">
              {loading
                ? '...'
                : summary
                  ? formatMoney(summary.monthlyExpenses)
                  : '—'}
            </div>
            <div className="stat-note">Recorded expenses this month</div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Estimated profit / loss</span>
              <span className="stat-icon purple">₹</span>
            </div>
            <div className="stat-value">
              {loading
                ? '...'
                : summary
                  ? formatMoney(summary.monthlyEstimatedProfit)
                  : '—'}
            </div>
            <div className="stat-note">
              Monthly revenue minus recorded expenses
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Low-stock items</span>
              <span className="stat-icon orange">📦</span>
            </div>
            <div className="stat-value">
              {loading ? '...' : summary ? summary.lowStockItems : '—'}
            </div>
            <div className="stat-note">Inventory items needing attention</div>
            <button
              type="button"
              className="dashboard-card-link"
              onClick={() => navigateTo('inventory')}
            >
              Review inventory →
            </button>
          </article>
        </section>

        <section className="section-heading lower-heading">
          <div>
            <h2>Farm operations</h2>
            <p>Quick access to your management modules</p>
          </div>
        </section>

        <section className="modules-grid">
          <article className="module-card">
            <div className="module-icon green">🥛</div>
            <h3>Milk Production</h3>
            <p>
              Record morning and evening milk quantities and review production
              history.
            </p>
            <a href="#milk" onClick={() => navigateTo('milk')}>
              Open module <span>→</span>
            </a>
          </article>

          <article className="module-card">
            <div className="module-icon blue">📦</div>
            <h3>Inventory</h3>
            <p>
              Manage feed stock, purchases, consumption and low-stock alerts.
            </p>
            <a href="#inventory" onClick={() => navigateTo('inventory')}>
              Open module <span>→</span>
            </a>
          </article>

          <article className="module-card">
            <div className="module-icon orange">₹</div>
            <h3>Expenses</h3>
            <p>Track farm spending, categories and monthly expense totals.</p>
            <a href="#expenses" onClick={() => navigateTo('expenses')}>
              Open module <span>→</span>
            </a>
          </article>

          <article className="module-card">
            <div className="module-icon purple">↗</div>
            <h3>Sales &amp; Revenue</h3>
            <p>
              Manage milk sales, customer payments and outstanding balances.
            </p>
            <a href="#sales" onClick={() => navigateTo('sales')}>
              Open module <span>→</span>
            </a>
          </article>

          <article className="module-card">
            <div className="module-icon green">▤</div>
            <h3>Reports &amp; Analytics</h3>
            <p>
              Review profitability, milk volumes and financial performance over
              a selected period.
            </p>
            <a href="#reports" onClick={() => navigateTo('reports')}>
              Open reports <span>→</span>
            </a>
          </article>

          <article className="module-card">
            <div className="module-icon blue">👥</div>
            <h3>Customers</h3>
            <p>
              Register customers, manage contact details and search customer
              records.
            </p>
            <a href="#customers" onClick={() => navigateTo('customers')}>
              Open customers <span>→</span>
            </a>
          </article>
        </section>

        <footer className="page-footer">
          <span>DairyTrack Pro</span>
          <span>Farm management system</span>
        </footer>
      </>
    );
  };

  const navItems = [
    { page: 'dashboard', label: '▦ Dashboard' },
    { page: 'livestock', label: '🐄 Livestock' },
    { page: 'breeding', label: '🐄 Breeding & Calving' },
    { page: 'milk', label: '🥛 Milk Production' },
    { page: 'inventory', label: '📦 Inventory' },
    { page: 'expenses', label: '₹ Expenses' },
    { page: 'sales', label: '↗ Sales & Revenue' },
    { page: 'customers', label: '👥 Customers' },
    { page: 'reports', label: '▤ Reports' },
    { page: 'customer-sales-report', label: '₹ Customer Sales Report' },
    { page: 'milkers', label: '👷 Milker Management' },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">D</div>
          <div>
            <h2>DairyTrack</h2>
            <span>PRO MANAGEMENT</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="navigation">
          {navItems.map((item) => (
            <a
              key={item.page}
              className={`nav-item ${
                currentPage === item.page ? 'active' : ''
              }`}
              href={`#${item.page}`}
              onClick={() => navigateTo(item.page)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-dot" />
          <div>
            <strong>{error ? 'Connection issue' : 'System operational'}</strong>
            <span>
              {error
                ? 'Check backend connection'
                : 'Backend connection configured'}
            </span>
          </div>
        </div>
      </aside>

      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

export default App;
