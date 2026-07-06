import React from 'react'

export default function Listings({ navigate }) {
  const [activeTab, setActiveTab] = React.useState('listingsTab') // 'listingsTab' or 'toursTab'
  const [dbConnected, setDbConnected] = React.useState('checking') // 'checking', 'connected', 'offline'
  
  // Data caches
  const [listings, setListings] = React.useState([])
  const [bookings, setBookings] = React.useState([])
  
  // Filter queries
  const [listingsSearch, setListingsSearch] = React.useState('')
  const [toursSearch, setToursSearch] = React.useState('')
  
  // Lookup states
  const [lookupEmail, setLookupEmail] = React.useState('')
  const [lookupResults, setLookupResults] = React.useState(null) // null, 'loading', array, 'error'

  // Initialize and load dashboard details
  const initDashboard = async () => {
    setDbConnected('checking')
    try {
      const [listingsRes, bookingsRes] = await Promise.all([
        fetch('/api/listings'),
        fetch('/api/bookings')
      ])
      if (!listingsRes.ok || !bookingsRes.ok) throw new Error('Database server error')
      
      const listingsData = await listingsRes.json()
      const bookingsData = await bookingsRes.json()
      
      setListings(listingsData)
      setBookings(bookingsData)
      setDbConnected('connected')
    } catch (err) {
      console.error(err)
      setDbConnected('offline')
    }
  }

  React.useEffect(() => {
    initDashboard()
  }, [])

  // Delete listing proposal
  const handleDeleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to remove this destination listing proposal?')) return
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      initDashboard()
    } catch (err) {
      alert('Unable to delete listing. Please make sure database is online.')
    }
  }

  // Lookup traveler history
  const handleLookupHistory = async (e) => {
    e.preventDefault()
    if (!lookupEmail.trim()) {
      alert('Please enter a valid billing email address.')
      return
    }
    setLookupResults('loading')
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(lookupEmail.trim())}`)
      if (!res.ok) throw new Error('History fetch failed')
      const data = await res.json()
      setLookupResults(data)
    } catch (err) {
      console.error(err)
      setLookupResults('error')
    }
  }

  // Live stats calculators
  const listingsCount = listings.length
  const bookingsCount = bookings.length
  const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0)

  // Filters listings
  const filteredListings = listings.filter(i => {
    const q = listingsSearch.toLowerCase().trim()
    if (!q) return true
    return (
      i.title.toLowerCase().includes(q) ||
      (i.description || '').toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q)
    )
  })

  // Filters paid bookings
  const filteredBookings = bookings.filter(b => {
    const q = toursSearch.toLowerCase().trim()
    if (!q) return true
    return (
      b.tour_title.toLowerCase().includes(q) ||
      b.user_name.toLowerCase().includes(q) ||
      b.user_email.toLowerCase().includes(q) ||
      b.payment_id.toLowerCase().includes(q)
    )
  })

  return (
    <div className="portal-page-container">
      {/* Background Blobs */}
      <div className="bg-blobs">
        <div className="blob blob-pink"></div>
        <div className="blob blob-blue"></div>
      </div>

      <main className="portal-section">
        <div className="portal-container">
          
          <div className="portal-header">
            <h1>TRAVELER & AGENCY PORTAL</h1>
            <p>Track your scheduled vacations, review processed club listings, or manage paid client booking ledgers in real-time.</p>
          </div>

          {/* Database status checker */}
          <div className="system-status-bar">
            <div className="status-indicator">
              <span className={`status-dot ${dbConnected}`}></span>
              <span className="status-text" id="dbStatusText">
                {dbConnected === 'checking' && 'Checking secure database connection...'}
                {dbConnected === 'connected' && (
                  <span>
                    <i className="fa fa-check-circle" style={{ color: '#22c55e', marginRight: '5px' }}></i>
                    Secure Database Connection Active. System fully operational.
                  </span>
                )}
                {dbConnected === 'offline' && (
                  <span>
                    <i className="fa fa-exclamation-triangle" style={{ color: '#ef4444', marginRight: '5px' }}></i>
                    Database offline. Verify that the local backend server is running.
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* High-Fidelity Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-icon"><i className="fa fa-globe"></i></div>
              <div className="stat-info">
                <span className="stat-label">Club Destinations</span>
                <div className="stat-value">{listingsCount}</div>
              </div>
            </div>
            <div className="stat-card stat-green">
              <div className="stat-icon"><i className="fa fa-bank"></i></div>
              <div className="stat-info">
                <span className="stat-label">Agency Total Revenue</span>
                <div className="stat-value">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div className="stat-card stat-pink">
              <div className="stat-icon"><i className="fa fa-credit-card"></i></div>
              <div className="stat-info">
                <span className="stat-label">Confirmed Checkouts</span>
                <div className="stat-value">{bookingsCount}</div>
              </div>
            </div>
          </div>

          {/* Tab Switcher Controls */}
          <div className="tab-controls-wrapper">
            <div className="tab-controls">
              <button
                className={`tab-btn ${activeTab === 'listingsTab' ? 'active' : ''}`}
                onClick={() => setActiveTab('listingsTab')}
              >
                <i className="fa fa-tags"></i> Shared Listings
              </button>
              <button
                className={`tab-btn ${activeTab === 'toursTab' ? 'active' : ''}`}
                onClick={() => setActiveTab('toursTab')}
              >
                <i className="fa fa-plane"></i> Paid Tours Registry
              </button>
            </div>
          </div>

          {/* TAB PANELS CONTAINER */}
          <div className="tabs-container">
            
            {/* Database Offline Fallback Screen */}
            {dbConnected === 'offline' && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px dashed rgba(239, 68, 68, 0.2)',
                borderRadius: '16px',
                marginBottom: '30px'
              }}>
                <i className="fa fa-database" style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block' }}></i>
                <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.15rem', marginBottom: '8px' }}>Database Offline</h3>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.9rem', color: '#a9a9b8' }}>
                  The system cannot establish a connection with the local SQLite bookings database.<br/>
                  Please verify that the backend server is running correctly.
                </p>
                <button className="ctn" style={{ marginTop: '15px', border: 'none', cursor: 'pointer' }} onClick={initDashboard}>Retry Connection</button>
              </div>
            )}

            {dbConnected !== 'offline' && (
              <>
                {/* TAB 1: SHARED LISTINGS */}
                <div className={`tab-pane ${activeTab === 'listingsTab' ? 'active' : ''}`}>
                  <div id="listingsTab">
                    <div className="pane-header-row">
                      <div className="pane-title-group">
                        <h2><i className="fa fa-globe" style={{ color: '#3b82f6' }}></i> Community Shared Listings</h2>
                        <p>Discover destinations and road trips proposed by fellow members of our travel club.</p>
                      </div>
                      <button onClick={() => navigate('/add')} className="add-listing-hero-btn" style={{ border: 'none' }}>
                        <i className="fa fa-plus"></i> Propose Destination
                      </button>
                    </div>
                    <div className="card-separator"></div>
                    
                    {/* Search/Filter for listings */}
                    <div className="filter-wrapper">
                      <div className="search-input-group">
                        <i className="fa fa-search search-icon"></i>
                        <input
                          type="text"
                          placeholder="Filter shared listings by title, author, or description..."
                          value={listingsSearch}
                          onChange={(e) => setListingsSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Listings Grid */}
                    <div className="listings-flex-grid">
                      {dbConnected === 'checking' ? (
                        <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px' }}>
                          <i className="fa fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#3b82f6', marginBottom: '10px', display: 'block' }}></i>
                          Loading active shared listings...
                        </div>
                      ) : filteredListings.length === 0 ? (
                        <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px', color: '#a9a9b8' }}>
                          <i className="fa fa-info-circle" style={{ fontSize: '2rem', color: '#fc036b', marginBottom: '10px', display: 'block' }}></i>
                          No shared listings found matching your query.
                        </div>
                      ) : (
                        filteredListings.map(i => (
                          <article key={i.id} className="listing-dashboard-card">
                            <div className="listing-body">
                              <h3>{i.title}</h3>
                              <p>{i.description || 'No description supplied.'}</p>
                              <div className="listing-meta-row">
                                <span><i className="fa fa-user"></i> Proposed by: <b>{i.name}</b></span>
                                <span><i className="fa fa-envelope"></i> {i.email}</span>
                              </div>
                            </div>
                            <div className="listing-actions-row">
                              <button className="delete-listing-btn" onClick={() => handleDeleteListing(i.id)}>
                                <i className="fa fa-trash"></i> Remove Proposal
                              </button>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* TAB 2: PAID TOURS REGISTRY */}
                <div className={`tab-pane ${activeTab === 'toursTab' ? 'active' : ''}`}>
                  <div className="tours-layout-grid">
                    
                    {/* Registry Entries */}
                    <div className="tours-main-col">
                      <div className="pane-header-row">
                        <div className="pane-title-group">
                          <h2><i className="fa fa-credit-card" style={{ color: '#22c55e' }}></i> Paid Tours Registry</h2>
                          <p>Comprehensive transaction log of all travelers who have completed Stripe checkout payment.</p>
                        </div>
                      </div>
                      <div className="card-separator"></div>

                      <div className="filter-wrapper">
                        <div className="search-input-group">
                          <i className="fa fa-search search-icon"></i>
                          <input
                            type="text"
                            placeholder="Search paid tours by traveler name, email, or tour title..."
                            value={toursSearch}
                            onChange={(e) => setToursSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Receipt entries */}
                      <div className="tours-flex-grid">
                        {dbConnected === 'checking' ? (
                          <div style={{ textAlign: 'center', padding: '40px' }}>
                            <i className="fa fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#22c55e', marginBottom: '10px', display: 'block' }}></i>
                            Loading traveler transaction ledgers...
                          </div>
                        ) : filteredBookings.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#a9a9b8' }}>
                            <i className="fa fa-credit-card" style={{ fontSize: '2.2rem', color: '#22c55e', marginBottom: '10px', display: 'block' }}></i>
                            No successful checkout payments registered in database yet.
                          </div>
                        ) : (
                          filteredBookings.map(b => {
                            const dateObj = new Date(b.created_at)
                            const formattedDate = dateObj.toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })

                            return (
                              <div key={b.id} className="booking-receipt-card">
                                <div className="receipt-details-block">
                                  <h4>{b.tour_title}</h4>
                                  <div className="receipt-traveler-label">
                                    <i className="fa fa-user" style={{ color: '#22c55e' }}></i> 
                                    <span>{b.user_name} <code>({b.user_email})</code></span>
                                  </div>
                                  <div className="receipt-meta-grid">
                                    <span><i className="fa fa-calendar"></i> Target Date: <b>{b.booking_date}</b></span>
                                    <span><i className="fa fa-users"></i> {b.passengers} {b.passengers > 1 ? 'Passengers' : 'Passenger'}</span>
                                    <span><i className="fa fa-tag"></i> Receipt ID: <code style={{ fontWeight: 700, color: '#fff' }}>{b.payment_id}</code></span>
                                    <span><i className="fa fa-clock-o"></i> Booked on: {formattedDate}</span>
                                  </div>
                                </div>
                                <div className="receipt-finance-badge">
                                  <span className="receipt-price-amount">₹{parseFloat(b.total_price || 0).toLocaleString('en-IN')}</span>
                                  <span className="receipt-success-pill"><i className="fa fa-lock"></i> Paid via Stripe</span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>

                    {/* Sidebar Lookup */}
                    <div className="tours-sidebar-col">
                      <div className="sidebar-portal-card">
                        <h3><i className="fa fa-search"></i> Traveler Lookup</h3>
                        <p>Find personal booking receipts and details under a registered billing email address.</p>
                        <div className="card-separator" style={{ margin: '15px 0 20px 0' }}></div>

                        <form onSubmit={handleLookupHistory} className="sidebar-search-form">
                          <input
                            type="email"
                            placeholder="Enter booking email address"
                            required
                            value={lookupEmail}
                            onChange={(e) => setLookupEmail(e.target.value)}
                          />
                          <button type="submit">Retrieve History</button>
                        </form>

                        {/* Lookup Display */}
                        <div className="lookup-results-container">
                          {lookupResults === null && (
                            <div className="lookup-placeholder">
                              <i className="fa fa-id-card-o"></i>
                              <span>Waiting for email lookup query...</span>
                            </div>
                          )}

                          {lookupResults === 'loading' && (
                            <div style={{ textAlign: 'center', padding: '25px' }}>
                              <i className="fa fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#fc036b', marginBottom: '10px', display: 'block' }}></i>
                              Searching travel history...
                            </div>
                          )}

                          {lookupResults === 'error' && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
                              <i className="fa fa-exclamation-circle" style={{ fontSize: '1.8rem', marginBottom: '8px', display: 'block' }}></i>
                              Connection interrupted. Database unavailable.
                            </div>
                          )}

                          {Array.isArray(lookupResults) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: 600, textAlign: 'center', marginBottom: '8px' }}>
                                <i className="fa fa-database"></i> Database online. {lookupResults.length} {lookupResults.length > 1 ? 'bookings' : 'booking'} retrieved.
                              </div>
                              {lookupResults.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#a9a9b8' }}>
                                  <i className="fa fa-plane" style={{ fontSize: '1.8rem', color: '#fc036b', marginBottom: '8px', display: 'block' }}></i>
                                  No bookings found under: <br/><b style={{ wordBreak: 'break-all', color: '#fff', fontSize: '0.82rem' }}>{lookupEmail}</b>
                                </div>
                              ) : (
                                lookupResults.map(b => (
                                  <div key={b.id} className="lookup-result-mini-card">
                                    <h5>{b.tour_title}</h5>
                                    <div className="meta">
                                      <span><i className="fa fa-calendar"></i> Travel: <b>{b.booking_date}</b></span>
                                      <span><i className="fa fa-users"></i> {b.passengers} {b.passengers > 1 ? 'Travellers' : 'Traveller'}</span>
                                      <span><i className="fa fa-receipt"></i> Receipt: <code style={{ fontSize: '0.72rem' }}>{b.payment_id}</code></span>
                                    </div>
                                    <div className="price-row">
                                      <span className="badge-value">PAID</span>
                                      <span className="price-value">₹{parseFloat(b.total_price || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}
