import React from "react";
import './Tablero.css';

const Tablero = ({ columnas, datos, obtenerClaseRiesgo }) => {
    // Función para formatear números a 5 decimales
    const formatearNumero = (valor) => {
        if (valor === null || valor === undefined || valor === '') {
            return '-';
        }
        if (typeof valor === 'number') {
            return valor.toFixed(5);
        }
        if (typeof valor === 'string' && !isNaN(valor)) {
            return parseFloat(valor).toFixed(8);
        }
        return valor; // Para valores no numéricos (como texto)
    };

    return (
        <div className="tablero-container">
            <table className="tablero-table">
                <thead>
                    <tr>
                        {columnas.map((columna, index) => (
                            <th key={index}>{columna}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {datos.map((fila, index) => (
                        <tr key={index}>
                            {columnas.map((columna, colIndex) => (
                                <td 
                                    key={colIndex}
                                    className={obtenerClaseRiesgo ? obtenerClaseRiesgo(fila, columna) : ''}
                                >
                                    {formatearNumero(fila[columna])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
export default Tablero;