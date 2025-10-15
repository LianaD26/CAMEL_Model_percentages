import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./pages/home";
import Page2 from "./pages/page2";
import CamelValue from "./pages/camels_value/camel_value";
import './App.css';

function App() {
    // El basename debe coincidir con el nombre del repositorio
    // En este caso, el nombre del repositorio es "CAMEL_Model_percentages"
    return (
        <Router basename="/CAMEL_Model_percentages">
            <div className="App">
                <Routes>
                    <Route path="/" element={<Page2 />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/camels_value" element={<CamelValue />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;