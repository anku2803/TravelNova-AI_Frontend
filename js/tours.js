// Premium Interactive Tours Catalog and Booking Coordinator
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5000' : 'https://backend-jade-seven-98.vercel.app';
let activeCategory = 'All';
let searchQuery = '';
let activeSort = 'default';
let selectedTour = null;

// Populate and render cards in the grid
function renderTours() {
  const root = document.getElementById('toursRoot');
  if (!root) return;
  root.innerHTML = '';

  // 1. Filter by Category
  let filtered = EVENTS.filter(e => {
    if (activeCategory === 'All') return true;
    return e.category.toLowerCase() === activeCategory.toLowerCase();
  });

  // 2. Filter by Search live match
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(e => {
      return (
        e.title.toLowerCase().includes(query) ||
        e.short.toLowerCase().includes(query) ||
        e.details.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query)
      );
    });
  }

  // 3. Sort Results
  if (activeSort === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (activeSort === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (activeSort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  // 4. Render Empty State
  if (filtered.length === 0) {
    root.innerHTML = `
      <div class="tours-empty-state">
        <i class="fa fa-compass"></i>
        <h3>No Adventures Located</h3>
        <p>We couldn't track down any upcoming tours matching your search or filters. Try adjusting your query!</p>
      </div>
    `;
    return;
  }

  // 5. Build Cards
  filtered.forEach(e => {
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      starsHtml += i < e.rating ? '<i class="fa fa-star"></i>' : '<i class="fa fa-star-o"></i>';
    }

    const card = document.createElement('article');
    card.className = 'tour-card';
    card.innerHTML = `
      <div class="tour-image-container">
        <span class="tour-badge ${e.category.toLowerCase() === 'india' ? 'badge-india' : ''}">
          ${e.category.toLowerCase() === 'india' ? 'India Special 🇮🇳' : e.category}
        </span>
        <span class="tour-price-tag">₹${(e.price * 85).toLocaleString('en-IN')}</span>
        <img src="${e.image}" alt="${e.title}" onerror="this.src='https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'" />
      </div>
      <div class="tour-body">
        <h3>${e.title}</h3>
        <p class="short-desc">${e.short}</p>
        
        <div class="tour-meta-row">
          <div class="meta-item">
            <i class="fa fa-clock-o"></i>
            <span>${e.duration}</span>
          </div>
          <div class="meta-item">
            <i class="fa fa-line-chart"></i>
            <span>${e.difficulty}</span>
          </div>
          <div class="meta-rating">
            ${starsHtml}
          </div>
        </div>

        <button class="tour-btn" onclick="openBookingModal(${e.id})">
          <span>Quick Book</span>
          <i class="fa fa-arrow-right"></i>
        </button>
      </div>
    `;
    root.appendChild(card);
  });
}

// Modal Form Controls
function openBookingModal(tourId) {
  const tour = EVENTS.find(e => e.id === parseInt(tourId));
  if (!tour) return;

  selectedTour = tour;

  // Set modal elements
  document.getElementById('modalTourTitle').innerText = tour.title;
  document.getElementById('modalLongDescription').innerText = tour.details;
  document.getElementById('modalDuration').innerHTML = `<i class="fa fa-clock-o"></i> ${tour.duration}`;
  document.getElementById('modalDifficulty').innerHTML = `<i class="fa fa-line-chart"></i> ${tour.difficulty}`;
  document.getElementById('modalBasePrice').innerText = `₹${(tour.price * 85).toLocaleString('en-IN')}`;
  
  // Set Category badge
  const categoryBadge = document.getElementById('modalCategoryBadge');
  categoryBadge.innerText = tour.category === 'India' ? 'India Special 🇮🇳' : tour.category;
  categoryBadge.className = 'modal-badge ' + (tour.category.toLowerCase() === 'india' ? 'badge-india' : '');

  // Set background hero image
  document.getElementById('modalHeroImg').style.backgroundImage = `url('${tour.image}')`;

  // Render Rating stars
  const starsContainer = document.getElementById('modalRating');
  starsContainer.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const star = document.createElement('i');
    star.className = i < tour.rating ? 'fa fa-star' : 'fa fa-star-o';
    starsContainer.appendChild(star);
  }

  // Set default passenger value and total price
  document.getElementById('passengers').value = 1;
  updateTotalPrice();

  // Reset inputs and step states
  document.getElementById('bookingForm').reset();
  document.getElementById('cardBrandIcon').className = 'fa fa-credit-card card-brand-icon';
  goToStep1();

  // Show Modal overlay
  document.getElementById('bookingModal').classList.add('active');
  document.body.style.overflow = 'hidden'; // Lock background scroll
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('active');
  document.body.style.overflow = ''; // Unlock scroll
  selectedTour = null;
}

