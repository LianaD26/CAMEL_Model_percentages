import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import Tablero from '../../components/tablero';
import './page2.css';

const API_URL = process.env.REACT_APP_API_URL;

const Page2 = () => {
    // Estados para los datos de IRL y Solvencia
    const [datosIrl, setDatosIrl] = useState({
        enero: '0', febrero: '0', marzo: '0', abril: '0', mayo: '0', junio: '0',
        julio: '0', agosto: '0', septiembre: '0', octubre: '0', noviembre: '0', diciembre: '0'
    });
    
    const [datosSolvencia, setDatosSolvencia] = useState({
        enero: '0', febrero: '0', marzo: '0', abril: '0', mayo: '0', junio: '0',
        julio: '0', agosto: '0', septiembre: '0', octubre: '0', noviembre: '0', diciembre: '0'
    });

    // Función para calcular promedio
    const calcularPromedio = (datos) => {
        const valores = Object.values(datos).filter(valor => valor !== '' && !isNaN(valor));
        if (valores.length === 0) return 0;
        const suma = valores.reduce((acc, val) => acc + parseFloat(val), 0);
        return (suma / valores.length).toFixed(2);
    };

    // Columnas de la tabla
    const columnas = ['Indicador', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Promedio'];

    // Preparar datos para la tabla
    const datosTabla = [
        {
            Indicador: 'IRL',
            Enero: datosIrl.enero,
            Febrero: datosIrl.febrero,
            Marzo: datosIrl.marzo,
            Abril: datosIrl.abril,
            Mayo: datosIrl.mayo,
            Junio: datosIrl.junio,
            Julio: datosIrl.julio,
            Agosto: datosIrl.agosto,
            Septiembre: datosIrl.septiembre,
            Octubre: datosIrl.octubre,
            Noviembre: datosIrl.noviembre,
            Diciembre: datosIrl.diciembre,
            Promedio: calcularPromedio(datosIrl)
        },
        {
            Indicador: 'Solvencia',
            Enero: datosSolvencia.enero,
            Febrero: datosSolvencia.febrero,
            Marzo: datosSolvencia.marzo,
            Abril: datosSolvencia.abril,
            Mayo: datosSolvencia.mayo,
            Junio: datosSolvencia.junio,
            Julio: datosSolvencia.julio,
            Agosto: datosSolvencia.agosto,
            Septiembre: datosSolvencia.septiembre,
            Octubre: datosSolvencia.octubre,
            Noviembre: datosSolvencia.noviembre,
            Diciembre: datosSolvencia.diciembre,
            Promedio: calcularPromedio(datosSolvencia)
        }
    ];

    // Función para manejar cambios en inputs de IRL
    const handleIrlChange = (mes, valor) => {
        setDatosIrl(prev => ({
            ...prev,
            [mes]: valor
        }));
    };

    // Función para manejar cambios en inputs de Solvencia
    const handleSolvenciaChange = (mes, valor) => {
        setDatosSolvencia(prev => ({
            ...prev,
            [mes]: valor
        }));
    };

    return (
        <div className="irl-solvencia-container"> 
            <Header title="Cálculo de los indicadores de IRL y Solvencia"/>
            {/* Formularios de entrada */}
            <div className="input-section">
                <h3>Ingrese los datos de IRL por mes:</h3>
                <div className="input-grid">
                    {Object.keys(datosIrl).map(mes => (
                        <div key={mes} className="input-group">
                            <label>{mes.charAt(0).toUpperCase() + mes.slice(1)}:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={datosIrl[mes]}
                                onChange={(e) => handleIrlChange(mes, e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    ))}
                </div>

                <h3>Ingrese los datos de Solvencia por mes:</h3>
                <div className="input-grid">
                    {Object.keys(datosSolvencia).map(mes => (
                        <div key={mes} className="input-group">
                            <label>{mes.charAt(0).toUpperCase() + mes.slice(1)}:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={datosSolvencia[mes]}
                                onChange={(e) => handleSolvenciaChange(mes, e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabla con los resultados */}
            <Tablero columnas={columnas} datos={datosTabla} />
        </div>
    );
};

export default Page2;