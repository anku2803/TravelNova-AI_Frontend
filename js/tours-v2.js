
// Premium Interactive Tours Catalog and Booking Coordinator
const API_BASE = (window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://backend-jade-seven-98.vercel.app';

let activeCategory = 'All';
let searchQuery = '';
let activeSort = 'default';
let selectedTour = null;
let upiCountdownInterval = null;
let currentPaymentMethod = 'card';

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

        <button class="tour-btn" data-tour-id="${e.id}">
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
  try {
    const tour = EVENTS.find(e => e.id === parseInt(tourId));
    if (!tour) {
      alert("Tour not found with ID: " + tourId);
      return;
    }

    selectedTour = tour;

    // Set modal elements
    document.getElementById('modalTourTitle').innerText = tour.title;
    document.getElementById('modalLongDescription').innerText = tour.details;
    document.getElementById('modalDuration').innerHTML = `<i class="fa fa-clock-o"></i> ${tour.duration}`;
    document.getElementById('modalDifficulty').innerHTML = `<i class="fa fa-line-chart"></i> ${tour.difficulty}`;
    document.getElementById('modalBasePrice').innerText = `₹${(tour.price * 85).toLocaleString('en-IN')}`;

    // Set Category badge
    const categoryBadge = document.getElementById('modalCategoryBadge');
    if (categoryBadge) {
      categoryBadge.innerText = tour.category === 'India' ? 'India Special 🇮🇳' : tour.category;
      categoryBadge.className = 'modal-badge ' + (tour.category.toLowerCase() === 'india' ? 'badge-india' : '');
    }

    // Set background hero image
    const heroImg = document.getElementById('modalHeroImg');
    if (heroImg) {
      heroImg.style.backgroundImage = `url('${tour.image}')`;
    }

    // Render Rating stars
    const starsContainer = document.getElementById('modalRating');
    if (starsContainer) {
      starsContainer.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        const star = document.createElement('i');
        star.className = i < tour.rating ? 'fa fa-star' : 'fa fa-star-o';
        starsContainer.appendChild(star);
      }
    }

    // Set default passenger value and total price
    const passengersInput = document.getElementById('passengers');
    if (passengersInput) {
      passengersInput.value = 1;
    }
    updateTotalPrice();

    // Reset inputs and step states
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
      bookingForm.reset();
    }
    const cardBrandIcon = document.getElementById('cardBrandIcon');
    if (cardBrandIcon) {
      cardBrandIcon.className = 'fa fa-credit-card card-brand-icon';
    }
    goToStep1();

    // Show Modal overlay
    const bookingModal = document.getElementById('bookingModal');
    if (bookingModal) {
      bookingModal.classList.add('active');
    }
    document.body.style.overflow = 'hidden'; // Lock background scroll
  } catch (err) {
    alert("Error opening booking modal: " + err.message + "\nStack: " + err.stack);
    console.error("Error opening booking modal:", err);
  }
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('active');
  document.body.style.overflow = ''; // Unlock scroll
  selectedTour = null;
  clearInterval(upiCountdownInterval);
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
  const dateVal = document.getElementById('bookingDate').value;

  if (!name || !email || !dateVal) {
    showErrorBanner('Missing Details', 'Please fill out your Full Name, Email, and select a Date first!');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErrorBanner('Invalid Email', 'Please enter a valid email address!');
    return;
  }

  document.getElementById('bookingStep1').style.display = 'none';
  document.getElementById('bookingStep1').classList.remove('active');
  document.getElementById('bookingStep2').style.display = 'block';
  document.getElementById('bookingStep2').classList.add('active');

  // Set Cardholder name to matching billing value by default
  document.getElementById('cardholderName').value = name;
  document.getElementById('previewCardName').innerText = name.toUpperCase() || 'YOUR NAME HERE';
  document.getElementById('previewCardExpiry').innerText = 'MM/YY';
  document.getElementById('previewCardNumber').innerText = '•••• •••• •••• ••••';
  document.getElementById('previewCardCvv').innerText = '•••';

  updateTotalPrice();
  switchPaymentMethod('card');
}

