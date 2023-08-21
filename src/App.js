import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AuthenticationForm from './AuthenticationForm';
import DigitalSignatureFrame from './DigitalSignatureFrame';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/digital-signature">Digital Signature</Link></li>
            </ul>
          </nav>
          <Routes>
            <Route path="/" element={<AuthenticationForm />} />
            <Route path="/digital-signature" element={<DigitalSignatureFrame />} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;