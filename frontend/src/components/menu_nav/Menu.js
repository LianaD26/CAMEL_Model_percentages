import React, { useState } from "react";
import { FaBars, FaTimes } from 'react-icons/fa';
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
                    <li><a href="/">🏠 Home</a></li>
                    <li><a href="/page2">📊 IRL y Solvencia</a></li>
                </ul>
            )}
        </div>
    );
};

export default Menu;