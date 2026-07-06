import React from 'react'

export default function Contact() {
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    subject: '',
    country: 'India',
    remarks: ''
  })
  
  const [errors, setErrors] = React.useState({})
  const [overlayStatus, setOverlayStatus] = React.useState(null) // null, 'sending', 'success'

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Please enter your name'
    if (!form.email.trim()) {
      errs.email = 'Please enter your email address'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address'
    }
    if (!form.subject.trim()) errs.subject = 'Please enter a subject'
    if (!form.remarks.trim()) errs.remarks = 'Please enter your message'
    
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setOverlayStatus('sending')

    const formData = {
      name: form.name,
      email: form.email,
      subject: form.subject,
      country: form.country,
      message: form.remarks,
      _subject: `ADVENTURE Tourism - New Contact from ${form.name}`,
      _honey: ''
    }

    try {
      const response = await fetch('https://formsubmit.co/ajax/meankush2803@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      if (!response.ok) throw new Error('Form submission network error')
      
      setOverlayStatus('success')
      // Reset form
      setForm({ name: '', email: '', subject: '', country: 'India', remarks: '' })
    } catch (error) {
      console.error(error)
      setOverlayStatus(null)
      alert('Something went wrong. Please check your connection and try again.')
    }
  }

  return (
    <div className="contact-page-container">
      {/* Background Blobs */}
      <div className="bg-blobs">
        <div className="blob blob-pink"></div>
        <div className="blob blob-blue"></div>
      </div>

      <main className="contact-section">
        <div className="contact-container">
          <div className="contact-header">
            <h1>Contact Us</h1>
            <p>Have questions or planning your next getaway? Reach out and our travel experts will help you craft the perfect adventure.</p>
          </div>

          <div className="contact-card-wrapper">
            {/* Left Column: Info Card */}
            <div className="contact-info-panel">
              <div>
                <h2>Connect With Us</h2>
                <p className="intro">Prefer a direct line or want to see us on a map? Feel free to reach out via any of these channels.</p>
                
                <div className="info-items">
                  <div className="info-item">
                    <div className="info-icon">
                      <i className="fa fa-envelope"></i>
                    </div>
                    <div className="info-details">
                      <span class="info-label">Email Address</span>
                      <a href="mailto:meankush2803@gmail.com">meankush2803@gmail.com</a>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">
                      <i className="fa fa-phone"></i>
                    </div>
                    <div className="info-details">
                      <span class="info-label">Phone Line</span>
                      <a href="tel:+916006816043">+91 6006816043</a>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">
                      <i className="fa fa-map-marker"></i>
                    </div>
                    <div className="info-details">
                      <span class="info-label">Our Headquarters</span>
                      <a href="https://www.google.com/maps/search/?api=1&query=Sector+21C+Faridabad+Haryana" target="_blank" rel="noopener noreferrer">Sector 21C Faridabad, Haryana</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Form Panel */}
            <div className="contact-form-panel">
              {overlayStatus !== null && (
                <div className="form-overlay active">
                  {overlayStatus === 'sending' && (
                    <div className="spinner-container">
                      <div className="custom-spinner"></div>
                      <span className="spinner-text">Sending message, please wait...</span>
                    </div>
                  )}

                  {overlayStatus === 'success' && (
                    <div className="success-card" style={{ display: 'flex' }}>
                      <div className="success-icon-wrapper">
                        <i className="fa fa-check"></i>
                      </div>
                      <h2>Message Sent!</h2>
                      <p>Thank you! Your travel enquiry was successfully sent. Our tour planners will get back to you shortly.</p>
                      <div className="alert-box">
                        <i className="fa fa-info-circle"></i> &nbsp;<strong>First-time submission?</strong> Please check your inbox to confirm and activate this form so we can receive your message!
                      </div>
                      <button onClick={() => setOverlayStatus(null)} className="ctn" style={{ marginTop: '20px', border: 'none', cursor: 'pointer' }}>Send Another Message</button>
                    </div>
                  )}
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleSubmit} noValidate>
                <h2 style={{ fontFamily: 'var(--ff-montserrat)', marginBottom: '30px', fontWeight: 700 }}>Send Us A Message</h2>
                
                <div className="form-group-row">
                  <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
                    <label className="form-field-label">Your Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    {errors.name && <div className="validation-error-msg">{errors.name}</div>}
                  </div>

                  <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                    <label className="form-field-label">Your Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    {errors.email && <div className="validation-error-msg">{errors.email}</div>}
                  </div>
                </div>

                <div className="form-group-row">
                  <div className={`form-group ${errors.subject ? 'has-error' : ''}`}>
                    <label className="form-field-label">Subject / Travel Area</label>
                    <input
                      type="text"
                      placeholder="e.g., Trip to Andaman"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                    {errors.subject && <div className="validation-error-msg">{errors.subject}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-field-label">Country</label>
                    <select
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    >
                      <option value="India">India</option>
                      <option value="Russia">Russia</option>
                      <option value="usa">USA</option>
                      <option value="Japan">Japan</option>
                      <option value="France">France</option>
                      <option value="Brazil">Brazil</option>
                    </select>
                  </div>
                </div>

                <div className={`form-group full-width ${errors.remarks ? 'has-error' : ''}`}>
                  <label className="form-field-label">Your Message / Plan Details</label>
                  <textarea
                    placeholder="Tell us about your dream trip..."
                    style={{ height: '150px' }}
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  ></textarea>
                  {errors.remarks && <div className="validation-error-msg">{errors.remarks}</div>}
                </div>

                <button type="submit" className="btn-submit-premium">
                  <span>Send Message</span>
                  <i className="fa fa-paper-plane" style={{ fontSize: '16px' }}></i>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
