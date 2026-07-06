import React from 'react'
import { EVENTS } from '../events-data'

export default function Home({ navigate }) {
  // States for About Us slideshow
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const slides = [
    {
      image: 'img/vrindavan.png',
      title: 'Divine Spiritual India',
      desc: 'Experience local devotion in sacred Kashi and Vrindavan temple routes.'
    },
    {
      image: 'img/annapurna.jpg',
      title: 'Untamed Himalayan Summits',
      desc: 'Acclimatize beside roaring suspension bridges and high passes in Annapurna.'
    },
    {
      image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80',
      title: 'Azure Maldives Escapes',
      desc: 'Relax in tropical overwater bungalows floating over turquoise lagoons.'
    }
  ]

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [slides.length])

  // Spotlight mousemove handler
  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    e.currentTarget.style.setProperty('--x', `${x}px`)
    e.currentTarget.style.setProperty('--y', `${y}px`)
  }

  // Floating search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const category = e.target.heroCategory.value
    const passengers = e.target.heroPassengers.value
    const season = e.target.heroSeason.value
    navigate(`/tours?category=${encodeURIComponent(category)}&passengers=${encodeURIComponent(passengers)}&season=${encodeURIComponent(season)}`)
  }

  // Select the 3 preview tours: Ladakh (6), Kyoto (23), Amalfi Coast (16)
  const previewTours = EVENTS.filter(t => [6, 23, 16].includes(t.id))

  return (
    <div className="home-page-container">
      {/* Background blobs */}
      <div className="bg-blobs">
        <div className="blob blob-pink"></div>
        <div className="blob blob-blue"></div>
      </div>

      <header id="home" className="home-header">
        <div className="header-content">
          <h2 id="quote">Explore the colourful World</h2>
          <div className="line"></div>
          <h1>A WONDERFUL GIFT</h1>
          <a
            href="#about"
            className="ctn"
            onClick={(e) => {
              e.preventDefault()
              const aboutSec = document.getElementById('about')
              if (aboutSec) aboutSec.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Learn more
          </a>
        </div>

        {/* Floating Quick-Search Booking Widget */}
        <div className="hero-search-wrapper">
          <form className="hero-search-card" onSubmit={handleSearchSubmit}>
            <div className="search-field-group">
              <label><i className="fa fa-compass"></i> Adventure Category</label>
              <div className="search-input-wrapper">
                <select name="heroCategory" required defaultValue="All">
                  <option value="All">All Categories</option>
                  <option value="India">India Specials 🇮🇳</option>
                  <option value="Adventure">Adventure Summit 🏔️</option>
                  <option value="Tours">Walking Hikes 🥾</option>
                  <option value="Beach">Beach & Ocean 🏖️</option>
                  <option value="Cultural">Cultural Wonders ⛩️</option>
                </select>
                <i className="fa fa-chevron-down select-arrow"></i>
              </div>
            </div>
            <div className="search-field-group">
              <label><i className="fa fa-users"></i> Travelers Size</label>
              <div className="search-input-wrapper">
                <select name="heroPassengers" defaultValue="1">
                  <option value="1">1 Passenger</option>
                  <option value="2">2 Passengers</option>
                  <option value="3">3 Passengers</option>
                  <option value="4">4+ Passengers</option>
                </select>
                <i className="fa fa-chevron-down select-arrow"></i>
              </div>
            </div>
            <div className="search-field-group">
              <label><i className="fa fa-calendar"></i> Target Season</label>
              <div className="search-input-wrapper">
                <select name="heroSeason" defaultValue="autumn">
                  <option value="autumn">Autumn 2026</option>
                  <option value="winter">Winter 2026</option>
                  <option value="spring">Spring 2027</option>
                  <option value="summer">Summer 2027</option>
                </select>
                <i className="fa fa-chevron-down select-arrow"></i>
              </div>
            </div>
            <button type="submit" className="hero-search-btn">
              <i className="fa fa-search"></i> Search Adventures
            </button>
          </form>
        </div>
      </header>

      {/* Events redirect promo */}
      <section className="events" style={{ margin: '80px auto', width: '85%' }}>
        <div style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('img/bg.png')",
          minHeight: '40vh',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div className="explore-content" style={{ margin: 0, textAlign: 'center', maxWidth: '650px', padding: '2rem' }}>
            <h1 style={{ fontSize: '2.8rem', letterSpacing: '0.15rem', color: '#fff' }}>FAMOUS EVENTS</h1>
            <div className="line" style={{ margin: '15px auto 25px auto' }}></div>
            <p style={{
              textAlign: 'center',
              maxWidth: '100%',
              marginBottom: '30px',
              fontSize: '1.1rem',
              lineHeight: 1.6,
              background: 'transparent',
              color: '#eee',
              padding: 0
            }}>
              Discover our newly expanded list of breathtaking trips, scenic walking tours, cultural excursions, and beach scuba packages. Find your next venture.
            </p>
            <button onClick={() => navigate('/tours')} className="ctn" style={{ padding: '15px 40px', fontSize: '1.1rem', cursor: 'pointer', border: 'none' }}>Explore Events Catalog</button>
          </div>
        </div>
      </section>

      {/* Explore Grid Spotlight Section */}
      <section className="explore" id="explore">
        <div className="explore-content">
          <span className="explore-subtitle">Premium Experiences</span>
          <h1>EXPLORE THE WORLD</h1>
          <div className="line"></div>
          <blockquote className="explore-quote">
            “Travel makes one modest. You see what a tiny place you occupy in the world.”
            <cite>– Gustav Flaubert</cite>
          </blockquote>
          
          <div className="explore-grid">
            <div className="explore-card card-frontiers" onMouseMove={handleCardMouseMove}>
              <div className="explore-card-glow"></div>
              <div className="explore-card-icon"><i class="fa fa-compass"></i></div>
              <h3>Untamed Frontiers</h3>
              <p>Summit snowy mountain ranges, traverse freezing glaciers, and conquer high cold passes.</p>
              <div className="explore-card-overlay"></div>
            </div>
            <div className="explore-card card-escapes" onMouseMove={handleCardMouseMove}>
              <div className="explore-card-glow"></div>
              <div className="explore-card-icon"><i class="fa fa-anchor"></i></div>
              <h3>Azure Escapes</h3>
              <p>Sail across turquoise waters, dive inside marine reefs, and relax in luxury overwater bungalows.</p>
              <div className="explore-card-overlay"></div>
            </div>
            <div className="explore-card card-history" onMouseMove={handleCardMouseMove}>
              <div className="explore-card-glow"></div>
              <div className="explore-card-icon"><i class="fa fa-fort-awesome"></i></div>
              <h3>Living History</h3>
              <p>Explore ancient wooden temples, stand before grand pyramids, and immerse in authentic heritage.</p>
              <div className="explore-card-overlay"></div>
            </div>
          </div>
          
          <button onClick={() => navigate('/tours')} className="ctn explore-btn" style={{ cursor: 'pointer', border: 'none' }}>Explore Events Catalog</button>
        </div>
      </section>

      {/* Upcoming Tours Preview Grid */}
      <section className="tours-preview" id="tours">
        <div className="tours-preview-header">
          <div className="header-left">
            <span className="subtitle">Upcoming Adventures</span>
            <h2 className="font-color">UPCOMING TOURS & DESTINATIONS</h2>
            <div className="line line-left"></div>
          </div>
          <button onClick={() => navigate('/tours')} className="ctn secondary-ctn" style={{ cursor: 'pointer', border: 'none' }}>
            View All Tours <i className="fa fa-arrow-right"></i>
          </button>
        </div>

        <div className="tours-preview-grid">
          {previewTours.map(t => {
            // Render stars
            const stars = []
            for (let i = 0; i < 5; i++) {
              stars.push(<i key={i} className={i < t.rating ? 'fa fa-star' : 'fa fa-star-o'}></i>)
            }
            const localPrice = (t.price * 85).toLocaleString('en-IN')

            return (
              <article key={t.id} className="preview-card">
                <div className="preview-img-container">
                  <span className={`preview-badge ${t.category.toLowerCase() === 'india' ? 'badge-india' : ''}`}>
                    {t.category === 'India' ? 'India Special 🇮🇳' : t.category}
                  </span>
                  <span className="preview-price">₹{localPrice}</span>
                  <img src={t.image} alt={t.title} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' }} />
                  <div className="preview-date-badge">
                    <span className="day">{t.id === 6 ? '28' : t.id === 23 ? '01' : '04'}</span>
                    <span className="month">{t.id === 6 ? 'SEP' : 'OCT'}</span>
                  </div>
                </div>
                <div className="preview-card-body">
                  <h3>{t.title}</h3>
                  <p>{t.short}</p>
                  <div className="preview-meta">
                    <span><i className="fa fa-clock-o"></i> {t.duration}</span>
                    <span><i className="fa fa-line-chart"></i> {t.difficulty}</span>
                  </div>
                  <button onClick={() => navigate(`/tours?id=${t.id}`)} className="preview-btn" style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                    <span>Quick Book</span>
                    <i className="fa fa-chevron-right" style={{ float: 'right', marginTop: '3px' }}></i>
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* About Us Narrative and autoplayslider section */}
      <section id="about" className="about-section">
        <div className="title">
          <h1 className="font-color">About Us</h1>
          <div className="line"></div>
        </div>
        
        <div className="portal-container">
          <div className="about-narrative-grid">
            {/* Left Narrative */}
            <div className="about-narrative-left">
              <span className="about-subtitle">Our Legacy & Mission</span>
              <h2>Crafting Extraordinary Expeditions Across The Globe</h2>
              <p>
                Founded in 2022 by travel aficionados, ADVENTURE was born out of a simple, powerful desire: to help curious souls step off the beaten track and unlock the world's most breathtaking natural wonders safely.
              </p>
              
              <div className="about-mission-statement">
                <p>“Our mission is to cultivate deep, authentic connections to nature, local heritage, and communities through meticulously curated global expeditions.”</p>
              </div>
              
              <p>
                Whether you're looking to scale the untamed cold passes of the Indian Himalayas, drift through lush green coconut groves in Kerala backwaters, or relax in a luxury overwater villa in the Maldives, our certified guides and smart AI travel assistants ensure that every step of your journey is seamless, memorable, and safe.
              </p>
              
              {/* Trust Stats */}
              <div className="about-stats-grid">
                <div className="about-stat-mini-card">
                  <div className="about-stat-number">12k+</div>
                  <div className="about-stat-label">Happy Souls</div>
                </div>
                <div className="about-stat-mini-card">
                  <div className="about-stat-number">50+</div>
                  <div className="about-stat-label">Curated Trips</div>
                </div>
                <div className="about-stat-mini-card">
                  <div className="about-stat-number">100%</div>
                  <div className="about-stat-label">Safety Rating</div>
                </div>
              </div>
            </div>

            {/* Right Slideshow */}
            <div className="about-slideshow-col">
              <div className="about-slideshow-container">
                <div className="about-slideshow-dots">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      className={`slideshow-dot ${currentSlide === idx ? 'active' : ''}`}
                      onClick={() => setCurrentSlide(idx)}
                    ></button>
                  ))}
                </div>

                {slides.map((slide, idx) => (
                  <div
                    key={idx}
                    className={`about-slide ${currentSlide === idx ? 'active' : ''}`}
                    style={{ backgroundImage: `url('${slide.image}')` }}
                  >
                    <div className="about-slide-caption">
                      <h4>{slide.title}</h4>
                      <p>{slide.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Redirect Promo */}
      <section className="explore" style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('img/bg2.png')",
        minHeight: '40vh',
        margin: '80px auto',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="explore-content" style={{ margin: 0, textAlign: 'center', maxWidth: '650px', padding: '2rem' }}>
          <h1 style={{ fontSize: '2.8rem', letterSpacing: '0.15rem', color: '#fff' }}>GET IN TOUCH</h1>
          <div className="line" style={{ margin: '15px auto 25px auto' }}></div>
          <p style={{
            textAlign: 'center',
            maxWidth: '100%',
            marginBottom: '30px',
            fontSize: '1.1rem',
            lineHeight: 1.6,
            background: 'transparent',
            color: '#eee',
            padding: 0
          }}>
            Have questions, comments, or planning a trip? Speak to our local experts who will craft the perfect adventure tailored to your desires.
          </p>
          <button onClick={() => navigate('/contact')} className="ctn" style={{ padding: '15px 40px', fontSize: '1.1rem', cursor: 'pointer', border: 'none' }}>Message Us Now</button>
        </div>
      </section>
    </div>
  )
}
