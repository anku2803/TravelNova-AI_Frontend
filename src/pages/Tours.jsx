import React from 'react'
import { EVENTS } from '../events-data'

export default function Tours() {
  // Query parameters parsing on load
  const [activeCategory, setActiveCategory] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortBy, setSortBy] = React.useState('default')
  
  // Booking state
  const [selectedTour, setSelectedTour] = React.useState(null)
  const [bookingStep, setBookingStep] = React.useState(1) // 1 or 2
  const [paymentMethod, setPaymentMethod] = React.useState('card') // 'card' or 'upi'
  
  // Step 1 Form inputs
  const [bookingName, setBookingName] = React.useState('')
  const [bookingEmail, setBookingEmail] = React.useState('')
  const [bookingDate, setBookingDate] = React.useState('2026-06-15')
  const [passengers, setPassengers] = React.useState(1)
  
  // Step 2 Card Form inputs
  const [cardName, setCardName] = React.useState('')
  const [cardNumber, setCardNumber] = React.useState('')
  const [cardExpiry, setCardExpiry] = React.useState('')
  const [cardCvv, setCardCvv] = React.useState('')
  const [cardFlipped, setCardFlipped] = React.useState(false)

  // Step 2 UPI Countdown State
  const [upiTxRef, setUpiTxRef] = React.useState('')
  const [upiTimeRemaining, setUpiTimeRemaining] = React.useState(300)
  const [upiExpired, setUpiExpired] = React.useState(false)
  const upiTimerRef = React.useRef(null)

  // Transaction processing overlay state
  const [processingState, setProcessingState] = React.useState({ active: false, text: '' })
  
  // Global Notification Banner states
  const [banner, setBanner] = React.useState({ show: false, type: '', title: '', message: '' })

  // Read URL query params on load
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const catParam = urlParams.get('category')
    if (catParam) {
      setActiveCategory(catParam)
    }
    const passengersParam = urlParams.get('passengers')
    if (passengersParam) {
      const p = parseInt(passengersParam)
      if (!isNaN(p) && p >= 1 && p <= 10) setPassengers(p)
    }
    const idParam = urlParams.get('id')
    if (idParam) {
      const t = EVENTS.find(x => x.id === parseInt(idParam))
      if (t) {
        openBooking(t)
      }
    }
  }, [])

  // Handle UPI countdown timer
  React.useEffect(() => {
    if (selectedTour && paymentMethod === 'upi') {
      setUpiExpired(false)
      setUpiTimeRemaining(300)
      
      // Generate reference ID
      const txRef = 'ADV-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase()
      setUpiTxRef(txRef)

      clearInterval(upiTimerRef.current)
      upiTimerRef.current = setInterval(() => {
        setUpiTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(upiTimerRef.current)
            setUpiExpired(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(upiTimerRef.current)
    }
    return () => clearInterval(upiTimerRef.current)
  }, [selectedTour, paymentMethod])

  // Open booking modal
  const openBooking = (tour) => {
    setSelectedTour(tour)
    setBookingStep(1)
    setPaymentMethod('card')
    setCardName(bookingName.toUpperCase())
    setCardNumber('')
    setCardExpiry('')
    setCardCvv('')
    setCardFlipped(false)
    document.body.style.overflow = 'hidden'
  }

  // Close booking modal
  const closeBooking = () => {
    setSelectedTour(null)
    document.body.style.overflow = ''
    clearInterval(upiTimerRef.current)
  }

  // Show banner alert helper
  const triggerBanner = (type, title, message) => {
    setBanner({ show: true, type, title, message })
    setTimeout(() => {
      setBanner((prev) => ({ ...prev, show: false }))
    }, 7000)
  }

  // Increment passenger calculator
  const changePassengers = (change) => {
    setPassengers((prev) => {
      let val = prev + change
      if (val < 1) val = 1
      if (val > 10) val = 10
      return val
    })
  }

  // Form formats
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    let formatted = ''
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' '
      formatted += value[i]
    }
    setCardNumber(formatted)
  }

  const handleCardExpiryChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/gi, '')
    if (value.length > 2) {
      setCardExpiry(value.slice(0, 2) + '/' + value.slice(2, 4))
    } else {
      setCardExpiry(value)
    }
  }

  // Multi-step form step transition
  const handleStep1Submit = () => {
    if (!bookingName || !bookingEmail || !bookingDate) {
      triggerBanner('error', 'Missing Details', 'Please fill out your Full Name, Email, and select a Date first!')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingEmail)) {
      triggerBanner('error', 'Invalid Email', 'Please enter a valid email address!')
      return
    }
    setCardName(bookingName.toUpperCase())
    setBookingStep(2)
  }

  // Submit Stripe transaction
  const handleCardSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTour) return

    const ccNum = cardNumber.replace(/\s/g, '')
    if (!cardName.trim()) {
      triggerBanner('error', 'Cardholder Required', 'Please enter cardholder name.')
      return
    }
    if (ccNum.length < 16) {
      triggerBanner('error', 'Invalid Card Number', 'Please enter a valid 16-digit credit card number.')
      return
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      triggerBanner('error', 'Invalid Expiry', 'Please enter expiration in MM/YY format.')
      return
    }
    if (cardCvv.length < 3) {
      triggerBanner('error', 'Invalid CVV', 'Please enter a valid security code (CVV).')
      return
    }

    // Launch loader animations
    setProcessingState({ active: true, text: 'Connecting to Stripe Card Gateway...' })
    const steps = [
      'Authorizing Card Credentials...',
      'Capturing Reservation Sum in Escrow...',
      'Updating Travel Database Ledgers...'
    ]
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 650))
      setProcessingState((prev) => ({ ...prev, text: steps[i] }))
    }

    const mockTxId = 'ch_' + Math.random().toString(36).substr(2, 9).toUpperCase()
    const total_price = selectedTour.price * passengers * 85

    const bookingData = {
      tour_id: selectedTour.id,
      tour_title: selectedTour.title,
      user_name: bookingName,
      user_email: bookingEmail,
      booking_date: bookingDate,
      passengers: passengers,
      total_price: total_price,
      payment_id: mockTxId
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })
      if (!res.ok) throw new Error('API server checkout failed')

      setProcessingState({ active: false, text: '' })
      triggerBanner('success', 'Booking Confirmed!', `Hey ${bookingName}, your adventure on ${selectedTour.title} is locked in! Departure: ${bookingDate} | Receipt: ${mockTxId}`)
      closeBooking()
    } catch (err) {
      setProcessingState({ active: false, text: '' })
      triggerBanner('error', 'Payment Gateway Timeout', 'Unable to authorize reservation card. Check connection.')
    }
  }

  // Submit UPI transaction
  const handleUpiVerify = async () => {
    if (!selectedTour) return

    setProcessingState({ active: true, text: 'Connecting to UPI Gateway...' })
    const steps = [
      'Checking VPA adventuretours@paytm...',
      'Querying Transaction Status for ' + upiTxRef + '...',
      'Payment Authenticated via Bank Server...',
      'Updating Travel Database Ledgers...'
    ]
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 650))
      setProcessingState((prev) => ({ ...prev, text: steps[i] }))
    }

    const total_price = selectedTour.price * passengers * 85
    const bookingData = {
      tour_id: selectedTour.id,
      tour_title: selectedTour.title,
      user_name: bookingName,
      user_email: bookingEmail,
      booking_date: bookingDate,
      passengers: passengers,
      total_price: total_price,
      payment_id: upiTxRef
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })
      if (!res.ok) throw new Error('API server checkout failed')

      setProcessingState({ active: false, text: '' })
      triggerBanner('success', 'Booking Confirmed!', `Hey ${bookingName}, your adventure on ${selectedTour.title} is locked in! Departure: ${bookingDate} | Receipt: ${upiTxRef}`)
      closeBooking()
    } catch (err) {
      setProcessingState({ active: false, text: '' })
      triggerBanner('error', 'UPI Gateway Timeout', 'Unable to confirm payment. Please try again.')
    }
  }

  // Filter and sort catalog
  let filtered = EVENTS.filter(e => {
    if (activeCategory === 'All') return true
    return e.category.toLowerCase() === activeCategory.toLowerCase()
  })

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim()
    filtered = filtered.filter(e => {
      return (
        e.title.toLowerCase().includes(q) ||
        e.short.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      )
    })
  }

  if (sortBy === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price)
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price)
  } else if (sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating)
  }

  return (
    <div className="tours-page-container">
      {/* Global Notifications */}
      {banner.show && (
        <div style={{
          position: 'fixed',
          top: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: banner.type === 'success' ? 'linear-gradient(135deg, #22c55e, #15803d)' : 'linear-gradient(135deg, #ef4444, #b91c1c)',
          color: '#fff',
          padding: '24px 40px',
          borderRadius: '20px',
          boxShadow: banner.type === 'success' ? '0 20px 45px rgba(21, 128, 61, 0.4)' : '0 20px 45px rgba(239, 68, 68, 0.4)',
          zIndex: 100000,
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: '700',
          textAlign: 'center',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>
            {banner.type === 'success' ? '🎉 ' : '❌ '}{banner.title}
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: '500', opacity: 0.92, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: banner.message }}></div>
        </div>
      )}

      {/* Ambient backgrounds blobs */}
      <div className="bg-blobs">
        <div className="blob blob-pink"></div>
        <div className="blob blob-blue"></div>
      </div>

      <main className="tours-section">
        <div className="tours-container">
          <div className="tours-header">
            <span className="subtitle">Curated Adventures</span>
            <h1>UPCOMING TOURS & DESTINATIONS</h1>
            <p>Discover expert-guided trips, historic walking pathways, beach excursions, and summit expeditions around the globe.</p>
          </div>

          {/* Catalog Controls */}
          <div className="controls-panel">
            <div className="search-sort-row">
              <div className="search-wrapper">
                <i className="fa fa-search"></i>
                <input
                  type="text"
                  placeholder="Search destinations, tags, routes, countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="sort-wrapper">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="default">Sort by: Relevance</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated & reviews</option>
                </select>
              </div>
            </div>

            <div className="filter-tabs">
              {['All', 'India', 'Adventure', 'Tours', 'Beach', 'Cultural'].map((cat) => (
                <button
                  key={cat}
                  className={`filter-tab ${activeCategory === cat ? 'active' : ''} ${cat === 'India' ? 'filter-india' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'India' ? 'India Specials 🇮🇳' : cat === 'Tours' ? 'Walking Hikes' : cat === 'Adventure' ? 'Adventure Summit' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Render */}
          <div className="tours-grid">
            {filtered.length === 0 ? (
              <div className="tours-empty-state" style={{ gridColumn: 'span 3', textAlign: 'center', padding: '60px 0' }}>
                <i className="fa fa-compass" style={{ fontSize: '3rem', color: '#fc036b', marginBottom: '15px', display: 'block' }}></i>
                <h3>No Adventures Located</h3>
                <p>We couldn't track down any upcoming tours matching your search or filters. Try adjusting your query!</p>
              </div>
            ) : (
              filtered.map(t => {
                const stars = []
                for (let i = 0; i < 5; i++) {
                  stars.push(<i key={i} className={i < t.rating ? 'fa fa-star' : 'fa fa-star-o'}></i>)
                }
                const inrPrice = (t.price * 85).toLocaleString('en-IN')

                return (
                  <article key={t.id} className="tour-card">
                    <div className="tour-image-container">
                      <span className={`tour-badge ${t.category.toLowerCase() === 'india' ? 'badge-india' : ''}`}>
                        {t.category === 'India' ? 'India Special 🇮🇳' : t.category}
                      </span>
                      <span className="tour-price-tag">₹{inrPrice}</span>
                      <img src={t.image} alt={t.title} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' }} />
                    </div>
                    <div className="tour-body">
                      <h3>{t.title}</h3>
                      <p className="short-desc">{t.short}</p>
                      
                      <div className="tour-meta-row">
                        <div className="meta-item">
                          <i className="fa fa-clock-o"></i>
                          <span>{t.duration}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fa fa-line-chart"></i>
                          <span>{t.difficulty}</span>
                        </div>
                        <div className="meta-rating">
                          {stars}
                        </div>
                      </div>

                      <button className="tour-btn" onClick={() => openBooking(t)}>
                        <span>Quick Book</span>
                        <i className="fa fa-arrow-right"></i>
                      </button>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </div>
      </main>

      {/* Interactive Booking Modal Drawer Drawer Overlay */}
      {selectedTour && (
        <div className="booking-modal-overlay active" onClick={(e) => e.target.className.includes('booking-modal-overlay') && closeBooking()}>
          <div className="booking-modal-container">
            <button className="modal-close-btn" onClick={closeBooking}>&times;</button>
            <div className="modal-header-image" style={{ backgroundImage: `url('${selectedTour.image}')` }}>
              <div className="modal-badge-row">
                <span className={`modal-badge ${selectedTour.category.toLowerCase() === 'india' ? 'badge-india' : ''}`}>
                  {selectedTour.category === 'India' ? 'India Special 🇮🇳' : selectedTour.category}
                </span>
              </div>
            </div>
            
            <div className="modal-body-content">
              <h2>{selectedTour.title}</h2>
              <div className="modal-rating-row">
                {(() => {
                  const arr = []
                  for (let i = 0; i < 5; i++) {
                    arr.push(<i key={i} className={i < selectedTour.rating ? 'fa fa-star' : 'fa fa-star-o'}></i>)
                  }
                  return arr
                })()}
              </div>
              <p className="modal-description">{selectedTour.details}</p>
              
              <div className="modal-info-grid">
                <div className="info-cell">
                  <span className="cell-label">Trip Duration</span>
                  <span className="cell-value"><i className="fa fa-clock-o"></i> {selectedTour.duration}</span>
                </div>
                <div className="info-cell">
                  <span className="cell-label">Difficulty Level</span>
                  <span className="cell-value"><i className="fa fa-line-chart"></i> {selectedTour.difficulty}</span>
                </div>
                <div className="info-cell">
                  <span className="cell-label">Starting Price</span>
                  <span className="cell-value price-highlight">₹{(selectedTour.price * 85).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Step Forms */}
              <div className="modal-booking-form">
                {bookingStep === 1 ? (
                  <div className="booking-step active">
                    <h3>1. Secure Your Spot</h3>
                    <div className="form-row-grid">
                      <div className="form-group">
                        <label><i className="fa fa-user"></i> Full Name</label>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={bookingName}
                          onChange={(e) => setBookingName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label><i className="fa fa-envelope"></i> Email Address</label>
                        <input
                          type="email"
                          placeholder="user@example.com"
                          value={bookingEmail}
                          onChange={(e) => setBookingEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-row-grid">
                      <div className="form-group">
                        <label><i className="fa fa-calendar"></i> Select Date</label>
                        <select value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}>
                          <option value="2026-06-15">June 15, 2026 (Recommended)</option>
                          <option value="2026-07-10">July 10, 2026</option>
                          <option value="2026-08-05">August 05, 2026</option>
                          <option value="2026-09-20">September 20, 2026</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label><i className="fa fa-users"></i> Passengers</label>
                        <div className="passenger-counter">
                          <button type="button" className="counter-btn minus" onClick={() => changePassengers(-1)}>-</button>
                          <input type="number" value={passengers} readOnly />
                          <button type="button" className="counter-btn plus" onClick={() => changePassengers(1)}>+</button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="total-price-bar">
                      <span>Estimated Total:</span>
                      <span className="final-total">₹{(selectedTour.price * passengers * 85).toLocaleString('en-IN')}</span>
                    </div>

                    <button type="button" className="modal-submit-btn" onClick={handleStep1Submit}>
                      <span>Proceed to Payment</span>
                      <i className="fa fa-arrow-right"></i>
                    </button>
                  </div>
                ) : (
                  <div className="booking-step active">
                    <div className="step-header">
                      <button type="button" className="back-step-btn" onClick={() => setBookingStep(1)}>
                        <i className="fa fa-chevron-left"></i> Back
                      </button>
                      <h3>2. Payment Gateway</h3>
                    </div>

                    {/* Method Selector Tabs */}
                    <div className="payment-method-tabs">
                      <button
                        type="button"
                        className={`pay-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <i className="fa fa-credit-card"></i> Card Payment
                      </button>
                      <button
                        type="button"
                        className={`pay-tab ${paymentMethod === 'upi' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('upi')}
                      >
                        <i className="fa fa-mobile-phone" style={{ fontSize: '1.25rem' }}></i> UPI Scanner
                      </button>
                    </div>

                    {/* Method A: Credit Card Payment Form */}
                    {paymentMethod === 'card' && (
                      <form onSubmit={handleCardSubmit} className="payment-method-content active">
                        {/* Dynamic 3D Card Preview */}
                        <div className="credit-card-preview-container">
                          <div className={`credit-card-inner ${cardFlipped ? 'flipped' : ''}`}>
                            {/* Front */}
                            <div className="card-front">
                              <div className="card-chip"></div>
                              <div className="card-logo-overlay">
                                <i className={
                                  cardNumber.startsWith('4') ? 'fa fa-cc-visa' :
                                  cardNumber.startsWith('5') ? 'fa fa-cc-mastercard' :
                                  cardNumber.startsWith('3') ? 'fa fa-cc-amex' :
                                  'fa fa-credit-card'
                                }></i>
                              </div>
                              <div className="card-preview-number">
                                {(() => {
                                  let filled = cardNumber.replace(/\s/g, '')
                                  let out = ''
                                  for (let i = 0; i < 16; i++) {
                                    if (i > 0 && i % 4 === 0) out += ' '
                                    out += i < filled.length ? filled[i] : '•'
                                  }
                                  return out
                                })()}
                              </div>
                              <div className="card-meta">
                                <div className="card-holder-section">
                                  <span className="card-lbl">Card Holder</span>
                                  <div className="card-preview-name">{cardName || 'YOUR NAME HERE'}</div>
                                </div>
                                <div className="card-expiry-section">
                                  <span className="card-lbl">Expires</span>
                                  <div className="card-preview-expiry">{cardExpiry || 'MM/YY'}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Back */}
                            <div className="card-back">
                              <div className="card-magnetic-strip"></div>
                              <div className="card-signature-bar">
                                <div className="card-preview-cvv">
                                  {cardCvv ? '•'.repeat(cardCvv.length) : '•••'}
                                </div>
                              </div>
                              <div className="card-back-text">SECURE TRANSACTIONS POWERED BY STRIPE</div>
                            </div>
                          </div>
                        </div>

                        <div className="stripe-header-row">
                          <span className="provider-tag"><i className="fa fa-lock"></i> Secure checkout powered by Stripe</span>
                          <div className="card-logos">
                            <i className="fa fa-cc-visa"></i>
                            <i className="fa fa-cc-mastercard"></i>
                            <i className="fa fa-cc-amex"></i>
                          </div>
                        </div>

                        <div className="form-group full-width">
                          <label><i className="fa fa-user"></i> Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="Name on credit card"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          />
                        </div>

                        <div className="form-group full-width" style={{ position: 'relative' }}>
                          <label><i className="fa fa-credit-card"></i> Card Number</label>
                          <div className="card-input-wrapper">
                            <input
                              type="text"
                              placeholder="4111 2222 3333 4444"
                              maxLength="19"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                            />
                            <i className={`card-brand-icon active ${
                              cardNumber.startsWith('4') ? 'fa fa-cc-visa' :
                              cardNumber.startsWith('5') ? 'fa fa-cc-mastercard' :
                              cardNumber.startsWith('3') ? 'fa fa-cc-amex' :
                              'fa fa-credit-card'
                            }`}></i>
                          </div>
                        </div>

                        <div className="form-row-grid">
                          <div className="form-group">
                            <label><i className="fa fa-calendar"></i> Expiration Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              maxLength="5"
                              value={cardExpiry}
                              onChange={handleCardExpiryChange}
                            />
                          </div>
                          <div className="form-group">
                            <label><i className="fa fa-lock"></i> CVV Code</label>
                            <input
                              type="password"
                              placeholder="123"
                              maxLength="4"
                              value={cardCvv}
                              onFocus={() => setCardFlipped(true)}
                              onBlur={() => setCardFlipped(false)}
                              onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/gi, ''))}
                            />
                          </div>
                        </div>

                        <div className="total-price-bar payment-total-bar">
                          <span>Grand Total to Pay:</span>
                          <span className="final-total">₹{(selectedTour.price * passengers * 85).toLocaleString('en-IN')}</span>
                        </div>

                        <button type="submit" className="modal-submit-btn pay-submit-btn">
                          <span>Pay & Confirm Reservation</span>
                        </button>
                      </form>
                    )}

                    {/* Method B: UPI QR Scanner */}
                    {paymentMethod === 'upi' && (
                      <div className="payment-method-content active">
                        <div className="upi-scanner-container">
                          <span className="upi-timer">
                            {upiExpired ? 'QR Code Expired. Switch tabs to reload.' : `Time Remaining: ${Math.floor(upiTimeRemaining / 60).toString().padStart(2, '0')}:${(upiTimeRemaining % 60).toString().padStart(2, '0')}`}
                          </span>
                          
                          <div className="qr-code-wrapper">
                            <img
                              src="img/upi-scanner.png"
                              alt="Scan to pay via UPI"
                              style={{ opacity: upiExpired ? 0.15 : 1 }}
                              onError={(e) => { e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=adventuretours@paytm&pn=ADVENTURE%20Tours&am=' + (selectedTour.price * passengers * 85) }}
                            />
                            {!upiExpired && <div className="qr-scanner-glow"></div>}
                          </div>
                          
                          <div className="upi-instruction">
                            <h4>Scan QR with BHIM, GPay, PhonePe, or Paytm</h4>
                            <p>Safe and instant transaction directly to our verified merchant account.</p>
                          </div>

                          <div className="upi-details-card">
                            <div className="detail-row">
                              <span className="detail-label">Merchant VPA</span>
                              <span className="detail-val">adventuretours@paytm</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Ref Reference</span>
                              <span className="detail-val">{upiTxRef}</span>
                            </div>
                          </div>

                          <div className="total-price-bar payment-total-bar upi-total-bar" style={{ marginTop: '15px' }}>
                            <span>Grand Total to Pay:</span>
                            <span className="final-total">₹{(selectedTour.price * passengers * 85).toLocaleString('en-IN')}</span>
                          </div>

                          <button
                            type="button"
                            className="modal-submit-btn pay-submit-btn upi-verify-btn"
                            disabled={upiExpired}
                            onClick={handleUpiVerify}
                          >
                            <span>Verify Payment & Confirm Spot</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Loader Screen Overlay */}
      {processingState.active && (
        <div className="payment-processing-overlay active">
          <div className="spinner-container">
            <div className="custom-spinner"></div>
            <span className="spinner-text">{processingState.text}</span>
          </div>
        </div>
      )}
    </div>
  )
}
