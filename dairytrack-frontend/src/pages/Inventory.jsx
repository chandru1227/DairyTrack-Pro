
import { useCallback, useEffect, useState } from 'react'
import './Inventory.css'

const initialForm = {
  itemCode: '',
  name: '',
  category: 'FEED',
  unit: 'kg',
  minimumStock: '0',
}

const initialTransaction = {
  itemId: '',
  type: 'PURCHASE',
  quantity: '',
  unitCost: '',
  description: '',
}

function Inventory() {
  const [items, setItems] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(initialForm)
  const [transaction, setTransaction] = useState(initialTransaction)

  const [transactionHistory, setTransactionHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyRefresh, setHistoryRefresh] = useState(0)

  const loadInventory = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [itemsResponse, lowStockResponse] = await Promise.all([
        fetch('/api/inventory/items'),
        fetch('/api/inventory/items/low-stock'),
      ])

      if (!itemsResponse.ok || !lowStockResponse.ok) {
        throw new Error('Unable to load inventory. Please try again.')
      }

      const [itemsData, lowStockData] = await Promise.all([
        itemsResponse.json(),
        lowStockResponse.json(),
      ])

      setItems(itemsData)
      setLowStockItems(lowStockData)

      setTransaction((previous) => {
        const selectedStillExists = itemsData.some(
          (item) => String(item.id) === previous.itemId
        )

        return {
          ...previous,
          itemId: selectedStillExists
            ? previous.itemId
            : itemsData.length
              ? String(itemsData[0].id)
              : '',
        }
      })
    } catch (err) {
      setError(err.message || 'Unable to connect to the inventory service.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  useEffect(() => {
    if (!transaction.itemId) {
      setTransactionHistory([])
      setHistoryError('')
      setHistoryLoading(false)
      return
    }

    const controller = new AbortController()

    const loadTransactionHistory = async () => {
      setHistoryLoading(true)
      setHistoryError('')

      try {
        const response = await fetch(
          `/api/inventory/items/${transaction.itemId}/transactions`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Unable to load transaction history.')
        }

        const data = await response.json()
        setTransactionHistory(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setHistoryError(
            err.message || 'Unable to load transaction history.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false)
        }
      }
    }

    loadTransactionHistory()

    return () => controller.abort()
  }, [transaction.itemId, historyRefresh])

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleTransactionChange = (event) => {
    const { name, value } = event.target

    setTransaction((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const readErrorMessage = async (response, fallback) => {
    try {
      const data = await response.json()
      return data.message || data.detail || data.error || fallback
    } catch {
      return fallback
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    const payload = {
      itemCode: form.itemCode.trim(),
      name: form.name.trim(),
      category: form.category,
      unit: form.unit.trim(),
      minimumStock: Number(form.minimumStock),
    }

    try {
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

      const response = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfData.token,
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, 'Unable to create inventory item.')
        )
      }

      setForm(initialForm)
      setSuccess('Inventory item created successfully.')
      await loadInventory()
    } catch (err) {
      setError(err.message || 'Unable to create inventory item.')
    } finally {
      setSaving(false)
    }
  }

  const handleTransactionSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const quantity = Number(transaction.quantity)
    const unitCost = Number(transaction.unitCost)

    if (!transaction.itemId) {
      setError('Please select an inventory item.')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Quantity must be greater than zero.')
      return
    }

    if (
      transaction.type === 'PURCHASE' &&
      (!transaction.unitCost.trim() ||
        !Number.isFinite(unitCost) ||
        unitCost < 0)
    ) {
      setError('Enter a valid unit cost for the purchase.')
      return
    }

    setSaving(true)

    const payload = {
      type: transaction.type,
      quantity,
      unitCost: transaction.type === 'PURCHASE' ? unitCost : 0,
      description: transaction.description.trim(),
    }

    try {
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

      const response = await fetch(
        `/api/inventory/items/${transaction.itemId}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': csrfData.token,
          },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, 'Unable to record transaction.')
        )
      }

      setTransaction((previous) => ({
        ...initialTransaction,
        itemId: previous.itemId,
      }))

      setSuccess('Inventory transaction recorded successfully.')
      setHistoryRefresh((previous) => previous + 1)
      await loadInventory()
    } catch (err) {
      setError(err.message || 'Unable to record inventory transaction.')
    } finally {
      setSaving(false)
    }
  }

  const formatNumber = (value) =>
    Number(value ?? 0).toLocaleString('en-IN', {
      maximumFractionDigits: 3,
    })

  const formatCurrency = (value) =>
    `₹${Number(value ?? 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  const totalInventoryValue = items.reduce(
    (total, item) => total + Number(item.inventoryValue ?? 0),
    0
  )

  const selectedItem = items.find(
    (item) => String(item.id) === transaction.itemId
  )

  return (
    <div className="inventory-page">
      <header className="inventory-header">
        <div>
          <p className="inventory-breadcrumb">Workspace / Inventory</p>
          <h1>Inventory Management</h1>
          <p className="inventory-subtitle">
            Monitor stock, inventory value, and items that need replenishment.
          </p>
        </div>

        <button
          type="button"
          className="inventory-refresh"
          onClick={loadInventory}
          disabled={loading || saving}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </header>

      {error && (
        <div className="inventory-message inventory-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="inventory-message inventory-success" role="status">
          {success}
        </div>
      )}

      <section className="inventory-summary">
        <article className="inventory-summary-card">
          <span>Total inventory items</span>
          <strong>{loading ? '...' : items.length}</strong>
          <small>Registered items</small>
        </article>

        <article className="inventory-summary-card">
          <span>Low-stock items</span>
          <strong>{loading ? '...' : lowStockItems.length}</strong>
          <small>Require attention</small>
        </article>

        <article className="inventory-summary-card">
          <span>Inventory value</span>
          <strong>
            {loading ? '...' : formatCurrency(totalInventoryValue)}
          </strong>
          <small>Based on recorded stock valuation</small>
        </article>
      </section>

      <section className="inventory-panel">
        <div className="inventory-panel-heading">
          <div>
            <h2>Add Inventory Item</h2>
            <p>Register a new feed, supplement, or other inventory item.</p>
          </div>
        </div>

        <form className="inventory-form" onSubmit={handleSubmit}>
          <div className="inventory-form-grid">
            <div className="inventory-field">
              <label htmlFor="itemCode">Item code *</label>
              <input
                id="itemCode"
                name="itemCode"
                value={form.itemCode}
                onChange={handleChange}
                placeholder="e.g. FEED-003"
                maxLength={30}
                required
              />
            </div>

            <div className="inventory-field">
              <label htmlFor="name">Item name *</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Green Fodder"
                maxLength={100}
                required
              />
            </div>

            <div className="inventory-field">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="FEED">Feed</option>
                <option value="SUPPLEMENT">Supplement</option>
                <option value="CLEANING_SUPPLY">Cleaning Supply</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="inventory-field">
              <label htmlFor="unit">Unit *</label>
              <input
                id="unit"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                placeholder="e.g. kg, litre, bag"
                maxLength={20}
                required
              />
            </div>

            <div className="inventory-field">
              <label htmlFor="minimumStock">Minimum stock *</label>
              <input
                id="minimumStock"
                name="minimumStock"
                type="number"
                value={form.minimumStock}
                onChange={handleChange}
                min="0"
                step="0.001"
                required
              />
            </div>
          </div>

          <p className="inventory-form-note">
            New items start at zero stock. Record a purchase to add stock
            and its cost.
          </p>

          <button
            type="submit"
            className="inventory-submit"
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Create Inventory Item'}
          </button>
        </form>
      </section>

      <section className="inventory-panel">
        <div className="inventory-panel-heading">
          <div>
            <h2>Record Stock Transaction</h2>
            <p>Record purchases, consumption, or stock corrections.</p>
          </div>
        </div>

        <form className="inventory-form" onSubmit={handleTransactionSubmit}>
          <div className="inventory-form-grid">
            <div className="inventory-field">
              <label htmlFor="transaction-item">Inventory item *</label>
              <select
                id="transaction-item"
                name="itemId"
                value={transaction.itemId}
                onChange={handleTransactionChange}
                required
                disabled={loading || items.length === 0}
              >
                <option value="">Select an item</option>
                {items.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.itemCode} — {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="inventory-field">
              <label htmlFor="transaction-type">Transaction type *</label>
              <select
                id="transaction-type"
                name="type"
                value={transaction.type}
                onChange={handleTransactionChange}
                required
              >
                <option value="PURCHASE">Purchase</option>
                <option value="CONSUMPTION">Consumption</option>
                <option value="ADJUSTMENT_IN">Stock adjustment in</option>
                <option value="ADJUSTMENT_OUT">Stock adjustment out</option>
              </select>
            </div>

            <div className="inventory-field">
              <label htmlFor="transaction-quantity">
                Quantity {selectedItem ? `(${selectedItem.unit})` : ''} *
              </label>
              <input
                id="transaction-quantity"
                name="quantity"
                type="number"
                min="0.001"
                step="0.001"
                value={transaction.quantity}
                onChange={handleTransactionChange}
                placeholder="Enter quantity"
                required
              />
            </div>

            {transaction.type === 'PURCHASE' && (
              <div className="inventory-field">
                <label htmlFor="transaction-unit-cost">Unit cost (₹) *</label>
                <input
                  id="transaction-unit-cost"
                  name="unitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={transaction.unitCost}
                  onChange={handleTransactionChange}
                  placeholder="Cost per unit"
                  required
                />
              </div>
            )}

            <div className="inventory-field">
              <label htmlFor="transaction-description">
                Description / Notes
              </label>
              <input
                id="transaction-description"
                name="description"
                value={transaction.description}
                onChange={handleTransactionChange}
                placeholder="Optional notes"
                maxLength={250}
              />
            </div>
          </div>

          {selectedItem && (
            <p className="inventory-form-note">
              Current stock: {formatNumber(selectedItem.currentStock)}{' '}
              {selectedItem.unit}. Verify the quantity before saving.
            </p>
          )}

          <button
            type="submit"
            className="inventory-submit"
            disabled={saving || loading || items.length === 0}
          >
            {saving ? 'Saving...' : 'Record Transaction'}
          </button>
        </form>
      </section>

      <section className="inventory-panel">
        <div className="inventory-panel-heading">
          <div>
            <h2>Transaction History</h2>
            <p>
              {selectedItem
                ? `Recorded stock movements for ${selectedItem.itemCode} — ${selectedItem.name}.`
                : 'Select an inventory item in the transaction form to view its history.'}
            </p>
          </div>

          <button
            type="button"
            className="inventory-refresh"
            onClick={() => setHistoryRefresh((previous) => previous + 1)}
            disabled={!transaction.itemId || historyLoading}
          >
            {historyLoading ? 'Loading...' : 'Refresh History'}
          </button>
        </div>

        {!transaction.itemId ? (
          <p className="inventory-empty">
            Select an inventory item to view its transactions.
          </p>
        ) : historyLoading ? (
          <p className="inventory-empty">Loading transaction history...</p>
        ) : historyError ? (
          <div className="inventory-message inventory-error" role="alert">
            {historyError}
          </div>
        ) : transactionHistory.length === 0 ? (
          <p className="inventory-empty">
            No transactions recorded for this item yet.
          </p>
        ) : (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Unit cost</th>
                  <th>Description</th>
                </tr>
              </thead>

              <tbody>
                {transactionHistory.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {record.transactionDate
                        ? record.transactionDate.replace('T', ' ').slice(0, 16)
                        : '—'}
                    </td>
                    <td>{record.type.replaceAll('_', ' ')}</td>
                    <td>
                      {formatNumber(record.quantity)} {selectedItem?.unit ?? ''}
                    </td>
                    <td>
                      {Number(record.unitCost ?? 0) > 0
                        ? formatCurrency(record.unitCost)
                        : '—'}
                    </td>
                    <td>{record.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="inventory-panel">
        <div className="inventory-panel-heading">
          <div>
            <h2>Low-stock alerts</h2>
            <p>
              Items whose current stock has reached their minimum stock level.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="inventory-empty">Loading stock alerts...</p>
        ) : lowStockItems.length === 0 ? (
          <p className="inventory-empty">No low-stock items found.</p>
        ) : (
          <div className="inventory-alert-list">
            {lowStockItems.map((item) => (
              <div className="inventory-alert" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.itemCode} · {item.category.replaceAll('_', ' ')}
                  </p>
                </div>

                <div className="inventory-alert-stock">
                  <strong>
                    {formatNumber(item.currentStock)} {item.unit}
                  </strong>
                  <small>
                    Minimum: {formatNumber(item.minimumStock)} {item.unit}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="inventory-panel">
        <div className="inventory-panel-heading">
          <div>
            <h2>All inventory items</h2>
            <p>Current stock and valuation for every registered item.</p>
          </div>
        </div>

        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item code</th>
                <th>Item name</th>
                <th>Category</th>
                <th>Current stock</th>
                <th>Minimum stock</th>
                <th>Average unit cost</th>
                <th>Inventory value</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="inventory-empty">
                    Loading inventory items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="inventory-empty">
                    No inventory items have been registered yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.itemCode}</td>
                    <td>{item.name}</td>
                    <td>{item.category.replaceAll('_', ' ')}</td>
                    <td>
                      {formatNumber(item.currentStock)} {item.unit}
                    </td>
                    <td>
                      {formatNumber(item.minimumStock)} {item.unit}
                    </td>
                    <td>{formatCurrency(item.averageUnitCost)}</td>
                    <td>{formatCurrency(item.inventoryValue)}</td>
                    <td>
                      <span
                        className={`inventory-status ${
                          item.lowStock
                            ? 'inventory-status-low'
                            : 'inventory-status-ok'
                        }`}
                      >
                        {item.lowStock ? 'Low stock' : 'In stock'}
                      </span>
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

export default Inventory
