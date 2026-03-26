import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ResultsPage from './components/ResultsPage';
import LandingPage from './pages/landingPage/views/landingPage';
import Login from './pages/auth/views/login';
import Register from './pages/auth/views/register';
import SearchPublications from './pages/publications/views/SearchPublications';
import Registrations from './pages/system-admin/views/Registrations';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<SearchPublications />} />
          <Route path="/results/:authorName" element={<ResultsPage />} />
          <Route path="/system-admin/registrations" element={<Registrations />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
