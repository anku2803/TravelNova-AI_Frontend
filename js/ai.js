// Simple AI assistant frontend for static site
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5000' : 'https://backend-jade-seven-98.vercel.app';
(() => {
  const root = document.getElementById('ai-root');
  if (!root) return;

  const content = document.getElementById('ai-content');
  const tabs = Array.from(document.querySelectorAll('.ai-tab'));
  
  // Load chat history from localStorage
  let messages = [];
  try {
    const saved = localStorage.getItem('ai_chat_history');
    if (saved) {
      messages = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load chat history:', e);
  }

  function saveHistory() {
    try {
      localStorage.setItem('ai_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }

  function setContent(html) { content.innerHTML = html; }

  // Bulletproof client-side parser to extract and parse JSON from AI string/object
  function cleanAndParseJson(data) {
    if (!data) return null;
    
    // If it's already a parsed array or object (and not just {text: ...}), return it
    if (typeof data === 'object') {
      if (Array.isArray(data)) return data;
      // If it is an object, check if it's a wrapper like { text: "..." }
      if (data.text && typeof data.text === 'string') {
        const parsedText = parseJsonFromString(data.text);
        if (parsedText) return parsedText;
      }
      // If it has standard properties we expect, return it
      if (data.itinerary || data.best_time || data.famous_food || data.destination) {
        return data;
      }
    }
    
    if (typeof data === 'string') {
      return parseJsonFromString(data);
    }
    
    return data;
  }

  function parseJsonFromString(str) {
    if (!str || typeof str !== 'string') return null;
    const trimmed = str.trim();
    
    // 1) Direct parse
    try {
      return JSON.parse(trimmed);
    } catch (e) {}
    
    // 2) Try stripping markdown code blocks (```json ... ``` or ``` ... ```)
    let cleaned = trimmed;
    if (cleaned.startsWith('```')) {
      // Remove starting ```json or ```
      cleaned = cleaned.replace(/^```(json)?/i, '').trim();
      // Remove ending ```
      cleaned = cleaned.replace(/```$/, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch (e) {}
    }
    
    // 3) Progressive brace extraction fallback
    const firstBrace = cleaned.search(/[\[{]/);
    const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      for (let end = lastBrace; end > firstBrace; end--) {
        const candidate = cleaned.slice(firstBrace, end + 1);
        try {
          return JSON.parse(candidate);
        } catch (e) {}
      }
    }
    
    return null;
  }

  function formatMarkdown(text) {
    if (!text) return '';
    const lines = text.split('\n');
    let inList = false;
    let html = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Headers: e.g. ### Header
      if (line.startsWith('###')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h3 style="color:#ff2a81; font-family:var(--ff-montserrat); margin:20px 0 10px 0; font-weight:700;">${line.replace(/^###\s*/, '')}</h3>`;
        continue;
      }
      if (line.startsWith('##')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h2 style="color:#fff; font-family:var(--ff-montserrat); margin:25px 0 12px 0; font-weight:800; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">${line.replace(/^##\s*/, '')}</h2>`;
        continue;
      }
      if (line.startsWith('#')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h1 style="color:#fff; font-family:var(--ff-montserrat); margin:30px 0 15px 0; font-weight:800;">${line.replace(/^#\s*/, '')}</h1>`;
        continue;
      }

      // Bullet lists: e.g. * Item or - Item
      if (line.startsWith('*') || line.startsWith('-')) {
        if (!inList) { html += '<ul style="list-style-type:disc; padding-left:20px; margin-bottom:15px; color:#e2e8f0;">'; inList = true; }
        let content = line.replace(/^[\*\-]\s*/, '');
        content = content.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#ff2a81;">$1</strong>');
        html += `<li style="margin-bottom:8px; line-height:1.65;">${content}</li>`;
        continue;
      }

      // Close list if blank line
      if (inList && line === '') {
        html += '</ul>';
        inList = false;
        continue;
      }

      // Paragraphs
      if (line !== '') {
        if (inList) { html += '</ul>'; inList = false; }
        let content = line.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#ff2a81;">$1</strong>');
        html += `<p style="margin-bottom:12px; line-height:1.7; color:#e2e8f0;">${content}</p>`;
      }
    }

    if (inList) {
      html += '</ul>';
    }

    return html;
  }

  function showPlanner() {
    setContent(`
      <form id="planner-form" class="ai-glass-panel cform">
        <div class="crow-in">
          <input id="dest" placeholder="Destination (e.g., Kashmir)" required />
          <input id="start" placeholder="Starting City" />
        </div>
        <div class="crow">
          <input id="budget" placeholder="Max Budget (e.g., 20000)" />
        </div>
        <div class="crow" style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <label for="days" style="color:#ddd;font-family:var(--ff-montserrat);font-weight:600;">Trip Duration:</label>
          <input id="days" type="number" min="1" value="3" style="width:100px;margin-bottom:0;" />
        </div>
        <div class="crow">
          <select id="type">
            <option value="solo">Solo Adventure</option>
            <option value="family">Family Trip</option>
            <option value="friends">Friends Trip</option>
            <option value="couple">Couple Getaway</option>
          </select>
        </div>
        <div class="crow-s"><button type="submit" class="ctn">Generate Plan</button></div>
      </form>
      <div id="planner-result" style="margin-top:18px"></div>
    `);

    document.getElementById('planner-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const dest = document.getElementById('dest').value;
      const start = document.getElementById('start').value;
      const budget = document.getElementById('budget').value;
      const days = Number(document.getElementById('days').value);
      const type = document.getElementById('type').value;
      const resultEl = document.getElementById('planner-result');
      
      resultEl.innerHTML = '<div class="ai-loading-pulse">Creating your personalized travel itinerary...</div>';
      
      try {
        const res = await fetch(`${API_BASE}/api/ai/plan`, { 
          method: 'POST', 
          headers: {'Content-Type':'application/json'}, 
          body: JSON.stringify({ destination: dest, startCity: start, budget, days, travelType: type }) 
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'AI error');
        
        const d = cleanAndParseJson(json.data);
        if (d && typeof d === 'object') {
          // If the parsed object contains only a text fallback, render it beautifully
          if (d.text) {
            let html = `
              <div class="guide-header-banner">
                <div class="guide-header-title">🗺 ${escapeHtml(d.title || 'Your Personalized Travel Itinerary')}</div>
              </div>
              <div class="ai-glass-panel" style="margin-top:20px; text-align: left; color: #fff;">
                ${formatMarkdown(d.text)}
              </div>
            `;
            resultEl.innerHTML = html;
            return;
          }

          // Group itinerary by day
          const byDay = {};
          (d.itinerary || []).forEach(it => {
            const k = it.day || 1;
            if (!byDay[k]) byDay[k] = [];
            byDay[k].push(it);
          });

          let html = `
            <div class="guide-header-banner">
              <div class="guide-header-title">🗺 ${escapeHtml(d.title || 'Your Personalized Travel Itinerary')}</div>
            </div>
          `;

          // Construct Vertical Timelines for each day
          Object.keys(byDay).sort((a,b)=>a-b).forEach(day => {
            html += `
              <div class="itinerary-day-hdr">
                <span>📅</span> Day ${escapeHtml(day)}
              </div>
              <div class="timeline-container">
            `;
            byDay[day].forEach(it => {
              html += `
                <div class="timeline-item">
                  <div class="timeline-node"></div>
                  <div class="timeline-content">
                    <div class="timeline-time">${escapeHtml(it.time)}</div>
                    <div class="timeline-activity">${escapeHtml(it.activity)}</div>
                  </div>
                </div>
              `;
            });
            html += '</div>'; // close timeline-container
          });

          // Add beautiful modular grids for hotels, budget, tips at the bottom
          html += '<div class="itinerary-day-hdr" style="margin-top:40px;"><span>📋</span> Additional Planning Details</div>';
          html += '<div class="guide-dashboard">';
          
          if (d.estimated_budget) {
            html += `
              <div class="guide-card expenses">
                <div class="guide-card-hdr"><span class="guide-card-icon">💳</span> Budget Estimate</div>
                <div class="guide-card-content">${escapeHtml(String(d.estimated_budget))}</div>
              </div>
            `;
          }
          if (d.hotels) {
            html += `
              <div class="guide-card transport">
                <div class="guide-card-hdr"><span class="guide-card-icon">🏨</span> Hotels & Lodging</div>
                <div class="guide-card-content">${escapeHtml(Array.isArray(d.hotels) ? d.hotels.join(', ') : d.hotels)}</div>
              </div>
            `;
          }
          if (d.food) {
            html += `
              <div class="guide-card food">
                <div class="guide-card-hdr"><span class="guide-card-icon">🍽</span> Recommended Food</div>
                <div class="guide-card-content">${escapeHtml(Array.isArray(d.food) ? d.food.join(', ') : d.food)}</div>
              </div>
            `;
          }
          if (d.tips) {
            html += `
              <div class="guide-card safety">
                <div class="guide-card-hdr"><span class="guide-card-icon">💡</span> Travel Smart Tips</div>
                <div class="guide-card-content">${escapeHtml(Array.isArray(d.tips) ? d.tips.join(', ') : d.tips)}</div>
              </div>
            `;
          }
          if (d.places) {
            html += `
              <div class="guide-card best-time">
                <div class="guide-card-hdr"><span class="guide-card-icon">📍</span> Key Attractions</div>
                <div class="guide-card-content">${escapeHtml(Array.isArray(d.places) ? d.places.join(', ') : d.places)}</div>
              </div>
            `;
          }
          
          html += '</div>'; // close guide-dashboard
          resultEl.innerHTML = html;
        } else {
          resultEl.innerHTML = '<pre style="white-space:pre-wrap; background:#ffffff; color:#000000; padding:12px; border-radius:6px;">' + JSON.stringify(json.data, null, 2) + '</pre>';
        }
      } catch (err) { resultEl.textContent = 'Error: ' + err.message; }
    });
  }

  function showChat() {
    setContent(`
      <div class="chat-container">
        <div class="chat-header">
          <div class="chat-header-title">
            <span class="chat-status-dot"></span>
            Adventure AI Assistant
          </div>
          <button id="chat-clear" class="chat-clear-btn">Clear History</button>
        </div>
        <div id="chat-box" class="chat-messages"></div>
        <div class="chat-input-area">
          <input id="chat-input" class="chat-input-field" placeholder="Ask travel questions or type 'help'..." autocomplete="off" />
          <button id="chat-send" class="chat-send-btn" title="Send Message">
            <svg viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `);

    const box = document.getElementById('chat-box');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const clearBtn = document.getElementById('chat-clear');

    // Welcome message if chat history is empty
    if (messages.length === 0) {
      messages.push({
        role: 'assistant',
        content: "👋 Hello! I am your Adventure AI Assistant. How can I help you plan your next perfect trip today?"
      });
      saveHistory();
    }

    renderMessages();

    // Send action
    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      
      messages.push({ role: 'user', content: text });
      saveHistory();
      renderMessages();
      showTypingIndicator();

      try {
        const res = await fetch(`${API_BASE}/api/ai/chat`, { 
          method: 'POST', 
          headers: {'Content-Type':'application/json'}, 
          body: JSON.stringify({ messages }) 
        });
        const json = await res.json();
        removeTypingIndicator();

        if (!res.ok) throw new Error(json.error || 'AI error');
        const assistantText = (json && (json.reply || (json.data && (json.data.text || json.data.reply)) || json.response || json.message)) || '';
        
        messages.push({ role: 'assistant', content: assistantText });
        saveHistory();
        renderMessages();
      } catch (err) {
        removeTypingIndicator();
        messages.push({ role: 'assistant', content: 'Error: ' + err.message });
        saveHistory();
        renderMessages();
      }
    }

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    
    // Support sending when Enter key is pressed
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Clear history action
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your chat history?')) {
        messages = [
          {
            role: 'assistant',
            content: "👋 Chat history cleared. How can I help you plan your next travel adventure?"
          }
        ];
        saveHistory();
        renderMessages();
      }
    });

    function showTypingIndicator() {
      removeTypingIndicator();
      const indicatorHtml = `
        <div id="typing-indicator" class="chat-msg-row assistant-row">
          <div class="chat-msg-bubble">
            <div class="typing-indicator">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        </div>
      `;
      box.insertAdjacentHTML('beforeend', indicatorHtml);
      box.scrollTop = box.scrollHeight;
    }

    function removeTypingIndicator() {
      const indicator = document.getElementById('typing-indicator');
      if (indicator) {
        indicator.remove();
      }
    }

    function renderMessages() {
      box.innerHTML = messages.map(m => {
        const isUser = m.role === 'user';
        const rowClass = isUser ? 'user-row' : 'assistant-row';
        // Convert Markdown bold (**text**) to HTML strong and newlines to <br> for professional rendering
        const formattedContent = m.content
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');

        return `
          <div class="chat-msg-row ${rowClass}">
            <div class="chat-msg-bubble">
              ${formattedContent}
            </div>
          </div>
        `;
      }).join('');
      box.scrollTop = box.scrollHeight;
    }
  }

  function showRecommend() {
    setContent(`
      <div class="ai-glass-panel cform">
        <label style="color:#ddd;font-family:var(--ff-montserrat);font-weight:700;margin-bottom:8px;display:block;">Select Category Tag:</label>
        <div class="pref-chips-wrapper">
          <div class="pref-chip" data-pref="Beach getaway">🏖 Beach</div>
          <div class="pref-chip" data-pref="Mountain and trekking">🏔 Mountain</div>
          <div class="pref-chip" data-pref="Adventure activities">🌲 Adventure</div>
          <div class="pref-chip" data-pref="Historical and culture">🏯 Culture</div>
          <div class="pref-chip" data-pref="Family friendly sightseeing">👪 Family</div>
          <div class="pref-chip" data-pref="Romantic couple getaways">💑 Romantic</div>
        </div>
        <div class="crow-in" style="margin-top:12px;">
          <input id="rec-country" placeholder="Enter Country (e.g., India, Japan, France)" style="width:50%" required />
          <input id="prefs" placeholder="Preferences (or pick a filter chip above)" style="width:50%" />
        </div>
        <div class="crow-s"><button id="rec-run" class="ctn">Get Recommendations</button></div>
        <div id="rec-result" style="margin-top:18px"></div>
      </div>
    `);

    const chips = Array.from(document.querySelectorAll('.pref-chip'));
    const input = document.getElementById('prefs');

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        input.value = chip.dataset.pref;
      });
    });



    document.getElementById('rec-run').addEventListener('click', async () => {
      const prefs = input.value;
      const countryInput = document.getElementById('rec-country');
      const country = countryInput ? countryInput.value.trim() : '';

      if (!country) {
        alert('Please enter a country to receive tailored recommendations!');
        if (countryInput) countryInput.focus();
        return;
      }

      const resEl = document.getElementById('rec-result'); 
      resEl.innerHTML = `<div class="ai-loading-pulse">Searching premium travel spots in ${escapeHtml(country)} that match your vibe...</div>`;
      
      try {
        const res = await fetch(`${API_BASE}/api/ai/recommend`, { 
          method: 'POST', 
          headers: {'Content-Type':'application/json'}, 
          body: JSON.stringify({ preferences: prefs, country: country }) 
        });
        const json = await res.json(); 
        if (!res.ok || !json.ok) throw new Error(json.error || 'AI error');
        
        const d = cleanAndParseJson(json.data);
        if (d && Array.isArray(d)) {
          const cardsHtml = d.map(item => `
            <div class="rec-card">
              <div class="rec-card-header">
                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                ${escapeHtml(item.destination)}
              </div>
              <div class="rec-card-body">
                ${escapeHtml(item.reason || item.description || 'Excellent travel spot matching your travel criteria.')}
              </div>
              <div class="rec-card-action">Explore Destination</div>
            </div>
          `).join('');
          resEl.innerHTML = `<div class="rec-grid">${cardsHtml}</div>`;
        } else if (d && typeof d === 'object') {
          if (d.text) {
            let html = `
              <div class="guide-header-banner">
                <div class="guide-header-title">🧭 Travel Recommendations for <span>${escapeHtml(country)}</span></div>
              </div>
              <div class="ai-glass-panel" style="margin-top:20px; text-align: left; color: #fff;">
                ${formatMarkdown(d.text)}
              </div>
            `;
            resEl.innerHTML = html;
            return;
          }
          resEl.innerHTML = '<div class="ai-card"><pre>' + JSON.stringify(d, null, 2) + '</pre></div>';
        } else {
          resEl.innerHTML = '<pre style="white-space:pre-wrap; background:#ffffff; color:#000000; padding:12px; border-radius:6px;">' + JSON.stringify(json.data, null, 2) + '</pre>';
        }
      } catch (err) { resEl.textContent = 'Error: ' + err.message; }
    });
  }

  function showGuide() {
    setContent(`
      <div class="ai-glass-panel cform">
        <div class="crow"><input id="guide-dest" placeholder="Enter Destination (e.g., Kashmir, Goa, Paris)" /></div>
        <div class="crow-s"><button id="guide-run" class="ctn">Get Guide</button></div>
        <div id="guide-result" style="margin-top:18px"></div>
      </div>
    `);

    document.getElementById('guide-run').addEventListener('click', async () => {
      const dest = document.getElementById('guide-dest').value; 
      const resEl = document.getElementById('guide-result'); 
      
      resEl.innerHTML = '<div class="ai-loading-pulse">Assembling scannable travel guide cards...</div>';
      
      try {
        const res = await fetch(`${API_BASE}/api/ai/guide`, { 
          method: 'POST', 
          headers: {'Content-Type':'application/json'}, 
          body: JSON.stringify({ destination: dest }) 
        });
        const json = await res.json(); 
        if (!res.ok || !json.ok) throw new Error(json.error || 'AI error');
        
        const d = cleanAndParseJson(json.data);
        if (!d) throw new Error('Failed to parse travel guide data');

        if (d.text) {
          let html = `
            <div class="guide-header-banner">
              <div class="guide-header-title">🌍 Travel Brochure for <span>${escapeHtml(dest)}</span></div>
            </div>
            <div class="ai-glass-panel" style="margin-top:20px; text-align: left; color: #fff;">
              ${formatMarkdown(d.text)}
            </div>
          `;
          resEl.innerHTML = html;
          return;
        }

        let html = `
          <div class="guide-header-banner">
            <div class="guide-header-title">🌍 Travel Brochure for <span>${escapeHtml(dest)}</span></div>
          </div>
          <div class="guide-dashboard">
        `;

        if (d.best_time) {
          html += `
            <div class="guide-card best-time">
              <div class="guide-card-hdr"><span class="guide-card-icon">⏰</span> Best Time to Visit</div>
              <div class="guide-card-content">${escapeHtml(d.best_time)}</div>
            </div>
          `;
        }
        if (d.famous_food) {
          const foodList = Array.isArray(d.famous_food) ? d.famous_food : [d.famous_food];
          html += `
            <div class="guide-card food">
              <div class="guide-card-hdr"><span class="guide-card-icon">🍽</span> Famous Local Food</div>
              <div class="guide-card-content">
                <ul>${foodList.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
              </div>
            </div>
          `;
        }
        if (d.transport) {
          html += `
            <div class="guide-card transport">
              <div class="guide-card-hdr"><span class="guide-card-icon">🚌</span> Transportation options</div>
              <div class="guide-card-content">${escapeHtml(d.transport)}</div>
            </div>
          `;
        }
        if (d.safety_tips) {
          const safetyList = Array.isArray(d.safety_tips) ? d.safety_tips : [d.safety_tips];
          html += `
            <div class="guide-card safety">
              <div class="guide-card-hdr"><span class="guide-card-icon">🛡</span> Safety & Local Tips</div>
              <div class="guide-card-content">
                <ul>${safetyList.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
              </div>
            </div>
          `;
        }
        if (d.estimated_expenses) {
          html += `
            <div class="guide-card expenses">
              <div class="guide-card-hdr"><span class="guide-card-icon">💳</span> Estimated Expenses</div>
              <div class="guide-card-content">${escapeHtml(d.estimated_expenses)}</div>
            </div>
          `;
        }

        html += '</div>'; // close guide-dashboard
        resEl.innerHTML = html;
      } catch (err) { resEl.textContent = 'Error: ' + err.message; }
    });
  }

  function activateTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    if (name === 'planner') showPlanner();
    if (name === 'chat') showChat();
    if (name === 'recommend') showRecommend();
    if (name === 'guide') showGuide();
  }

  // Utility: escape HTML
  function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // Render AI data object into element
  function renderAiData(data, el) {
    if (!data) { el.innerHTML = '<div style="background:#ffffff;color:#000;padding:12px;border-radius:6px;">(no result)</div>'; return; }
    if (typeof data === 'string') { el.innerHTML = `<pre style="white-space:pre-wrap; background:#ffffff; color:#000000; padding:12px; border-radius:6px;">${escapeHtml(data)}</pre>`; return; }
    if (Array.isArray(data)) {
      el.innerHTML = '<div style="background:#ffffff;color:#000;padding:12px;border-radius:6px;"><ul>' + data.map(i=>`<li>${escapeHtml(typeof i === 'object' ? JSON.stringify(i, null, 2) : i)}</li>`).join('') + '</ul></div>';
      return;
    }
    // object
    // If itinerary present, render nicely
    if (data.itinerary && Array.isArray(data.itinerary)) {
      const items = data.itinerary.map(it => `<div style="margin-bottom:8px;padding:8px;border-radius:6px;background:#fafafa;color:#000;"><strong>Day ${escapeHtml(it.day)} - ${escapeHtml(it.time)}</strong><div>${escapeHtml(it.activity)}</div></div>`).join('');
      const other = [];
      if (data.estimated_budget) other.push(`<div><strong>Estimated budget:</strong> ${escapeHtml(String(data.estimated_budget))}</div>`);
      if (data.hotels) other.push(`<div><strong>Hotels:</strong> ${escapeHtml(String(data.hotels.join(', ')))} </div>`);
      if (data.food) other.push(`<div><strong>Food:</strong> ${escapeHtml(String(data.food.join(', ')))} </div>`);
      if (data.tips) other.push(`<div><strong>Tips:</strong> ${escapeHtml(String(data.tips.join(', ')))} </div>`);
      if (data.places) other.push(`<div><strong>Places:</strong> ${escapeHtml(String(data.places.join(', ')))} </div>`);
      el.innerHTML = `<div style="background:#ffffff;color:#000;padding:12px;border-radius:6px;">${items}${other.join('')}</div>`;
      return;
    }
    // fallback: pretty JSON
    el.innerHTML = `<pre style="white-space:pre-wrap; background:#ffffff; color:#000000; padding:12px; border-radius:6px;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
  }

  // Render Ai data to small HTML string for chat messages
  function renderAiDataToString(data) {
    if (!data) return '';
    if (typeof data === 'string') return escapeHtml(data);
    if (data.itinerary) return data.itinerary.map(it => `Day ${it.day} ${it.time}: ${it.activity}`).join('<br>');
    return escapeHtml(JSON.stringify(data));
  }

  tabs.forEach(t => t.addEventListener('click', () => activateTab(t.dataset.tab)));
  // default
  activateTab('planner');
})();
