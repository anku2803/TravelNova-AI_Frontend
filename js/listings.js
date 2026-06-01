// Premium Listings & Paid Tours Dashboard Coordinator
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5000' : '';

// Client-side cache to enable instant search filters
let cachedListings = [];
let cachedBookings = [];

// Tab switcher logic
function switchTab(tabId) {
  // Toggle tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`btn-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Toggle tab panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
    pane.style.display = 'none';
    pane.style.opacity = '0';
  });

  const activePane = document.getElementById(tabId);
  if (activePane) {
    activePane.style.display = 'block';
    // Allow thread to tick for CSS transition
    setTimeout(() => {
      activePane.classList.add('active');
      activePane.style.opacity = '1';
    }, 10);
  }
}

// Check database connection and load all dashboard data
async function initDashboard() {
  const statusIndicator = document.getElementById('dbStatusIndicator');
  const statusDot = statusIndicator?.querySelector('.status-dot');
  const statusText = document.getElementById('dbStatusText');

  try {
    // Attempt parallel fetch for listings and bookings to check connection
    const [listingsRes, bookingsRes] = await Promise.all([
      fetch(`${API_BASE}/api/listings`),
      fetch(`${API_BASE}/api/bookings`)
    ]);

    if (!listingsRes.ok || !bookingsRes.ok) throw new Error('Database server returned error status');

    cachedListings = await listingsRes.json();
    cachedBookings = await bookingsRes.json();

    // 1. Update secure connection status indicator to CONNECTED
    if (statusDot) {
      statusDot.className = 'status-dot connected';
    }
    if (statusText) {
      statusText.innerHTML = '<i class="fa fa-check-circle" style="color: #22c55e;"></i> Secure Database Connection Active. System fully operational.';
    }

    // 2. Compute and animate stats counters
    updateStatsingsings();

    // 3. Render contents
    renderListingsGrid(cachedListings);
    renderPaidToursGrid(cachedBookings);

  } catch (err) {
    console.error('Database connection failed:', err);

    // Update secure connection status indicator to OFFLINE
    if (statusDot) {
      statusDot.className = 'status-dot offline';
    }
    if (statusText) {
      statusText.innerHTML = '<i class="fa fa-exclamation-triangle" style="color: #ef4444;"></i> Database offline. Verify that the local backend server is running.';
    }

    // Render offline/error placeholders in lists
    renderOfflinePlaceholders();
  }
}

// Render friendly offline messages if fetch fails
function renderOfflinePlaceholders() {
  const listRoot = document.getElementById('listRoot');
  const paidToursRoot = document.getElementById('paidToursRoot');
  const historyRoot = document.getElementById('historyRoot');

  const offlineHtml = `
    <div style="text-align: center; padding: 40px; color: #ef4444; background: rgba(239, 68, 68, 0.05); border: 1px dashed rgba(239, 68, 68, 0.2); border-radius: 16px; grid-column: span 2;">
      <i class="fa fa-database" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
      <h3 style="font-family: Montserrat, sans-serif; font-size: 1.15rem; margin-bottom: 8px;">Database Offline</h3>
      <p style="font-family: Roboto, sans-serif; font-size: 0.9rem; color: #a9a9b8;">
        The system cannot establish a connection with the local SQLite bookings database.<br/>
        Please start the backend server by launching <b>npm start</b> in the <code>server</code> directory.
      </p>
    </div>
  `;

  if (listRoot) listRoot.innerHTML = offlineHtml;
  if (paidToursRoot) paidToursRoot.innerHTML = offlineHtml;
}

