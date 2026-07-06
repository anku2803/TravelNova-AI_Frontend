import React from 'react'

export default function Add({ onDone }) {
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    title: '',
    description: ''
  })
  const [status, setStatus] = React.useState({ type: null, text: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: 'sending', text: 'Submitting...' })

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Submit failed')
      }
      
      setStatus({ type: 'success', text: 'Submitted — redirecting to listings.' })
      setForm({ name: '', email: '', title: '', description: '' })
      
      setTimeout(() => {
        if (onDone) onDone()
      }, 900)
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Error submitting. Try again.' })
    }
  }

  return (
    <div className="add-page-container">
      {/* Background Blobs */}
      <div className="bg-blobs">
        <div className="blob blob-pink"></div>
        <div className="blob blob-blue"></div>
      </div>

      <main className="add-listing-section">
        <div className="add-listing-container">
          <div className="add-listing-card">
            
            <div className="add-card-header">
              <div className="add-card-icon"><i className="fa fa-map-pin"></i></div>
              <h2>Propose Destination</h2>
              <p>Share local road trips, weekend treks, or custom schedules with fellow members of our travel club.</p>
            </div>

            <div className="card-separator"></div>

            <form onSubmit={handleSubmit} className="premium-form" autoComplete="off">
              
              <div className="form-row-split">
                {/* Proposer Name */}
                <div className="field-group">
                  <label htmlFor="name"><i className="fa fa-user"></i> Proposer Name</label>
                  <div className="input-icon-wrapper">
                    <input
                      type="text"
                      id="name"
                      placeholder="Enter your name here"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <i className="fa fa-user input-vector-icon"></i>
                  </div>
                </div>

                {/* Billing Email */}
                <div className="field-group">
                  <label htmlFor="email"><i className="fa fa-envelope"></i> Billing Email</label>
                  <div className="input-icon-wrapper">
                    <input
                      type="email"
                      id="email"
                      placeholder="user@example.com"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <i className="fa fa-envelope input-vector-icon"></i>
                  </div>
                </div>
              </div>

              {/* Destination Title */}
              <div className="field-group">
                <label htmlFor="title"><i className="fa fa-map-marker"></i> Destination / Tour Title</label>
                <div className="input-icon-wrapper">
                  <input
                    type="text"
                    id="title"
                    placeholder="Enter Destination Name"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                  <i className="fa fa-map-marker input-vector-icon"></i>
                </div>
              </div>

              {/* Description Details */}
              <div className="field-group">
                <label htmlFor="description"><i className="fa fa-align-left"></i> Proposal Description Details</label>
                <div className="input-icon-wrapper">
                  <textarea
                    id="description"
                    placeholder="Provide a beautiful description detailing itinerary paths, travel seasons, and expected ticket prices..."
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  ></textarea>
                  <i className="fa fa-align-left input-vector-icon textarea-align-icon"></i>
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" className="add-submit-btn">
                <span>Propose Club Destination</span>
                <i className="fa fa-arrow-right"></i>
              </button>

              {/* Feedback status message */}
              {status.type && (
                <div
                  className="feedback-message"
                  style={{
                    color: status.type === 'success' ? '#28a745' : status.type === 'error' ? '#ff2a81' : '#a9a9b8'
                  }}
                >
                  {status.text}
                </div>
              )}

            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
