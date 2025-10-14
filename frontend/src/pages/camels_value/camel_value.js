import React, { useState, useEffect } from "react";
import Header from "../../components/header";
import { pesoIndicadores } from '../../constants/camelWeights';
import './camels_value.css';

const API_URL = process.env.REACT_APP_API_URL;

const CamelValue = () => {
    const [cooperativa, setCooperativa] = useState(localStorage.getItem('cooperativaSeleccionada') || '');
    const [ano, setAno] = useState(localStorage.getItem('anoSeleccionado') || '');
    const columnas = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 
                    'Junio','Julio', 'Agosto', 'Septiembre', 'Octubre', 
                    'Noviembre', 'Diciembre','promedio'];
    return (
        <div className="camel-value-page">
            <Header title="Valor de CAMEL mensual" />
            <div className="input-section">
                <h3>Cooperativa Seleccionada: {cooperativa}</h3>
                <h3>Año: {ano}</h3>
            </div>
        </div>
    );
};

export default CamelValue;