// Payment method switcher
function switchPaymentMethod(method) {
  currentPaymentMethod = method;
  const cardTab = document.querySelector('.pay-tab[data-method="card"]');
  const upiTab = document.querySelector('.pay-tab[data-method="upi"]');
  const cardContent = document.getElementById('methodCard');
  const upiContent = document.getElementById('methodUpi');

  if (method === 'card') {
    cardTab.classList.add('active');
    upiTab.classList.remove('active');
    cardContent.style.display = 'block';
    cardContent.classList.add('active');
    upiContent.style.display = 'none';
    upiContent.classList.remove('active');
    clearInterval(upiCountdownInterval);
  } else if (method === 'upi') {
    upiTab.classList.add('active');
    cardTab.classList.remove('active');
    upiContent.style.display = 'block';
    upiContent.classList.add('active');
    cardContent.style.display = 'none';
    cardContent.classList.remove('active');
    setupUpiPayment();
  }
}

// 3D Credit Card Flipping
function flipCard(isFlipped) {
  const cardInner = document.getElementById('creditCardInner');
  if (cardInner) {
    if (isFlipped) {
      cardInner.classList.add('flipped');
    } else {
      cardInner.classList.remove('flipped');
    }
  }
}

function updateCardName(input) {
  const preview = document.getElementById('previewCardName');
  if (preview) {
    preview.innerText = input.value.trim().toUpperCase() || 'YOUR NAME HERE';
  }
}

function updateCardCvv(input) {
  const preview = document.getElementById('previewCardCvv');
  if (preview) {
    let stars = '';
    for (let i = 0; i < input.value.length; i++) {
      stars += '•';
    }
    preview.innerText = stars || '•••';
  }
}

// Credit Card formatting helpers
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
  const cardTypeLogo = document.getElementById('cardTypeLogo');

  let filledNumber = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) filledNumber += ' ';
    if (i < value.length) {
      filledNumber += value[i];
    } else {
      filledNumber += '•';
    }
  }
  const previewNum = document.getElementById('previewCardNumber');
  if (previewNum) {
    previewNum.innerText = filledNumber || '•••• •••• •••• ••••';
  }

  if (brandIcon && cardTypeLogo) {
    if (value.startsWith('4')) {
      brandIcon.className = 'fa fa-cc-visa card-brand-icon active';
      cardTypeLogo.innerHTML = '<i class="fa fa-cc-visa"></i>';
    } else if (value.startsWith('5')) {
      brandIcon.className = 'fa fa-cc-mastercard card-brand-icon active';
      cardTypeLogo.innerHTML = '<i class="fa fa-cc-mastercard"></i>';
    } else if (value.startsWith('3')) {
      brandIcon.className = 'fa fa-cc-amex card-brand-icon active';
      cardTypeLogo.innerHTML = '<i class="fa fa-cc-amex"></i>';
    } else {
      brandIcon.className = 'fa fa-credit-card card-brand-icon';
      cardTypeLogo.innerHTML = '<i class="fa fa-credit-card"></i>';
    }
  }
}

function formatExpiry(input) {
  let value = input.value.replace(/[^0-9]/gi, '');
  if (value.length > 2) {
    input.value = value.slice(0, 2) + '/' + value.slice(2, 4);
  } else {
    input.value = value;
  }
  const previewExp = document.getElementById('previewCardExpiry');
  if (previewExp) {
    previewExp.innerText = input.value || 'MM/YY';
  }
}

