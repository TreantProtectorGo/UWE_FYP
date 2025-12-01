import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/Layout';
import HomePage from './pages/HomePage';
import SpecialTraffic from './pages/SpecialTraffic';
import RoadClosure from './pages/RoadClosure';

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/special-traffic" element={<SpecialTraffic />} />
          <Route path="/road-closure" element={<RoadClosure />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
