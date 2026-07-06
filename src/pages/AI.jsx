import React from 'react'

export default function AI() {
  const [activeTab, setActiveTab] = React.useState('planner') // 'planner', 'chat', 'recommend', 'guide'

  React.useEffect(() => {
    document.body.classList.add('ai-page')
    return () => document.body.classList.remove('ai-page')
  }, [])

  return (
    <div className="ai-page ai-page-container">
      {/* Background Blobs */}
      <div className="bg-blobs">
        <div className="blob blob-pink"></div>
        <div className="blob blob-blue"></div>
      </div>

      <main className="form-section">
        <div className="container">
          <div className="title">
            <h1>Smart Travel Assistant</h1>
            <div className="line"></div>
          </div>

          <div id="ai-root">
            <div className="ai-tabs">
              <button
                className={`ai-tab ${activeTab === 'planner' ? 'active' : ''}`}
                onClick={() => setActiveTab('planner')}
              >
                Trip Planner
              </button>
              <button
                className={`ai-tab ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Chatbot
              </button>
              <button
                className={`ai-tab ${activeTab === 'recommend' ? 'active' : ''}`}
                onClick={() => setActiveTab('recommend')}
              >
                Recommendations
              </button>
              <button
                className={`ai-tab ${activeTab === 'guide' ? 'active' : ''}`}
                onClick={() => setActiveTab('guide')}
              >
                Destination Guide
              </button>
            </div>

            <div id="ai-content" style={{ marginTop: '25px' }}>
              {activeTab === 'planner' && <TripPlanner />}
              {activeTab === 'chat' && <Chatbot />}
              {activeTab === 'recommend' && <Recommendations />}
              {activeTab === 'guide' && <Guide />}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ==================== Helper Functions for AI Page ====================

function cleanAndParseJson(data) {
  if (!data) return null
  if (typeof data === 'object') {
    if (Array.isArray(data)) return data
    if (data.text && typeof data.text === 'string') {
      const parsedText = parseJsonFromString(data.text)
      if (parsedText) return parsedText
    }
    if (data.itinerary || data.best_time || data.famous_food || data.destination) {
      return data
    }
  }
  if (typeof data === 'string') {
    return parseJsonFromString(data)
  }
  return data
}

function parseJsonFromString(str) {
  if (!str || typeof str !== 'string') return null
  const trimmed = str.trim()
  try {
    return JSON.parse(trimmed)
  } catch (e) {}

  let cleaned = trimmed
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/i, '').trim()
    cleaned = cleaned.replace(/```$/, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch (e) {}
  }

  const firstBrace = cleaned.search(/[\[{]/)
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    for (let end = lastBrace; end > firstBrace; end--) {
      const candidate = cleaned.slice(firstBrace, end + 1)
      try {
        return JSON.parse(candidate)
      } catch (e) {}
    }
  }
  return null
}

function formatMarkdown(text) {
  if (!text) return ''
  const lines = text.split('\n')
  let inList = false
  let html = ''

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (line.startsWith('###')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h3 style="color:#ff2a81; font-family:var(--ff-montserrat); margin:20px 0 10px 0; font-weight:700;">${line.replace(/^###\s*/, '')}</h3>`
      continue
    }
    if (line.startsWith('##')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h2 style="color:#fff; font-family:var(--ff-montserrat); margin:25px 0 12px 0; font-weight:800; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">${line.replace(/^##\s*/, '')}</h2>`
      continue
    }
    if (line.startsWith('#')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h1 style="color:#fff; font-family:var(--ff-montserrat); margin:30px 0 15px 0; font-weight:800;">${line.replace(/^#\s*/, '')}</h1>`
      continue
    }
    if (line.startsWith('*') || line.startsWith('-')) {
      if (!inList) { html += '<ul style="list-style-type:disc; padding-left:20px; margin-bottom:15px; color:#e2e8f0;">'; inList = true; }
      let content = line.replace(/^[\*\-]\s*/, '')
      content = content.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#ff2a81;">$1</strong>')
      html += `<li style="margin-bottom:8px; line-height:1.65;">${content}</li>`
      continue
    }
    if (inList && line === '') {
      html += '</ul>'
      inList = false
      continue
    }
    if (line !== '') {
      if (inList) { html += '</ul>'; inList = false; }
      let content = line.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#ff2a81;">$1</strong>')
      html += `<p style="margin-bottom:12px; line-height:1.7; color:#e2e8f0;">${content}</p>`
    }
  }
  if (inList) html += '</ul>'
  return html
}

// ==================== Page 1: Trip Planner Component ====================

function TripPlanner() {
  const [dest, setDest] = React.useState('')
  const [start, setStart] = React.useState('')
  const [budget, setBudget] = React.useState('')
  const [days, setDays] = React.useState(3)
  const [type, setType] = React.useState('solo')
  
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: dest, startCity: start, budget, days, travelType: type })
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'AI error')

      const d = cleanAndParseJson(json.data)
      setResult(d || json.data)
    } catch (err) {
      console.error(err)
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="ai-glass-panel cform">
        <div className="crow-in">
          <input
            placeholder="Destination (e.g., Kashmir)"
            required
            value={dest}
            onChange={(e) => setFormVal(e.target.value, setDest)}
          />
          <input
            placeholder="Starting City"
            value={start}
            onChange={(e) => setFormVal(e.target.value, setStart)}
          />
        </div>
        <div className="crow-in">
          <input
            placeholder="Max Budget (e.g., 20000)"
            value={budget}
            onChange={(e) => setFormVal(e.target.value, setBudget)}
          />
          <input
            type="number"
            min="1"
            placeholder="Duration (Days)"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </div>
        <div className="crow">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="solo">Solo Adventure</option>
            <option value="family">Family Trip</option>
            <option value="friends">Friends Trip</option>
            <option value="couple">Couple Getaway</option>
          </select>
        </div>
        <div className="crow-s">
          <button type="submit" className="ctn" style={{ border: 'none', cursor: 'pointer' }}>Generate Plan</button>
        </div>
      </form>

      <div id="planner-result" style={{ marginTop: '18px', gridColumn: '1 / -1', width: '100%' }}>
        {loading && <div className="ai-loading-pulse">Creating your personalized travel itinerary...</div>}
        
        {result && !loading && (
          <div style={{ width: '100%' }}>
            {result.error ? (
              <div style={{ color: '#ff2a81', padding: '12px', background: 'rgba(255,42,129,0.05)', borderRadius: '6px' }}>
                Error: {result.error}
              </div>
            ) : result.text ? (
              <>
                <div className="guide-header-banner">
                  <div className="guide-header-title">🗺 {result.title || 'Your Personalized Travel Itinerary'}</div>
                </div>
                <div className="ai-glass-panel" style={{ marginTop: '20px', textAlign: 'left', color: '#fff', width: '100%', boxSizing: 'border-box' }} dangerouslySetInnerHTML={{ __html: formatMarkdown(result.text) }}></div>
              </>
            ) : (
              <>
                <div className="guide-header-banner">
                  <div className="guide-header-title">🗺 {result.title || 'Your Personalized Travel Itinerary'}</div>
                </div>
                {/* Construct Timelines per day */}
                {(() => {
                  const byDay = {}
                  ;(result.itinerary || []).forEach(it => {
                    const k = it.day || 1
                    if (!byDay[k]) byDay[k] = []
                    byDay[k].push(it)
                  })
                  
                  return Object.keys(byDay).sort((a,b)=>a-b).map(day => (
                    <div key={day} style={{ width: '100%' }}>
                      <div className="itinerary-day-hdr">
                        <span>📅</span> Day {day}
                      </div>
                      <div className="timeline-container">
                        {byDay[day].map((it, idx) => (
                          <div key={idx} className="timeline-item">
                            <div className="timeline-node"></div>
                            <div className="timeline-content">
                              <div className="timeline-time">{it.time}</div>
                              <div className="timeline-activity">{it.activity}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}

                {/* Modular Detail Cards */}
                <div className="itinerary-day-hdr" style={{ marginTop: '40px' }}>
                  <span>📋</span> Additional Planning Details
                </div>
                <div className="guide-dashboard">
                  {result.estimated_budget && (
                    <div className="guide-card expenses">
                      <div className="guide-card-hdr"><span className="guide-card-icon">💳</span> Budget Estimate</div>
                      <div className="guide-card-content">{String(result.estimated_budget)}</div>
                    </div>
                  )}
                  {result.hotels && (
                    <div className="guide-card transport">
                      <div className="guide-card-hdr"><span className="guide-card-icon">🏨</span> Hotels & Lodging</div>
                      <div className="guide-card-content">{Array.isArray(result.hotels) ? result.hotels.join(', ') : result.hotels}</div>
                    </div>
                  )}
                  {result.food && (
                    <div className="guide-card food">
                      <div className="guide-card-hdr"><span className="guide-card-icon">🍽</span> Recommended Food</div>
                      <div className="guide-card-content">{Array.isArray(result.food) ? result.food.join(', ') : result.food}</div>
                    </div>
                  )}
                  {result.tips && (
                    <div className="guide-card safety">
                      <div className="guide-card-hdr"><span className="guide-card-icon">💡</span> Travel Smart Tips</div>
                      <div className="guide-card-content">{Array.isArray(result.tips) ? result.tips.join(', ') : result.tips}</div>
                    </div>
                  )}
                  {result.places && (
                    <div className="guide-card best-time">
                      <div className="guide-card-hdr"><span className="guide-card-icon">📍</span> Key Attractions</div>
                      <div className="guide-card-content">{Array.isArray(result.places) ? result.places.join(', ') : result.places}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function setFormVal(val, setter) {
  setter(val)
}

// ==================== Page 2: Chatbot Component ====================

function Chatbot() {
  const [sessions, setSessions] = React.useState([])
  const [activeSessionId, setActiveSessionId] = React.useState('')
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Load chat sessions from localStorage on mount, migrating old single history if present
  React.useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('ai_chat_sessions')
      const savedActiveId = localStorage.getItem('ai_active_session_id')
      let parsedSessions = savedSessions ? JSON.parse(savedSessions) : []

      const welcomeMessage = {
        role: 'assistant',
        content: '👋 Hello! I am your Adventure AI Assistant. How can I help you plan your next perfect trip today?'
      }

      if (parsedSessions.length === 0) {
        // Check for old legacy history format to migrate it
        const oldHistory = localStorage.getItem('ai_chat_history')
        let migratedMessages = [welcomeMessage]
        if (oldHistory) {
          try {
            migratedMessages = JSON.parse(oldHistory)
          } catch (err) {
            console.error('Failed to parse legacy history:', err)
          }
        }

        const defaultId = 'chat_' + Date.now()
        parsedSessions = [{
          id: defaultId,
          title: oldHistory ? 'Restored Chat' : 'New Chat',
          messages: migratedMessages,
          updatedAt: Date.now()
        }]
        localStorage.setItem('ai_chat_sessions', JSON.stringify(parsedSessions))
        localStorage.setItem('ai_active_session_id', defaultId)
        setSessions(parsedSessions)
        setActiveSessionId(defaultId)

        // Clean up legacy history key
        localStorage.removeItem('ai_chat_history')
      } else {
        setSessions(parsedSessions)
        const activeExists = parsedSessions.some(s => s.id === savedActiveId)
        const activeId = activeExists ? savedActiveId : parsedSessions[0].id
        setActiveSessionId(activeId)
        localStorage.setItem('ai_active_session_id', activeId)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const activeSession = sessions.find(s => s.id === activeSessionId)
  const messages = activeSession ? activeSession.messages : []

  const updateActiveSessionMessages = (newMsgs) => {
    const updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        let title = s.title
        // Auto-update title from first user message if it's currently generic
        if (title === 'New Chat' || title === 'Restored Chat') {
          const firstUserMsg = newMsgs.find(m => m.role === 'user')
          if (firstUserMsg) {
            title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
          }
        }
        return {
          ...s,
          title,
          messages: newMsgs,
          updatedAt: Date.now()
        }
      }
      return s
    })
    setSessions(updatedSessions)
    localStorage.setItem('ai_chat_sessions', JSON.stringify(updatedSessions))
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const newMsgs = [...messages, { role: 'user', content: text }]
    updateActiveSessionMessages(newMsgs)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'AI error')

      const assistantText = json.reply || (json.data && (json.data.text || json.data.reply)) || json.response || json.message || ''
      updateActiveSessionMessages([...newMsgs, { role: 'assistant', content: assistantText }])
    } catch (err) {
      updateActiveSessionMessages([...newMsgs, { role: 'assistant', content: 'Error: ' + err.message }])
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    const welcomeMessage = {
      role: 'assistant',
      content: '👋 Hello! I am your Adventure AI Assistant. How can I help you plan your next perfect trip today?'
    }
    const newId = 'chat_' + Date.now()
    const newSession = {
      id: newId,
      title: 'New Chat',
      messages: [welcomeMessage],
      updatedAt: Date.now()
    }
    const updated = [newSession, ...sessions]
    setSessions(updated)
    setActiveSessionId(newId)
    localStorage.setItem('ai_chat_sessions', JSON.stringify(updated))
    localStorage.setItem('ai_active_session_id', newId)
    setSidebarOpen(false) // auto close sidebar on mobile when creating chat
  }

  const handleDeleteSession = (e, idToDelete) => {
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this chat session?')) {
      return
    }

    const updated = sessions.filter(s => s.id !== idToDelete)

    if (updated.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: '👋 Hello! I am your Adventure AI Assistant. How can I help you plan your next perfect trip today?'
      }
      const newId = 'chat_' + Date.now()
      const newSession = {
        id: newId,
        title: 'New Chat',
        messages: [welcomeMessage],
        updatedAt: Date.now()
      }
      const finalSessions = [newSession]
      setSessions(finalSessions)
      setActiveSessionId(newId)
      localStorage.setItem('ai_chat_sessions', JSON.stringify(finalSessions))
      localStorage.setItem('ai_active_session_id', newId)
    } else {
      setSessions(updated)
      localStorage.setItem('ai_chat_sessions', JSON.stringify(updated))
      if (activeSessionId === idToDelete) {
        const nextActiveId = updated[0].id
        setActiveSessionId(nextActiveId)
        localStorage.setItem('ai_active_session_id', nextActiveId)
      }
    }
  }

  const handleClearActiveChat = () => {
    if (confirm('Are you sure you want to clear the message history of this chat?')) {
      const welcome = [{
        role: 'assistant',
        content: '👋 Chat history cleared. How can I help you plan your next travel adventure?'
      }]
      updateActiveSessionMessages(welcome)
    }
  }

  const handleSelectSession = (id) => {
    setActiveSessionId(id)
    localStorage.setItem('ai_active_session_id', id)
    setSidebarOpen(false) // auto close sidebar on mobile
  }

  const chatBoxRef = React.useRef(null)

  React.useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages, loading])

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-title">
          <span className="chat-status-dot"></span>
          Adventure AI Assistant
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle-btn">
            {sidebarOpen ? 'Hide History' : 'Show History'}
          </button>
          <button onClick={handleClearActiveChat} className="chat-clear-btn">
            Clear Chat
          </button>
        </div>
      </div>

      <div className="chat-layout">
        {/* Collapsible Chat History Sidebar */}
        <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <button onClick={handleNewChat} className="new-chat-btn">
            <span>+</span> New Chat
          </button>
          <div className="chat-sessions-list">
            {sessions.map(s => (
              <div
                key={s.id}
                className={`chat-session-item ${s.id === activeSessionId ? 'active' : ''}`}
                onClick={() => handleSelectSession(s.id)}
              >
                <div className="chat-session-content">
                  <span style={{ fontSize: '1.1rem' }}>💬</span>
                  <span className="chat-session-title" title={s.title}>{s.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  className="delete-session-btn"
                  title="Delete Session"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Active Chat Area */}
        <div className="chat-main">
          <div id="chat-box" ref={chatBoxRef} className="chat-messages" style={{ display: 'flex', flexDirection: 'column' }}>
            {messages.map((m, idx) => {
              const isUser = m.role === 'user'
              const bubbleText = formatMarkdown(m.content)

              return (
                <div key={idx} className={`chat-msg-row ${isUser ? 'user-row' : 'assistant-row'}`}>
                  <div className="chat-msg-bubble" dangerouslySetInnerHTML={{ __html: bubbleText }}></div>
                </div>
              )
            })}

            {loading && (
              <div className="chat-msg-row assistant-row">
                <div className="chat-msg-bubble">
                  <div className="typing-indicator">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <input
              className="chat-input-field"
              placeholder="Ask travel questions or type 'help'..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="chat-send-btn" title="Send Message">
              <svg viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Page 3: Recommendations Component ====================

function Recommendations() {
  const [country, setCountry] = React.useState('')
  const [prefs, setPrefs] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState(null)

  const handleChipClick = (val) => {
    setPrefs(val)
  }

  const handleRun = async () => {
    if (!country.trim()) {
      alert('Please enter a country to receive tailored recommendations!')
      return
    }
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs, country: country })
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'AI error')

      const d = cleanAndParseJson(json.data)
      setResult(d || json.data)
    } catch (err) {
      console.error(err)
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const chips = [
    { label: '🏖 Beach', val: 'Beach getaway' },
    { label: '🏔 Mountain', val: 'Mountain and trekking' },
    { label: '🌲 Adventure', val: 'Adventure activities' },
    { label: '🏯 Culture', val: 'Historical and culture' },
    { label: '👪 Family', val: 'Family friendly sightseeing' },
    { label: '💑 Romantic', val: 'Romantic couple getaways' }
  ]

  return (
    <div className="ai-glass-panel cform">
      <label style={{ color: '#ddd', fontFamily: 'var(--ff-montserrat)', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Select Category Tag:</label>
      <div className="pref-chips-wrapper">
        {chips.map((c, idx) => (
          <div
            key={idx}
            className={`pref-chip ${prefs === c.val ? 'active' : ''}`}
            onClick={() => handleChipClick(c.val)}
          >
            {c.label}
          </div>
        ))}
      </div>
      <div className="crow-in" style={{ marginTop: '12px' }}>
        <input
          placeholder="Enter Country (e.g., India, Japan, France)"
          style={{ width: '50%' }}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <input
          placeholder="Preferences (or pick a filter chip above)"
          style={{ width: '50%' }}
          value={prefs}
          onChange={(e) => setPrefs(e.target.value)}
        />
      </div>
      <div className="crow-s">
        <button onClick={handleRun} className="ctn" style={{ border: 'none', cursor: 'pointer' }}>Get Recommendations</button>
      </div>

      <div id="rec-result" style={{ marginTop: '18px' }}>
        {loading && <div className="ai-loading-pulse">Searching premium travel spots in {country} that match your vibe...</div>}
        
        {result && !loading && (
          <div>
            {result.error ? (
              <div style={{ color: '#ff2a81', padding: '12px', background: 'rgba(255,42,129,0.05)', borderRadius: '6px' }}>
                Error: {result.error}
              </div>
            ) : Array.isArray(result) ? (
              <div className="rec-grid">
                {result.map((item, idx) => (
                  <div key={idx} className="rec-card">
                    <div className="rec-card-header">
                      <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      {item.destination}
                    </div>
                    <div className="rec-card-body">
                      {item.reason || item.description || 'Excellent travel spot matching your travel criteria.'}
                    </div>
                    <div className="rec-card-action">Explore Destination</div>
                  </div>
                ))}
              </div>
            ) : result.text ? (
              <>
                <div className="guide-header-banner">
                  <div className="guide-header-title">🧭 Travel Recommendations for <span>{country}</span></div>
                </div>
                <div className="ai-glass-panel" style={{ marginTop: '20px', textAlign: 'left', color: '#fff' }} dangerouslySetInnerHTML={{ __html: formatMarkdown(result.text) }}></div>
              </>
            ) : (
              <div className="ai-card">
                <pre style={{ color: '#fff' }}>{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== Page 4: Destination Guide Component ====================

function Guide() {
  const [dest, setDest] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState(null)

  const handleRun = async () => {
    if (!dest.trim()) {
      alert('Please enter a destination to receive the brochure guide!')
      return
    }
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/ai/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: dest })
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'AI error')

      const d = cleanAndParseJson(json.data)
      setResult(d || json.data)
    } catch (err) {
      console.error(err)
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-glass-panel cform">
      <div className="crow">
        <input
          placeholder="Enter Destination (e.g., Kashmir, Goa, Paris)"
          value={dest}
          onChange={(e) => setDest(e.target.value)}
        />
      </div>
      <div className="crow-s">
        <button onClick={handleRun} className="ctn" style={{ border: 'none', cursor: 'pointer' }}>Get Guide</button>
      </div>

      <div id="guide-result" style={{ marginTop: '18px' }}>
        {loading && <div className="ai-loading-pulse">Assembling scannable travel guide cards...</div>}
        
        {result && !loading && (
          <div>
            {result.error ? (
              <div style={{ color: '#ff2a81', padding: '12px', background: 'rgba(255,42,129,0.05)', borderRadius: '6px' }}>
                Error: {result.error}
              </div>
            ) : result.text ? (
              <>
                <div className="guide-header-banner">
                  <div className="guide-header-title">🌍 Travel Brochure for <span>{dest}</span></div>
                </div>
                <div className="ai-glass-panel" style={{ marginTop: '20px', textAlign: 'left', color: '#fff' }} dangerouslySetInnerHTML={{ __html: formatMarkdown(result.text) }}></div>
              </>
            ) : (
              <>
                <div className="guide-header-banner">
                  <div className="guide-header-title">🌍 Travel Brochure for <span>{dest}</span></div>
                </div>
                <div className="guide-dashboard">
                  {result.best_time && (
                    <div className="guide-card best-time">
                      <div className="guide-card-hdr"><span className="guide-card-icon">⏰</span> Best Time to Visit</div>
                      <div className="guide-card-content">{result.best_time}</div>
                    </div>
                  )}
                  {result.famous_food && (
                    <div className="guide-card food">
                      <div className="guide-card-hdr"><span className="guide-card-icon">🍽</span> Famous Local Food</div>
                      <div className="guide-card-content">
                        <ul>
                          {(Array.isArray(result.famous_food) ? result.famous_food : [result.famous_food]).map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {result.transport && (
                    <div className="guide-card transport">
                      <div className="guide-card-hdr"><span className="guide-card-icon">🚌</span> Transportation options</div>
                      <div className="guide-card-content">{result.transport}</div>
                    </div>
                  )}
                  {result.safety_tips && (
                    <div className="guide-card safety">
                      <div className="guide-card-hdr"><span className="guide-card-icon">🛡</span> Safety & Local Tips</div>
                      <div className="guide-card-content">
                        <ul>
                          {(Array.isArray(result.safety_tips) ? result.safety_tips : [result.safety_tips]).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {result.estimated_expenses && (
                    <div className="guide-card expenses">
                      <div className="guide-card-hdr"><span className="guide-card-icon">💳</span> Estimated Expenses</div>
                      <div className="guide-card-content">{result.estimated_expenses}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
