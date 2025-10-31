import { NavLink } from 'react-router-dom'

export default function Header(){
  return (
    <header className="site-header">
      <div className="container nav">
        <NavLink className="logo" to="/">Contentstack</NavLink>
        <nav className="primary-nav">
          <ul className="nav-list">
            <li><NavLink to="/platform">Platform</NavLink></li>
            <li><NavLink to="/plans">Plans</NavLink></li>
            <li><NavLink to="/partners">Partners</NavLink></li>
            <li><NavLink to="/company">Company</NavLink></li>
            <li><NavLink to="/blog">Blog</NavLink></li>
          </ul>
          <div className="nav-cta">
            <NavLink className="btn ghost" to="/contact">Talk to Us</NavLink>
            <NavLink className="btn solid" to="/start">Start Free</NavLink>
          </div>
        </nav>
      </div>
    </header>
  )
}