// Compute stats counters and display in INR currency
function updateStatsingsings() {
  const listingsVal = document.getElementById('statsListingsCount');
  const bookingsVal = document.getElementById('statsBookingsCount');
  const revenueVal = document.getElementById('statsRevenueAmount');

  // Listings count
  if (listingsVal) listingsVal.innerText = cachedListings.length;

  // Bookings count
  if (bookingsVal) bookingsVal.innerText = cachedBookings.length;

  // Cumulative revenue amount in INR
  if (revenueVal) {
    const totalRev = cachedBookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);
    revenueVal.innerText = `₹${totalRev.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
}

// Render community listings grid
function renderListingsGrid(items) {
  const root = document.getElementById('listRoot');
  if (!root) return;

  if (!items.length) {
    root.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #a9a9b8; grid-column: span 2;">
        <i class="fa fa-info-circle" style="font-size: 2rem; color: #fc036b; margin-bottom: 10px; display: block;"></i>
        No shared listings found matching your query.
      </div>
    `;
    return;
  }

  const container = document.createElement('div');
  container.className = 'listings-flex-grid';
  container.style.width = '100%';

  items.forEach(i => {
    const card = document.createElement('article');
    card.className = 'listing-dashboard-card';

    // Build card contents
    card.innerHTML = `
      <div class="listing-body">
        <h3>${escapeHtml(i.title)}</h3>
        <p>${escapeHtml(i.description || 'No description supplied.')}</p>
        <div class="listing-meta-row">
          <span><i class="fa fa-user"></i> Proposed by: <b>${escapeHtml(i.name)}</b></span>
          <span><i class="fa fa-envelope"></i> ${escapeHtml(i.email)}</span>
        </div>
      </div>
      <div class="listing-actions-row">
        <button class="delete-listing-btn" onclick="deleteListing(${i.id})">
          <i class="fa fa-trash"></i> Remove Proposal
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  root.innerHTML = '';
  root.appendChild(container);
}

// Render all paid tours (who gave payment) in Tours registry
function renderPaidToursGrid(items) {
  const root = document.getElementById('paidToursRoot');
  if (!root) return;

  if (!items.length) {
    root.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #a9a9b8;">
        <i class="fa fa-credit-card" style="font-size: 2.2rem; color: #22c55e; margin-bottom: 10px; display: block;"></i>
        No successful checkout payments registered in database yet.
      </div>
    `;
    return;
  }

  const container = document.createElement('div');
  container.className = 'tours-flex-grid';

  items.forEach(b => {
    const dateObj = new Date(b.created_at);
    const formattedDate = dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const card = document.createElement('div');
    card.className = 'booking-receipt-card';
    card.innerHTML = `
      <div class="receipt-details-block">
        <h4>${escapeHtml(b.tour_title)}</h4>
        <div class="receipt-traveler-label">
          <i class="fa fa-user" style="color: #22c55e;"></i> 
          <span>${escapeHtml(b.user_name)} <code>(${escapeHtml(b.user_email)})</code></span>
        </div>
        <div class="receipt-meta-grid">
          <span><i class="fa fa-calendar"></i> Target Date: <b>${escapeHtml(b.booking_date)}</b></span>
          <span><i class="fa fa-users"></i> ${escapeHtml(b.passengers)} ${b.passengers > 1 ? 'Passengers' : 'Passenger'}</span>
          <span><i class="fa fa-tag"></i> Receipt ID: <code style="font-weight: 700; color: #fff;">${escapeHtml(b.payment_id)}</code></span>
          <span><i class="fa fa-clock-o"></i> Booked on: ${formattedDate}</span>
        </div>
      </div>
      <div class="receipt-finance-badge">
        <span class="receipt-price-amount">₹${parseFloat(b.total_price || 0).toLocaleString('en-IN')}</span>
        <span class="receipt-success-pill"><i class="fa fa-lock"></i> Paid via Stripe</span>
      </div>
    `;
    container.appendChild(card);
  });

  root.innerHTML = '';
  root.appendChild(container);
}

// Client-side search filters for community listings
function filterListings() {
  const query = document.getElementById('listingsSearch').value.toLowerCase().trim();
  if (query === '') {
    renderListingsGrid(cachedListings);
    return;
  }

  const filtered = cachedListings.filter(i => {
    return (
      i.title.toLowerCase().includes(query) ||
      (i.description || '').toLowerCase().includes(query) ||
      i.name.toLowerCase().includes(query) ||
      i.email.toLowerCase().includes(query)
    );
  });

  renderListingsGrid(filtered);
}

