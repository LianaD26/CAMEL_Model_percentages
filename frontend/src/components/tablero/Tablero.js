import React from 'react';
import './Tablero.css';

const Tablero = ({ columnas, datos, obtenerClaseRiesgo, onRiesgoChange, onIndicadorClick }) => {
    // Lista de indicadores que NO deben multiplicarse por 100
    const indicadoresSinMultiplicar = [
        'Relación Solvencia',
        'Indicador de Riesgo de Liquidez - IRL',
        'IRL',
        'Solvencia'
    ];
    
    // Columnas que NO deben multiplicarse por 100 (ya están en porcentaje o en sus unidades correctas)
    const columnasNoMultiplicar = ['Peso (%)', 'Desv. Est.'];

    // Formatea y multiplica por 100 solo si NO está en la lista de excepciones
    const formatearNumero = (valor, fila, columna) => {
        if (valor === null || valor === undefined || valor === '') {
            return '-';
        }
        
        // Verificar si esta columna NO debe multiplicarse por 100
        const noMultiplicarPorColumna = columnasNoMultiplicar.includes(columna);
        
        // Verificar si este indicador NO debe multiplicarse por 100
        const noMultiplicarPorIndicador = fila && indicadoresSinMultiplicar.includes(fila.Indicador);
        
        const noMultiplicar = noMultiplicarPorColumna || noMultiplicarPorIndicador;
        
        if (typeof valor === 'number') {
            const formateado = noMultiplicar ? valor.toFixed(2) : (valor * 100).toFixed(2);
            // Agregar % si se multiplicó por 100
            return noMultiplicar ? formateado : `${formateado}%`;
        }
        if (typeof valor === 'string' && !isNaN(valor)) {
            const numeroValor = parseFloat(valor);
            const formateado = noMultiplicar ? numeroValor.toFixed(2) : (numeroValor * 100).toFixed(2);
            // Agregar % si se multiplicó por 100
            return noMultiplicar ? formateado : `${formateado}%`;
        }
        return valor;
    };
    
    // Formatea número para input (sin símbolo %)
    const formatearNumeroParaInput = (valor, fila, columna) => {
        if (valor === null || valor === undefined || valor === '') {
            return '';
        }
        
        // Verificar si esta columna NO debe multiplicarse por 100
        const noMultiplicarPorColumna = columnasNoMultiplicar.includes(columna);
        
        // Verificar si este indicador NO debe multiplicarse por 100
        const noMultiplicarPorIndicador = fila && indicadoresSinMultiplicar.includes(fila.Indicador);
        
        const noMultiplicar = noMultiplicarPorColumna || noMultiplicarPorIndicador;
        
        if (typeof valor === 'number') {
            return noMultiplicar ? valor.toFixed(2) : (valor * 100).toFixed(2);
        }
        if (typeof valor === 'string' && !isNaN(valor)) {
            const numeroValor = parseFloat(valor);
            return noMultiplicar ? numeroValor.toFixed(2) : (numeroValor * 100).toFixed(2);
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
        
        // Si es la columna de indicador y hay manejador, hacer clickeable
        if (columna === 'Indicador' && onIndicadorClick) {
            return (
                <span
                    style={{
                        cursor: 'pointer',
                        color: '#1976d2',
                        fontWeight: '600',
                        transition: 'opacity 0.2s ease'
                    }}
                    onClick={() => onIndicadorClick(fila.Indicador)}
                    onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                    title="Click para ver gráfica de tiempo"
                >
                    {valor}
                </span>
            );
        }
        
        // Si es una columna de riesgo, hacer editable
        if (columna === 'Riesgo Alto' || columna === 'Riesgo Bajo') {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                        type="number"
                        step="0.01"
                        value={formatearNumeroParaInput(valor, fila, columna)}
                        onChange={(e) => handleRiesgoChange(filaIndex, columna, e.target.value)}
                        onBlur={(e) => {
                            const valorFormateado = parseFloat(e.target.value).toFixed(2);
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
                    <span style={{ minWidth: '12px' }}>%</span>
                </div>
            );
        }
        // Para otras columnas, mostrar normalmente
        return formatearNumero(valor, fila, columna);
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