// Passenger counter widget increments
function updatePassengers(change) {
  const input = document.getElementById('passengers');
  let val = parseInt(input.value) + change;
  if (val < 1) val = 1;
  if (val > 10) val = 10; // Max cap
  input.value = val;
  updateTotalPrice();
}

// Recalculate price in real-time
function updateTotalPrice() {
  if (!selectedTour) return;
  const count = parseInt(document.getElementById('passengers').value);
  const total = selectedTour.price * count * 85;
  document.getElementById('modalTotalPrice').innerText = `₹${total.toLocaleString('en-IN')}`;
  document.getElementById('modalPaymentTotal').innerText = `₹${total.toLocaleString('en-IN')}`;
}

// Multi-Step Checkout Navigation
function goToStep1() {
  document.getElementById('bookingStep1').style.display = 'block';
  document.getElementById('bookingStep1').classList.add('active');
  document.getElementById('bookingStep2').style.display = 'none';
  document.getElementById('bookingStep2').classList.remove('active');
  document.getElementById('paymentLoadingOverlay').classList.remove('active');
}

function goToStep2() {
  const name = document.getElementById('bookingName').value.trim();
  const email = document.getElementById('bookingEmail').value.trim();
  
  if (!name || !email) {
    alert('Please fill out your Full Name and Email address first!');
    return;
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address!');
    return;
  }

  document.getElementById('bookingStep1').style.display = 'none';
  document.getElementById('bookingStep1').classList.remove('active');
  document.getElementById('bookingStep2').style.display = 'block';
  document.getElementById('bookingStep2').classList.add('active');
  
  // Set Cardholder name to matching billing value by default
  document.getElementById('cardholderName').value = name;
  updateTotalPrice();
}

// Stripe Credit Card formatting helpers
function formatCardNumber(input) {
  let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  let formatted = '';
  for (let i = 0; i < value.length; i++) {
    if (i > 0 && i % 4 === 0) formatted += ' ';
    formatted += value[i];
  }
  input.value = formatted;

  // React to Brand Issuers
  const brandIcon = document.getElementById('cardBrandIcon');
  if (value.startsWith('4')) {
    brandIcon.className = 'fa fa-cc-visa card-brand-icon active';
  } else if (value.startsWith('5')) {
    brandIcon.className = 'fa fa-cc-mastercard card-brand-icon active';
  } else if (value.startsWith('3')) {
    brandIcon.className = 'fa fa-cc-amex card-brand-icon active';
  } else {
    brandIcon.className = 'fa fa-credit-card card-brand-icon';
  }
}

function formatExpiry(input) {
  let value = input.value.replace(/[^0-9]/gi, '');
  if (value.length > 2) {
    input.value = value.slice(0, 2) + '/' + value.slice(2, 4);
  } else {
    input.value = value;
  }
}

