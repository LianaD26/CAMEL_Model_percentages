import React from 'react';
import './Tablero.css';

const Tablero = ({ columnas, datos, obtenerClaseRiesgo, onRiesgoChange }) => {
    
    const formatearNumero = (valor) => {
        if (valor === null || valor === undefined || valor === '') {
            return '-';
        }
        if (typeof valor === 'number') {
            return valor.toFixed(5);
        }
        if (typeof valor === 'string' && !isNaN(valor)) {
            return parseFloat(valor).toFixed(5);
        }
        return valor;
    };

    const handleRiesgoChange = (filaIndex, columna, nuevoValor) => {
        if (onRiesgoChange) {
            onRiesgoChange(filaIndex, columna, parseFloat(nuevoValor) || 0);
        }
    };

    const renderCelda = (fila, columna, filaIndex) => {
        const valor = fila[columna];
        
        // Si es una columna de riesgo, hacer editable
        if (columna === 'Riesgo Alto' || columna === 'Riesgo Bajo') {
            return (
                <input
                    type="number"
                    step="0.00001"
                    value={formatearNumero(valor)} // Mostrar el valor formateado
                    onChange={(e) => handleRiesgoChange(filaIndex, columna, e.target.value)}
                    onBlur={(e) => {
                        // Al perder foco, forzar formato de 5 decimales
                        const valorFormateado = parseFloat(e.target.value).toFixed(5);
                        handleRiesgoChange(filaIndex, columna, valorFormateado);
                    }}
                    className="riesgo-input"
                    style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'center',
                        fontSize: 'inherit',
                        color: 'inherit'
                    }}
                />
            );
        }
        
        // Para otras columnas, mostrar normalmente
        return formatearNumero(valor);
    };

    return (
        <div className="tablero-container">
            <div className="tablero-scroll">
                <table className="tablero-table">
                    <thead>
                        <tr>
                            {columnas.map((columna, index) => (
                                <th key={index} className="tablero-header">
                                    {columna}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {datos.filter(fila => fila.Indicador !== "Indicador de Riesgo de Liquidez - IRL" && fila.Indicador !== "Relación Solvencia")
                            .map((fila, filaIndex) => (
                            <tr key={filaIndex}>
                                {columnas.map((columna, colIndex) => (
                                    <td 
                                        key={colIndex} 
                                        className={`tablero-cell ${obtenerClaseRiesgo ? obtenerClaseRiesgo(fila, columna) : ''}`}
                                    >
                                        {renderCelda(fila, columna, filaIndex)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Tablero;