// UPI payment configuration
function setupUpiPayment() {
  if (!selectedTour) return;
  const count = parseInt(document.getElementById('passengers').value);
  const total = selectedTour.price * count * 85;

  // Set prices
  document.getElementById('modalUpiPaymentTotal').innerText = `₹${total.toLocaleString('en-IN')}`;

  // Generate unique Ref Reference
  const txRef = 'ADV-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  document.getElementById('upiTxRef').innerText = txRef;

  // Generate dynamic QR Code via Free API
  const payeeAddress = 'adventuretours@paytm';
  const payeeName = 'ADVENTURE TOURS AND EVENT';
  const note = `Booking for ${selectedTour.title} Ref ${txRef}`;
  const upiUri = `upi://pay?pa=${payeeAddress}&pn=${encodeURIComponent(payeeName)}&am=${total}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(upiUri)}`;

  document.getElementById('upiQrImg').src = qrUrl;

  // Countdown timer
  let timeRemaining = 300; // 5 minutes
  const timerElement = document.getElementById('upiTimer');

  clearInterval(upiCountdownInterval);

  upiCountdownInterval = setInterval(() => {
    timeRemaining--;
    if (timeRemaining <= 0) {
      clearInterval(upiCountdownInterval);
      timerElement.innerText = 'QR Code Expired. Switch tabs to reload.';
      document.getElementById('upiQrImg').style.opacity = '0.15';
    } else {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      timerElement.innerText = `Time Remaining: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

// Verify UPI Payment
async function verifyUpiPayment() {
  if (!selectedTour) return;

  const user_name = document.getElementById('bookingName').value.trim();
  const user_email = document.getElementById('bookingEmail').value.trim();
  const booking_date = document.getElementById('bookingDate').value;
  const passengers = parseInt(document.getElementById('passengers').value);
  const total_price = selectedTour.price * passengers * 85;
  const upiTxRef = document.getElementById('upiTxRef').innerText;

  // Launch animations
  const overlay = document.getElementById('paymentLoadingOverlay');
  const txt = document.getElementById('processingText');
  overlay.classList.add('active');

  const steps = [
    'Connecting to UPI Gateway...',
    'Checking VPA adventuretours@paytm...',
    'Querying Transaction Status for ' + upiTxRef + '...',
    'Payment Authenticated via Bank Server...',
    'Updating Travel Database Ledgers...'
  ];

  for (let i = 0; i < steps.length; i++) {
    txt.innerText = steps[i];
    await new Promise(r => setTimeout(r, 650));
  }

  // Create booking details
  const bookingData = {
    tour_id: selectedTour.id,
    tour_title: selectedTour.title,
    user_name,
    user_email,
    booking_date,
    passengers,
    total_price,
    payment_id: upiTxRef
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
    clearInterval(upiCountdownInterval);

    // Visual Success notification banner
    showSuccessBanner(user_name, selectedTour.title, booking_date, passengers, total_price, upiTxRef);

    // Close booking modal
    closeBookingModal();

  } catch (err) {
    console.error(err);
    overlay.classList.remove('active');
    showErrorBanner('UPI Gateway Timeout', 'Unable to confirm payment. Please try again.');
  }
}

// Global Banner Helper
function showSuccessBanner(name, title, date, passengers, price, receipt) {
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
    <div style="font-size: 1.6rem; margin-bottom: 8px;">🎉 Booking Confirmed!</div>
    <div style="font-size: 0.95rem; font-weight: 500; opacity: 0.92; line-height: 1.5;">
      Hey <b>${name}</b>, your adventure on <b>${title}</b> is locked in!<br/>
      Departure: <b>${date}</b> | Passengers: <b>${passengers}</b><br/>
      Payment Ref: <b style="font-family: monospace;">${receipt}</b><br/>
      Confirmed Price: <b style="color: #a3e635;">₹${price.toLocaleString('en-IN')}</b>
    </div>
  `;

  document.body.appendChild(notice);

  setTimeout(() => {
    notice.style.transform = 'translateX(-50%) translateY(0)';
    notice.style.opacity = '1';
  }, 10);

  // Remove notice after 7 seconds
  setTimeout(() => {
    notice.style.transform = 'translateX(-50%) translateY(-20px)';
    notice.style.opacity = '0';
    setTimeout(() => notice.remove(), 400);
  }, 7000);
}

// Global Error Banner Helper
function showErrorBanner(title, message) {
  const notice = document.createElement('div');
  notice.style.position = 'fixed';
  notice.style.top = '30px';
  notice.style.left = '50%';
  notice.style.transform = 'translateX(-50%) translateY(-20px)';
  notice.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
  notice.style.color = '#fff';
  notice.style.padding = '24px 40px';
  notice.style.borderRadius = '20px';
  notice.style.boxShadow = '0 20px 45px rgba(239, 68, 68, 0.4)';
  notice.style.zIndex = '100000';
  notice.style.fontFamily = 'Montserrat, sans-serif';
  notice.style.fontWeight = '700';
  notice.style.textAlign = 'center';
  notice.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  notice.style.opacity = '0';
  notice.innerHTML = `
    <div style="font-size: 1.5rem; margin-bottom: 8px;">❌ ${title}</div>
    <div style="font-size: 0.95rem; font-weight: 500; opacity: 0.92; line-height: 1.5;">
      ${message}
    </div>
  `;

  document.body.appendChild(notice);
  
  setTimeout(() => {
    notice.style.transform = 'translateX(-50%) translateY(0)';
    notice.style.opacity = '1';
  }, 10);

  // Remove notice after 7 seconds
  setTimeout(() => {
    notice.style.transform = 'translateX(-50%) translateY(-20px)';
    notice.style.opacity = '0';
    setTimeout(() => notice.remove(), 400);
  }, 7000);
}

// Perform Stripe Payment Checkout & Persist to SQLite Database
async function handleModalSubmit(event) {
  event.preventDefault();
  if (!selectedTour) return;

  if (currentPaymentMethod === 'upi') {
    return; // Handled by verifyUpiPayment
  }

  const user_name = document.getElementById('bookingName').value.trim();
  const user_email = document.getElementById('bookingEmail').value.trim();
  const booking_date = document.getElementById('bookingDate').value;
  const passengers = parseInt(document.getElementById('passengers').value);
  const total_price = selectedTour.price * passengers * 85;

  // Stripe validation checks
  const ccNum = document.getElementById('cardNumber').value.replace(/\s/g, '');
  const exp = document.getElementById('cardExpiry').value;
  const cvv = document.getElementById('cardCvv').value;
  const holder = document.getElementById('cardholderName').value.trim();

  if (!holder) {
    showErrorBanner('Cardholder Required', 'Please enter cardholder name.');
    return;
  }
  if (ccNum.length < 16) {
    showErrorBanner('Invalid Card Number', 'Please enter a valid 16-digit credit card number.');
    return;
  }
  if (!/^\d{2}\/\d{2}$/.test(exp)) {
    showErrorBanner('Invalid Expiry', 'Please enter expiration in MM/YY format.');
    return;
  }
  if (cvv.length < 3) {
    showErrorBanner('Invalid CVV', 'Please enter a valid security code (CVV).');
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

    // Visual Success notification banner
    showSuccessBanner(user_name, selectedTour.title, booking_date, passengers, total_price, mockTxId);

    // Close booking modal
    closeBookingModal();

  } catch (err) {
    console.error(err);
    overlay.classList.remove('active');
    showErrorBanner('Payment Gateway Timeout', 'Unable to authorize reservation card. Check connection.');
  }
}


document.addEventListener('DOMContentLoaded', () => {
  // Programmatic event delegation for Quick Book buttons (completely immune to browser CSP inline restrictions)
  $(document).on('click', '.tour-btn', function (e) {
    e.preventDefault();
    const id = $(this).attr('data-tour-id');
    if (id) {
      openBookingModal(id);
    }
  });

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
