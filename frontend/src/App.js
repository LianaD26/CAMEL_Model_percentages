import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from "./pages/home";
import Page2 from "./pages/page2";
import './App.css';

function App() {
    // El basename debe coincidir con el nombre del repositorio
    const basename = '/CAMEL_Model_percentages';
    return (
        <Router basename={basename}>
            <div className="App">
                <nav style={{marginBottom: '20px'}}>
                    <Link to="/" style={{marginRight: '10px'}}>Inicio</Link>
                    <Link to="/page2">Page2</Link>
                </nav>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/page2" element={<Page2 />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;