
import { useEffect, useState } from 'react';
import './Customers.css';

const API_URL = '/api/customers';

const emptyForm = {
  name: '',
  phoneNumber: '',
  address: '',
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function readError(response) {
    try {
      const data = await response.json();
      return data.message || data.detail || data.error || 'Request failed.';
    } catch {
      return 'Request failed. Please try again.';
    }
  }
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
  async function loadCustomers(searchText = '') {
    setLoading(true);
    setError('');

    try {
      const url = searchText.trim()
        ? `${API_URL}/search?name=${encodeURIComponent(searchText.trim())}`
        : API_URL;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      setError(err.message || 'Unable to load customers. Check the backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function startEdit(customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name || '',
      phoneNumber: customer.phoneNumber || '',
      address: customer.address || '',
    });
    setMessage('');
    setError('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(event) {
  event.preventDefault();

  const customerName = form.name.trim();

  if (!customerName) {
    setError('Customer name is required.');
    return;
  }

  setSaving(true);
  setError('');
  setMessage('');

  const payload = {
    name: customerName,
    phoneNumber: form.phoneNumber.trim(),
    address: form.address.trim(),
  };

  try {
    const csrfToken = await getCsrfToken();

    const url = editingId
      ? `${API_URL}/${editingId}`
      : API_URL;

    const response = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
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

    setMessage(
      editingId
        ? 'Customer updated successfully.'
        : 'Customer registered successfully.'
    );

    setForm(emptyForm);
    setEditingId(null);

    await loadCustomers(search);
  } catch (err) {
    setError(err.message || 'Unable to save customer.');
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div>
          <h1>Customer Management</h1>
          <p>Manage your dairy customers and their contact details.</p>
        </div>

        <div className="customers-count">
          <span>Total Customers</span>
          <strong>{customers.length}</strong>
        </div>
      </div>

      <section className="customer-form-card">
        <div className="customer-section-heading">
          <div>
            <h2>{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>
            <p>
              {editingId
                ? `Updating customer #${editingId}`
                : 'Enter the customer details below.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="customer-form-grid">
            <div className="customer-field">
              <label htmlFor="customer-name">Customer Name *</label>
              <input
                id="customer-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter customer name"
                maxLength={120}
                required
              />
            </div>

            <div className="customer-field">
              <label htmlFor="customer-phone">Phone Number</label>
              <input
                id="customer-phone"
                name="phoneNumber"
                type="tel"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="Enter phone number"
                maxLength={20}
              />
            </div>

            <div className="customer-field customer-address-field">
              <label htmlFor="customer-address">Address</label>
              <textarea
                id="customer-address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter customer address"
                maxLength={255}
                rows={3}
              />
            </div>
          </div>

          <div className="customer-form-actions">
            {editingId && (
              <button
                type="button"
                className="customer-btn customer-btn-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="customer-btn customer-btn-primary"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Update Customer'
                  : 'Register Customer'}
            </button>
          </div>
        </form>
      </section>

      {message && (
        <div className="customer-alert customer-alert-success" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="customer-alert customer-alert-error" role="alert">
          {error}
        </div>
      )}

      <section className="customer-list-card">
        <div className="customer-list-heading">
          <div>
            <h2>Customer List</h2>
            <p>View, search, and update registered customers.</p>
          </div>

          <div className="customer-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer name..."
              aria-label="Search customers by name"
            />
          </div>
        </div>

        {loading ? (
          <div className="customer-state">Loading customers...</div>
        ) : error && customers.length === 0 ? (
          <div className="customer-state">
            Unable to display customers. Check the error message above.
            <button
              type="button"
              className="customer-btn customer-btn-secondary"
              onClick={() => loadCustomers(search)}
            >
              Retry
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="customer-state">
            {search.trim()
              ? 'No customers found matching your search.'
              : 'No customers registered yet.'}
          </div>
        ) : (
          <div className="customer-table-wrapper">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Address</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>#{customer.id}</td>
                    <td className="customer-name-cell">{customer.name}</td>
                    <td>{customer.phoneNumber || '—'}</td>
                    <td className="customer-address-cell">
                      {customer.address || '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="customer-edit-btn"
                        onClick={() => startEdit(customer)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="customer-list-footer">
          Showing {customers.length} customer{customers.length === 1 ? '' : 's'}
          {search.trim() ? ' matching your search' : ''}
        </div>
      </section>
    </div>
  );
}

export default Customers;
