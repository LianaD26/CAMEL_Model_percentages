import React from "react";
import Menu from '../../components/menu_nav';
import './header.css';

const Header = ({title="CAMEL Model - Consulta de Indicadores"}) => {
    return (
        <div className="header-container">
            
            <div className="title-container">
                <h1 className="main-header">{title}</h1>
            </div>
            
            <div className="menu-container">
                <Menu />
            </div>
            
        </div>
    );  
};
export default Header;
