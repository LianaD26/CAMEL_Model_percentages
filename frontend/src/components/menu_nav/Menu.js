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
                    <li><Link to="/">IRL y Solvencia</Link></li>
                    <li><Link to="/home">Home</Link></li>
                    <li><Link to="/camels_value">Valor CAMEL</Link></li>
                    <li><Link to="/ranking">Salud Financiera</Link></li>
                </ul>
            )}
        </div>
    );
};

export default Menu;