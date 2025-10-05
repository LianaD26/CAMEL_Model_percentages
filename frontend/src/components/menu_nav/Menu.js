import React, { useState } from "react";
import { FaBars, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Menu.css';

const Menu = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`menu-nav-container ${isOpen ? 'menu-open' : ''}`}>
            <div className="menu-icon" onClick={toggleMenu}>
                {isOpen ? <FaTimes /> : <FaBars />}
            </div>
            
            {isOpen && (
                <ul className="menu-list">
                    <li><Link to="/">🏠 Home</Link></li>
                    <li><Link to="/page2">📊 IRL y Solvencia</Link></li>
                </ul>
            )}
        </div>
    );
};

export default Menu;