// Perform Stripe Payment Checkout & Persist to SQLite Database
async function handleModalSubmit(event) {
  event.preventDefault();
  if (!selectedTour) return;

  const user_name = document.getElementById('bookingName').value.trim();
  const user_email = document.getElementById('bookingEmail').value.trim();
  const booking_date = document.getElementById('bookingDate').value;
  const passengers = parseInt(document.getElementById('passengers').value);
  const total_price = selectedTour.price * passengers * 85;

  // Stripe validation checks
  const ccNum = document.getElementById('cardNumber').value.replace(/\s/g, '');
  const exp = document.getElementById('cardExpiry').value;
  const cvv = document.getElementById('cardCvv').value;

  if (ccNum.length < 16) {
    alert('Please enter a valid 16-digit credit card number.');
    return;
  }
  if (!/^\d{2}\/\d{2}$/.test(exp)) {
    alert('Please enter expiration in MM/YY format.');
    return;
  }
  if (cvv.length < 3) {
    alert('Please enter a valid 3-digit security code (CVV).');
    return;
  }

  // Launch Payment processing animations
  const overlay = document.getElementById('paymentLoadingOverlay');
  const txt = document.getElementById('processingText');
  overlay.classList.add('active');

  const steps = [
    'Connecting to Stripe Card Gateway...',
    'Authorizing Card Credentials...',
    'Capturing Reservation Sum in Escrow...',
    'Updating Travel Database Ledgers...'
  ];

  for (let i = 0; i < steps.length; i++) {
    txt.innerText = steps[i];
    await new Promise(r => setTimeout(r, 650));
  }

  // Generate unique simulated Stripe Transaction ID
  const mockTxId = 'ch_' + Math.random().toString(36).substr(2, 9).toUpperCase();

  // Create booking details
  const bookingData = {
    tour_id: selectedTour.id,
    tour_title: selectedTour.title,
    user_name,
    user_email,
    booking_date,
    passengers,
    total_price,
    payment_id: mockTxId
  };

  try {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    if (!res.ok) throw new Error('API server checkout failed');
    const dbResponse = await res.json();

    // Remove loading overlay
    overlay.classList.remove('active');

    // Creative checkout visual Success notification banner
    const notice = document.createElement('div');
    notice.style.position = 'fixed';
    notice.style.top = '30px';
    notice.style.left = '50%';
    notice.style.transform = 'translateX(-50%) translateY(-20px)';
    notice.style.background = 'linear-gradient(135deg, #22c55e, #15803d)';
    notice.style.color = '#fff';
    notice.style.padding = '24px 40px';
    notice.style.borderRadius = '20px';
    notice.style.boxShadow = '0 20px 45px rgba(21, 128, 61, 0.4)';
    notice.style.zIndex = '100000';
    notice.style.fontFamily = 'Montserrat, sans-serif';
    notice.style.fontWeight = '700';
    notice.style.textAlign = 'center';
    notice.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    notice.style.opacity = '0';
    notice.innerHTML = `
      <div style="font-size: 1.6rem; margin-bottom: 8px;">🎉 Checkout Successful!</div>
      <div style="font-size: 0.95rem; font-weight: 500; opacity: 0.92; line-height: 1.5;">
        Your adventure on <b>${selectedTour.title}</b> is confirmed!<br/>
        Departure: <b>${booking_date}</b> | Passengers: <b>${passengers}</b><br/>
        Stripe Receipt: <b style="font-family: monospace;">${mockTxId}</b><br/>
        Paid Sum: <b style="color: #a3e635;">₹${total_price.toLocaleString('en-IN')}</b>
      </div>
    `;

    document.body.appendChild(notice);
    
    setTimeout(() => {
      notice.style.transform = 'translateX(-50%) translateY(0)';
      notice.style.opacity = '1';
    }, 10);

    // Close booking modal drawer
    closeBookingModal();

    // Remove notice after 7 seconds
    setTimeout(() => {
      notice.style.transform = 'translateX(-50%) translateY(-20px)';
      notice.style.opacity = '0';
      setTimeout(() => notice.remove(), 400);
    }, 7000);

  } catch (err) {
    console.error(err);
    overlay.classList.remove('active');
    alert('Payment Gateway Timeout: Unable to authorize reservation card. Check connection.');
  }
}


// Bind DOM event handlers
document.addEventListener('DOMContentLoaded', () => {
  renderTours();

  // Search input matching
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderTours();
    });
  }

  // Sorting selection
  const sortBySelect = document.getElementById('sortBy');
  if (sortBySelect) {
    sortBySelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      renderTours();
    });
  }

  // Category filter tabs
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      activeCategory = tab.getAttribute('data-category');
      renderTours();
    });
  });

  // Modal overlay events
  const closeModalBtn = document.getElementById('closeModalBtn');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeBookingModal);
  }

  const modalOverlay = document.getElementById('bookingModal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeBookingModal();
      }
    });
  }

  // Automatic Routing via URL Query Parameters (e.g. ?id=6 or ?category=Adventure)
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  if (catParam) {
    activeCategory = catParam;
    // Highlight correct filter tab button
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(t => {
      if (t.getAttribute('data-category').toLowerCase() === catParam.toLowerCase()) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
  }

  const tourIdParam = urlParams.get('id');
  if (tourIdParam) {
    // Open relevant modal after dynamic items populate
    setTimeout(() => {
      openBookingModal(tourIdParam);
    }, 200);
  }
});
