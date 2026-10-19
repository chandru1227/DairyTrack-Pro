
import { useState } from 'react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1: Obtain a CSRF token.
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
        throw new Error('Security token is missing. Please refresh the page.');
      }

      // Step 2: Submit login credentials with the CSRF token.
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfData.token,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      });

      // Step 3: Read the response safely.
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
          data.message || 'Login failed. Please check your credentials and try again.'
        );
      }

      if (!['OWNER', 'MILKER'].includes(data.role)) {
        throw new Error('Your account has an unsupported role.');
      }

      // Step 4: Notify the application of successful login.
      onLogin(data);
    } catch (err) {
      setError(
        err.message || 'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.logo}>D</div>

        <h1 style={styles.title}>DairyTrack Pro</h1>
        <p style={styles.subtitle}>Sign in to your farm workspace</p>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}

        <label style={styles.label} htmlFor="username">
          Username
        </label>

        <input
          id="username"
          style={styles.input}
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          disabled={loading}
        />

        <label style={styles.label} htmlFor="password">
          Password
        </label>

        <input
          id="password"
          style={styles.input}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={loading}
        />

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p style={styles.footer}>
          Secure access for authorized farm users
        </p>
      </form>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#f3f7f4',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
    padding: '32px',
    borderRadius: '16px',
    background: '#ffffff',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },
  logo: {
    width: '48px',
    height: '48px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '12px',
    background: '#18794e',
    color: '#ffffff',
    fontSize: '26px',
    fontWeight: 'bold',
  },
  title: {
    margin: '20px 0 8px',
    color: '#173b2b',
    fontSize: '26px',
  },
  subtitle: {
    margin: '0 0 24px',
    color: '#68756e',
    fontSize: '14px',
  },
  label: {
    display: 'block',
    margin: '16px 0 8px',
    color: '#26352c',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    border: '1px solid #d6ded8',
    borderRadius: '8px',
    fontSize: '15px',
  },
  button: {
    width: '100%',
    marginTop: '24px',
    padding: '13px',
    border: 'none',
    borderRadius: '8px',
    background: '#18794e',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  error: {
    padding: '12px',
    borderRadius: '8px',
    background: '#fff0f0',
    color: '#b42318',
    fontSize: '14px',
  },
  footer: {
    margin: '20px 0 0',
    textAlign: 'center',
    color: '#7a857e',
    fontSize: '12px',
  },
};

export default Login;
