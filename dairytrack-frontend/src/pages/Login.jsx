
import { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const csrfResponse = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!csrfResponse.ok) {
        throw new Error(
          'Unable to obtain security token. Please try again.'
        );
      }

      const csrfData = await csrfResponse.json();

      if (!csrfData.token) {
        throw new Error(
          'Security token is missing. Please refresh the page.'
        );
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfData.token,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {
          message: responseText || 'The server returned an empty response.',
        };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Login failed. Please check your credentials and try again.'
        );
      }

      if (!['OWNER', 'MILKER'].includes(data.role)) {
        throw new Error('Your account has an unsupported role.');
      }

      onLogin(data);
    } catch (err) {
      setError(
        err.message ||
          'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-visual-overlay" />

        <div className="login-brand">
          <img
  className="login-brand-image"
  src="/dairytrack-icon.png"
  alt="DairyTrack Pro"
/>
          <span>DairyTrack <strong>Pro</strong></span>
        </div>

        <div className="login-visual-content">
          <span className="login-eyebrow">
            SMART DAIRY MANAGEMENT
          </span>

          <h1>
            Better care.
            <br />
            Better milk.
            <br />
            <span>Better farming.</span>
          </h1>

          <p>
            Your farm operations, production records and business
            performance — all in one place.
          </p>

          <div className="login-feature-list">
            <div className="login-feature">
              <span className="login-feature-icon">✓</span>
              <span>Track daily milk production</span>
            </div>

            <div className="login-feature">
              <span className="login-feature-icon">✓</span>
              <span>Manage livestock and farm expenses</span>
            </div>

            <div className="login-feature">
              <span className="login-feature-icon">✓</span>
              <span>Monitor sales and business performance</span>
            </div>
          </div>
        </div>

        <div className="login-visual-footer">
          <span>Designed for modern dairy farms</span>
          <span>DAIRYTRACK PRO</span>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="login-mobile-brand">
            <img
  className="login-brand-image"
  src="/dairytrack-icon.png"
  alt="DairyTrack Pro"
/>
            <span>DairyTrack <strong>Pro</strong></span>
          </div>

          <div className="login-heading">
            <span className="login-welcome-label">
              WELCOME BACK
            </span>

            <h2>Sign in to your account</h2>

            <p>
              Enter your credentials to access your farm workspace.
            </p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span className="login-error-icon">!</span>
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="username">Username</label>

              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="login-field">
              <div className="login-password-label">
                <label htmlFor="password">Password</label>
              </div>

              <div className="login-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                />

                <button
                  className="login-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to DairyTrack
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          <div className="login-security-note">
            <span aria-hidden="true">🔒</span>
            <span>
              Secure access for authorized farm users only.
            </span>
          </div>

          <footer className="login-form-footer">
            © {new Date().getFullYear()} DairyTrack Pro
          </footer>
        </div>
      </section>
    </main>
  );
}

export default Login;
