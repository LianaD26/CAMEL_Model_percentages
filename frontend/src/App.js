import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./pages/home";
import Page2 from "./pages/page2";
import './App.css';

function App() {
    // El basename debe coincidir con el nombre del repositorio
    const basename = '/CAMEL_Model_percentages';
    return (
        <Router basename={basename}>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/page2" element={<Page2 />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;