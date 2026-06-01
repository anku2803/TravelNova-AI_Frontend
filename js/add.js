const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5000' : '';
const form = document.getElementById('addForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
  };
  const msg = document.getElementById('msg');
  msg.textContent = 'Submitting...';
  try {
    const res = await fetch(`${API_BASE}/api/listings`, {
      method: 'POST',

      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Submit failed');
    }
    msg.style.color = '#28a745';
    msg.textContent = 'Submitted — redirecting to listings.';
    setTimeout(() => (window.location.href = 'listings.html'), 900);
  } catch (err) {
    msg.style.color = '#ff2a81';
    msg.textContent = 'Error submitting. Try again.';
  }
});