// Client-side search filters for paid bookings registry
function filterPaidBookings() {
  const query = document.getElementById('toursSearch').value.toLowerCase().trim();
  if (query === '') {
    renderPaidToursGrid(cachedBookings);
    return;
  }

  const filtered = cachedBookings.filter(b => {
    return (
      b.tour_title.toLowerCase().includes(query) ||
      b.user_name.toLowerCase().includes(query) ||
      b.user_email.toLowerCase().includes(query) ||
      b.payment_id.toLowerCase().includes(query)
    );
  });

  renderPaidToursGrid(filtered);
}

// Delete shared community listing proposal
async function deleteListing(id) {
  if (!confirm('Are you sure you want to remove this destination listing proposal?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/listings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    
    // Refresh state
    initDashboard();
  } catch (err) {
    alert('Unable to delete listing. Please make sure database is online.');
  }
}

// Individual traveler history lookup by email
async function lookupHistory(event) {
  event.preventDefault();
  const emailInput = document.getElementById('lookupEmail');
  const root = document.getElementById('historyRoot');
  
  if (!emailInput || !root) return;
  const email = emailInput.value.trim();
  
  if (!email) {
    alert('Please enter a valid billing email address.');
    return;
  }

  root.innerHTML = `
    <div style="text-align: center; padding: 25px;">
      <i class="fa fa-spinner fa-spin" style="font-size: 1.8rem; color: #fc036b; margin-bottom: 10px; display: block;"></i>
      Searching travel history...
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/api/bookings?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Failed to retrieve history');
    const bookings = await res.json();

    if (!bookings.length) {
      root.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #a9a9b8;">
          <i class="fa fa-plane" style="font-size: 1.8rem; color: #fc036b; margin-bottom: 8px; display: block;"></i>
          No bookings found under: <br/><b style="word-break: break-all; color:#fff; font-size:0.82rem;">${escapeHtml(email)}</b>
        </div>
      `;
      return;
    }

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';

    // Show a success connection badge for the lookup too
    const lookupSummary = document.createElement('div');
    lookupSummary.style.fontSize = '0.78rem';
    lookupSummary.style.color = '#22c55e';
    lookupSummary.style.fontWeight = '600';
    lookupSummary.style.textAlign = 'center';
    lookupSummary.style.marginBottom = '8px';
    lookupSummary.innerHTML = `<i class="fa fa-database"></i> Database online. ${bookings.length} ${bookings.length > 1 ? 'bookings' : 'booking'} retrieved.`;
    container.appendChild(lookupSummary);

    bookings.forEach(b => {
      const dateObj = new Date(b.created_at);
      const shortDate = dateObj.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
      });

      const card = document.createElement('div');
      card.className = 'lookup-result-mini-card';
      card.innerHTML = `
        <h5>${escapeHtml(b.tour_title)}</h5>
        <div class="meta">
          <span><i class="fa fa-calendar"></i> Travel: <b>${escapeHtml(b.booking_date)}</b></span>
          <span><i class="fa fa-users"></i> ${escapeHtml(b.passengers)} ${b.passengers > 1 ? 'Travellers' : 'Traveller'}</span>
          <span><i class="fa fa-receipt"></i> Receipt: <code style="font-size: 0.72rem;">${escapeHtml(b.payment_id)}</code></span>
        </div>
        <div class="price-row">
          <span class="badge-value">PAID</span>
          <span class="price-value">₹${parseFloat(b.total_price || 0).toLocaleString('en-IN')}</span>
        </div>
      `;
      container.appendChild(card);
    });

    root.innerHTML = '';
    root.appendChild(container);

  } catch (err) {
    console.error(err);
    root.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #ef4444;">
        <i class="fa fa-exclamation-circle" style="font-size: 1.8rem; margin-bottom: 8px; display: block;"></i>
        Connection interrupted. Database unavailable.
      </div>
    `;
  }
}

// Basic HTML escaping helper
function escapeHtml(s) { 
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); 
}

// Page load initialization
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});
