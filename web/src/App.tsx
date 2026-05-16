import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import Recipe from './pages/Recipe'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipe/:id" element={<Recipe />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
