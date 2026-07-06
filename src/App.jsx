import React from 'react'
import Home from './pages/Home'
import Tours from './pages/Tours'
import Contact from './pages/Contact'
import Add from './pages/Add'
import Listings from './pages/Listings'
import AI from './pages/AI'

function App() {
  const [route, setRoute] = React.useState(window.location.pathname)
  const [mobileMenu, setMobileMenu] = React.useState(false)
  const [darkMode, setDarkMode] = React.useState(false)
  const [showUpBtn, setShowUpBtn] = React.useState(false)

  // Router listener
  React.useEffect(() => {
    const onPop = () => {
      setRoute(window.location.pathname)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Dark mode initializer
  React.useEffect(() => {
    const isDark = localStorage.getItem('tourism_website_darkmode') === 'true'
    setDarkMode(isDark)
    if (isDark) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [])

  // Up Scroll listener
  React.useEffect(() => {
    const handleScroll = () => {
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        setShowUpBtn(true)
      } else {
        setShowUpBtn(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigate = (path) => {
    // Check if query or hash exists
    const cleanPath = path.split('?')[0].split('#')[0]
    window.history.pushState({}, '', path)
    setRoute(cleanPath)
    setMobileMenu(false)

    // Handle scroll to top or hashes
    if (path.includes('#about')) {
      setTimeout(() => {
        const el = document.getElementById('about')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      window.scrollTo(0, 0)
    }
  }

  const toggleDarkMode = () => {
    const nextDark = !darkMode
    setDarkMode(nextDark)
    localStorage.setItem('tourism_website_darkmode', String(nextDark))
    if (nextDark) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-root-container">
      {/* Navigation Bar */}
      <nav className="navbar glass" style={{ height: '70px' }}>
        <span>
          <a
            href="/"
            style={{ display: 'flex', alignItems: 'center' }}
            onClick={(e) => { e.preventDefault(); navigate('/'); }}
          >
            <img
              className="img2"
              src="img/mountain.png"
              width="40"
              style={{ margin: '-25px -10px -25px -20px' }}
              alt="Adventure Logo"
            />
            <h1 className="logo">&nbsp;ADVENTURE</h1>
          </a>
        </span>

        <ul className={`nav-links ${mobileMenu ? 'mobile-menu' : ''}`}>
          <li>
            <a
              href="/"
              className={`cir_border ${route === '/' && !window.location.hash.includes('#about') ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/'); }}
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="/tours"
              className={`cir_border ${route === '/tours' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/tours'); }}
            >
              Tours & Events
            </a>
          </li>
          <li>
            <a
              href="#about"
              className="cir_border"
              onClick={(e) => { e.preventDefault(); navigate('/#about'); }}
            >
              About
            </a>
          </li>
          <li>
            <a
              href="/contact"
              className={`cir_border ${route === '/contact' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/contact'); }}
            >
              Contact
            </a>
          </li>
          <li>
            <a
              href="/add"
              className={`cir_border ${route === '/add' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/add'); }}
            >
              Add Listing
            </a>
          </li>
          <li>
            <a
              href="/listings"
              className={`cir_border ${route === '/listings' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/listings'); }}
            >
              Listings
            </a>
          </li>
          <li>
            <a
              href="/ai"
              className={`cir_border ${route === '/ai' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/ai'); }}
            >
              AI Assistant
            </a>
          </li>
          <li>
            <div>
              <input
                type="checkbox"
                className="checkbox dark"
                id="checkbox"
                checked={darkMode}
                onChange={toggleDarkMode}
              />
              <label htmlFor="checkbox" className="label">
                <i className="fa fa-moon-o"></i>
                <i className="fa fa-sun-o"></i>
                <div className="ball"></div>
              </label>
            </div>
          </li>
        </ul>

        <img
          src="img/menu-btn.png"
          alt="Menu Button"
          className="menu-btn"
          onClick={() => setMobileMenu(!mobileMenu)}
        />
      </nav>

      {/* Main Pages content rendering */}
      <main className="main-content-area">
        {route === '/' && <Home navigate={navigate} />}
        {route === '/tours' && <Tours />}
        {route === '/contact' && <Contact />}
        {route === '/add' && <Add onDone={() => navigate('/listings')} />}
        {route === '/listings' && <Listings navigate={navigate} />}
        {route === '/ai' && <AI />}
      </main>

      {/* Floating back-to-top scroll button */}
      <i
        className="arrow"
        onClick={scrollToTop}
        id="upbtn"
        style={{ display: showUpBtn ? 'block' : 'none' }}
      ></i>

      {/* Global Footer */}
      <section className="footer">
        <span>Created By Ankush | &#169; {new Date().getFullYear()} All rights reserved.</span>
        <div className="social">
          <li></li>
        </div>
      </section>
    </div>
  )
}

export default App
