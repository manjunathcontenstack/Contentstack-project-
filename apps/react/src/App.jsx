import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Platform from './pages/Platform.jsx'
import Plans from './pages/Plans.jsx'
import Partners from './pages/Partners.jsx'
import Company from './pages/Company.jsx'
import Blog from './pages/Blog.jsx'
import Careers from './pages/Careers.jsx'
import Contact from './pages/Contact.jsx'
import Marketplace from './pages/Marketplace.jsx'
import Updates from './pages/Updates.jsx'
import Events from './pages/Events.jsx'
import Start from './pages/Start.jsx'
import Academy from './pages/Academy.jsx'
import Docs from './pages/Docs.jsx'

export default function App(){
	return (
		<div className="app">
			<Header />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/platform" element={<Platform />} />
				<Route path="/plans" element={<Plans />} />
				<Route path="/partners" element={<Partners />} />
				<Route path="/company" element={<Company />} />
				<Route path="/blog" element={<Blog />} />
				<Route path="/careers" element={<Careers />} />
				<Route path="/contact" element={<Contact />} />
				<Route path="/academy" element={<Academy />} />
				<Route path="/docs" element={<Docs />} />
				<Route path="/marketplace" element={<Marketplace />} />
				<Route path="/updates" element={<Updates />} />
				<Route path="/events" element={<Events />} />
				<Route path="/start" element={<Start />} />
			</Routes>
			<Footer />
		</div>
	)
}


