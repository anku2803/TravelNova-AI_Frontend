// Interactive Events Catalog Handler
let activeCategory = 'All';
let searchQuery = '';
let activeSort = 'default';

function renderEvents() {
  const root = document.getElementById('eventsRoot');
  if (!root) return;
  root.innerHTML = '';

  // 1. Filter by Category
  let filtered = EVENTS.filter(e => {
    if (activeCategory === 'All') return true;
    return e.category.toLowerCase() === activeCategory.toLowerCase();
  });

  // 2. Filter by Search Query (live input matching)
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

  // 4. Render Empty State if no matches found
  if (filtered.length === 0) {
    root.innerHTML = `
      <div class="events-empty-state">
        <i class="fa fa-map-o"></i>
        <h3>No Ventures Found</h3>
        <p>We couldn't find any travel events matching your search or selected filters. Try searching for something else!</p>
      </div>
    `;
    return;
  }

  // 5. Render Cards
  filtered.forEach(e => {
    // Generate star icons for rating display
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      if (i < e.rating) {
        starsHtml += '<i class="fa fa-star"></i>';
      } else {
        starsHtml += '<i class="fa fa-star-o"></i>';
      }
    }

    const card = document.createElement('article');
    card.className = 'event-card';
    card.innerHTML = `
      <div class="event-image-container">
        <span class="event-badge ${e.category.toLowerCase() === 'india' ? 'badge-india' : ''}">${e.category.toLowerCase() === 'india' ? 'India Special 🇮🇳' : e.category}</span>
        <span class="event-price-tag">$${e.price}</span>
        <img src="${e.image}" alt="${e.title}" />
      </div>
      <div class="event-body">
        <h3>${e.title}</h3>
        <p class="short-desc">${e.short}</p>
        
        <div class="event-meta-row">
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

        <a href="event-detail.html?id=${e.id}" class="event-btn">
          <span>All Details</span>
          <i class="fa fa-arrow-right"></i>
        </a>
      </div>
    `;
    root.appendChild(card);
  });
}

// Attach Event Listeners on DOM load
document.addEventListener('DOMContentLoaded', () => {
  renderEvents();

  // Search Input listener
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderEvents();
    });
  }

  // Sort select listener
  const sortBySelect = document.getElementById('sortBy');
  if (sortBySelect) {
    sortBySelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      renderEvents();
    });
  }

  // Category Pills filters listeners
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      // Toggle active states
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      activeCategory = tab.getAttribute('data-category');
      renderEvents();
    });
  });
});
