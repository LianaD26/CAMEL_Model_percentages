import React from 'react';
import './Tablero.css';

const Tablero = ({ columnas, datos, obtenerClaseRiesgo, onRiesgoChange }) => {
    // Lista de indicadores que NO deben multiplicarse por 100
    const indicadoresSinMultiplicar = [
        'Relación Solvencia',
        'Indicador de Riesgo de Liquidez - IRL',
        'IRL',
        'Solvencia'
    ];

    // Formatea y multiplica por 100 solo si NO está en la lista de excepciones
    const formatearNumero = (valor, fila) => {
        if (valor === null || valor === undefined || valor === '') {
            return '-';
        }
        
        // Verificar si este indicador NO debe multiplicarse por 100
        const noMultiplicar = fila && indicadoresSinMultiplicar.includes(fila.Indicador);
        
        if (typeof valor === 'number') {
            return noMultiplicar ? valor.toFixed(5) : (valor * 100).toFixed(5);
        }
        if (typeof valor === 'string' && !isNaN(valor)) {
            const numeroValor = parseFloat(valor);
            return noMultiplicar ? numeroValor.toFixed(5) : (numeroValor * 100).toFixed(5);
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
                    value={formatearNumero(valor, fila)}
                    onChange={(e) => handleRiesgoChange(filaIndex, columna, e.target.value)}
                    onBlur={(e) => {
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
        return formatearNumero(valor, fila);
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
                        {datos.map((fila, filaIndex) => (
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