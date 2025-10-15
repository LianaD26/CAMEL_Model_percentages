import React, { useState, useEffect } from "react";
import Header from "../../components/header";
import Tablero from "../../components/tablero";
import { pesoIndicadores } from '../../constants/camelWeights';
import './camels_value.css';

const API_URL = process.env.REACT_APP_API_URL;

const CamelValue = () => {
    const [cooperativa, setCooperativa] = useState(localStorage.getItem('cooperativaSeleccionada') || '');
    const [ano, setAno] = useState(localStorage.getItem('anoSeleccionado') || '');
    const [calificaciones, setCalificaciones] = useState([]);
    const [valoresCAMEL, setValoresCAMEL] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Preparar datos para la tabla de porcentajes
    const datosTabla = Object.entries(pesoIndicadores).map(([indicador, peso]) => ({
        'Indicador': indicador.replace(/_/g, ' ').toUpperCase(),
        'Peso (%)': peso,
        'Peso Decimal': peso/100
    }));

    const columnasTabla = ['Indicador', 'Peso (%)', 'Peso Decimal'];

    // Función para obtener calificaciones de la API
    const obtenerCalificaciones = async () => {
        if (!cooperativa || !ano) {
            setError('Por favor selecciona una cooperativa y un año');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/predictor/calificacion/${encodeURIComponent(cooperativa)}?year=${ano}`
            );

            if (!response.ok) {
                throw new Error(`Error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            
            // Transformar los datos para que los meses sean columnas
            const datosCalificaciones = [];
            
            Object.entries(data.calificaciones).forEach(([indicador, meses]) => {
                const fila = {
                    'Indicador': indicador.replace(/_/g, ' ').toUpperCase()
                };
                
                // Agregar cada mes como columna manteniendo los nombres originales
                for (let mes = 1; mes <= 12; mes++) {
                    fila[`Mes ${mes}`] = meses[mes] || '-';
                }
                
                datosCalificaciones.push(fila);
            });

            setCalificaciones(datosCalificaciones);
            
            // Calcular valores CAMEL para cada mes
            calcularValoresCAMEL(data.calificaciones);
        } catch (err) {
            setError(`Error al obtener calificaciones: ${err.message}`);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Función para calcular los valores CAMEL mensuales
    const calcularValoresCAMEL = (calificacionesData) => {
        // Crear mapeo de indicador a peso
        const mapeoIndicadorPeso = {};
        Object.entries(pesoIndicadores).forEach(([indicador, peso]) => {
            mapeoIndicadorPeso[indicador.replace(/_/g, ' ').toUpperCase()] = peso;
        });

        // Calcular valor CAMEL para cada mes
        const valoresCAMELMensuales = { 
            'Método': 'Valor CAMEL Total' 
        };

        for (let mes = 1; mes <= 12; mes++) {
            let sumaCAMEL = 0;
            let indicadoresValidos = 0;

            Object.entries(calificacionesData).forEach(([indicador, meses]) => {
                const nombreIndicador = indicador.replace(/_/g, ' ').toUpperCase();
                const peso = mapeoIndicadorPeso[nombreIndicador];
                const calificacion = meses[mes];

                if (calificacion && !isNaN(calificacion) && peso) {
                    sumaCAMEL += calificacion * peso;
                    indicadoresValidos++;
                }
            });

            valoresCAMELMensuales[`Mes ${mes}`] = indicadoresValidos > 0 ? sumaCAMEL.toFixed(4) : '-';
        }

        setValoresCAMEL([valoresCAMELMensuales]);
    };

    // Cargar calificaciones cuando cambien cooperativa o año
    useEffect(() => {
        if (cooperativa && ano) {
            obtenerCalificaciones();
        }
    }, [cooperativa, ano]);

    // Columnas para la tabla de calificaciones (manteniendo nombres originales)
    const columnasCalificaciones = ['Indicador', 'Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6', 'Mes 7', 'Mes 8', 'Mes 9', 'Mes 10', 'Mes 11', 'Mes 12'];
    
    // Columnas para la tabla de valores CAMEL
    const columnasCAMEL = ['Método', 'Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6', 'Mes 7', 'Mes 8', 'Mes 9', 'Mes 10', 'Mes 11', 'Mes 12'];
    
    // Mapeo de nombres de columnas a etiquetas en español
    const etiquetasMeses = {
        'Indicador': 'Indicador',
        'Método': 'Método',
        'Mes 1': 'Enero',
        'Mes 2': 'Febrero', 
        'Mes 3': 'Marzo',
        'Mes 4': 'Abril',
        'Mes 5': 'Mayo',
        'Mes 6': 'Junio',
        'Mes 7': 'Julio',
        'Mes 8': 'Agosto',
        'Mes 9': 'Septiembre',
        'Mes 10': 'Octubre',
        'Mes 11': 'Noviembre',
        'Mes 12': 'Diciembre'
    };

    // Componente personalizado para mostrar las etiquetas en español
    const TableroConEtiquetas = ({ columnas, datos, etiquetas }) => {
        return (
            <div className="tablero-container">
                <div className="tablero-scroll">
                    <table className="tablero-table">
                        <thead>
                            <tr>
                                {columnas.map((columna, index) => (
                                    <th key={index} className="tablero-header">
                                        {etiquetas[columna] || columna}
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
                                            className="tablero-cell"
                                        >
                                            {fila[columna] || '-'}
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

    const porcentajes_camels=[]

    const valoresCamel = []

    return (
        <div className="camel-value-page">
            <Header title="Valor de CAMEL mensual" />
            <div className="input-section">
                <h3>Cooperativa Seleccionada: {cooperativa}</h3>
                <h3>Año: {ano}</h3>
                
                {!cooperativa && (
                    <div className="warning-message">
                        <p>⚠️ No hay cooperativa seleccionada. Por favor, selecciona una cooperativa desde la página principal.</p>
                    </div>
                )}
                
                {!ano && (
                    <div className="warning-message">
                        <p>⚠️ No hay año seleccionado. Por favor, selecciona un año desde la página principal.</p>
                    </div>
                )}
            </div>
            
            <div className="tabla-porcentajes-section">
                <h3>Pesos de los Indicadores CAMEL</h3>
                <Tablero 
                    columnas={columnasTabla}
                    datos={datosTabla}
                    obtenerClaseRiesgo={null}
                    onRiesgoChange={null}
                />
            </div>

            {cooperativa && ano && (
                <div className="tabla-calificaciones-section">
                    <h3>Calificaciones Mensuales de {cooperativa} - {ano}</h3>
                    
                    {loading && (
                        <div className="loading-message">
                            <p>⏳ Cargando calificaciones...</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="error-message">
                            <p>❌ {error}</p>
                            <button onClick={obtenerCalificaciones} className="retry-button">
                                Reintentar
                            </button>
                        </div>
                    )}
                    
                    {!loading && !error && calificaciones.length > 0 && (
                        <TableroConEtiquetas 
                            columnas={columnasCalificaciones}
                            datos={calificaciones}
                            etiquetas={etiquetasMeses}
                        />
                    )}
                    
                    {!loading && !error && calificaciones.length === 0 && (
                        <div className="no-data-message">
                            <p>📊 No se encontraron calificaciones para esta cooperativa y año.</p>
                        </div>
                    )}
                </div>
            )}

            {cooperativa && ano && valoresCAMEL.length > 0 && (
                <div className="tabla-valores-camel-section">
                    <h3>Valores CAMEL Mensuales - {cooperativa} - {ano}</h3>
                    <p className="descripcion-camel">
                        Fórmula: CAMEL = Σ(Calificación × Peso) para cada mes
                    </p>
                    <TableroConEtiquetas 
                        columnas={columnasCAMEL}
                        datos={valoresCAMEL}
                        etiquetas={etiquetasMeses}
                    />
                </div>
            )}
        </div>
    );
};

export default CamelValue;
