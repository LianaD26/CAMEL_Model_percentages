import React, { useState, useEffect } from "react";
import Header from "../../components/header";
import Tablero from "../../components/tablero";
import "./camels_value.css";

const API_URL = process.env.REACT_APP_API_URL;

// Indicadores con calificación inversa (valores bajos = bueno, valores altos = malo)
const INDICADORES_INVERSOS = [
    "Indicador de calidad por riesgo",
    "Indicador de calidad por riesgo con castigos",
    "Indicador de Cobertura de la Cartera Total en Riesgo",
    "Indicador de relación entre las obligaciones financieras y el pasivo total",
    "Indicador de Margen Financiero de Operación",
    "Indicador de Margen Operacional"
];

// Categorías CAMEL y sus indicadores
const CATEGORIAS_CAMEL = {
    Capital: [
        "Quebranto Patrimonial",
        "Relación entre Aportes sociales mínimos no reducibles y Capital Social",
        "Relación entre el Capital Institucional y el Activo Total"
    ],
    Assets: [
        "Indicador de calidad por riesgo",
        "Indicador de calidad por riesgo con castigos",
        "Indicador de Cobertura de la Cartera Total en Riesgo",
        "Activo Productivo",
        "Indicador de Cobertura individual de la cartera improductiva para la cartera en Riesgo"
    ],
    Managerial: [
        "Indicador de Margen Financiero de Operación",
        "Indicador de Margen Operacional",
        "Indicador de relación entre las obligaciones financieras y el pasivo total",
        "Estructura de Balance"
    ],
    Earnings: [
        "Indicador de rentabilidad sobre recursos propios - ROE",
        "Indicador de margen neto",
        "Indicador de rentabilidad sobre el capital invertido - ROIC"
    ],
    Liquidity: [
        "Activos líquidos ampliados / depósitos a corto plazo"
    ]
};

const CamelValue = () => {
    // ========== ESTADO PARA PCA ==========
    const [resultadosPCA, setResultadosPCA] = useState(null);
    const [pcaSeleccionado, setPcaSeleccionado] = useState("general");
    const [loadingPCA, setLoadingPCA] = useState(true);
    const [errorPCA, setErrorPCA] = useState(null);

    // ========== ESTADO PARA PERCENTILES ==========
    const [resultadosPercentiles, setResultadosPercentiles] = useState(null);
    const [percentilSeleccionado, setPercentilSeleccionado] = useState("general");
    const [loadingPercentiles, setLoadingPercentiles] = useState(true);
    const [errorPercentiles, setErrorPercentiles] = useState(null);

    // 🔹 Cargar resultados PCA al montar componente
    useEffect(() => {
        const cargarPCA = async () => {
            setLoadingPCA(true);
            setErrorPCA(null);
            try {
                const response = await fetch(`${API_URL}/camels/pca/todos`);
                if (!response.ok) {
                    throw new Error("No se han calculado resultados de PCA aún");
                }
                const data = await response.json();
                setResultadosPCA(data);
                console.log("📊 Resultados PCA cargados:", data);
            } catch (err) {
                setErrorPCA(err.message);
                console.error("Error cargando PCA:", err);
            } finally {
                setLoadingPCA(false);
            }
        };
        cargarPCA();
    }, []);

    // 🔹 Cargar resultados PERCENTILES al montar componente
    useEffect(() => {
        const cargarPercentiles = async () => {
            setLoadingPercentiles(true);
            setErrorPercentiles(null);
            try {
                const response = await fetch(`${API_URL}/camels/percentiles/todos`);
                if (!response.ok) {
                    throw new Error("No se han calculado resultados de percentiles aún");
                }
                const data = await response.json();
                setResultadosPercentiles(data);
                console.log("📈 Resultados Percentiles cargados:", data);
            } catch (err) {
                setErrorPercentiles(err.message);
                console.error("Error cargando percentiles:", err);
            } finally {
                setLoadingPercentiles(false);
            }
        };
        cargarPercentiles();
    }, []);

    // 🔹 Obtener pesos PCA del PCA seleccionado
    const getPesosPCASeleccionado = () => {
        if (!resultadosPCA) return {};
        
        if (pcaSeleccionado === "general") {
            return resultadosPCA.pca_general?.pesos || {};
        } else {
            return resultadosPCA.pca_por_categoria?.[pcaSeleccionado]?.pesos || {};
        }
    };

    // 🔹 Obtener percentiles del percentil seleccionado
    const getPercentilesSeleccionado = () => {
        if (!resultadosPercentiles) return {};
        
        if (percentilSeleccionado === "general") {
            return resultadosPercentiles.percentiles_generales?.percentiles || {};
        } else {
            return resultadosPercentiles.percentiles_por_categoria?.[percentilSeleccionado]?.percentiles || {};
        }
    };

    // 🔹 Convertir percentiles a rangos de calificación agrupados por categoría CAMEL
    const construirTablasPercentiles = () => {
        const percentiles = getPercentilesSeleccionado();
        
        // Crear objeto con indicadores agrupados por categoría CAMEL
        const tablasPorCategoria = {};
        
        Object.entries(CATEGORIAS_CAMEL).forEach(([categoria, indicadores]) => {
            tablasPorCategoria[categoria] = [];
            
            indicadores.forEach(nombreIndicador => {
                if (nombreIndicador in percentiles) {
                    const valoresPercentiles = percentiles[nombreIndicador];
                    const esInverso = INDICADORES_INVERSOS.includes(nombreIndicador);
                    
                    // Los rangos SIEMPRE en el mismo orden (P10, P20, ..., P90)
                    const rangosBase = [
                        { minVal: -Infinity, maxVal: valoresPercentiles.p10, calificacion: 1 },
                        { minVal: valoresPercentiles.p10, maxVal: valoresPercentiles.p20, calificacion: 2 },
                        { minVal: valoresPercentiles.p20, maxVal: valoresPercentiles.p30, calificacion: 3 },
                        { minVal: valoresPercentiles.p30, maxVal: valoresPercentiles.p40, calificacion: 4 },
                        { minVal: valoresPercentiles.p40, maxVal: valoresPercentiles.p50, calificacion: 5 },
                        { minVal: valoresPercentiles.p50, maxVal: valoresPercentiles.p60, calificacion: 6 },
                        { minVal: valoresPercentiles.p60, maxVal: valoresPercentiles.p70, calificacion: 7 },
                        { minVal: valoresPercentiles.p70, maxVal: valoresPercentiles.p80, calificacion: 8 },
                        { minVal: valoresPercentiles.p80, maxVal: valoresPercentiles.p90, calificacion: 9 },
                        { minVal: valoresPercentiles.p90, maxVal: Infinity, calificacion: 10 },
                    ];
                    
                    // Para indicadores inversos: invertir SOLO la calificación (10, 9, 8, ..., 1)
                    const rangos = esInverso
                        ? rangosBase.map(r => ({ ...r, calificacion: 11 - r.calificacion }))
                        : rangosBase;
                    
                    tablasPorCategoria[categoria].push({
                        indicador: nombreIndicador,
                        rangos: rangos,
                        percentiles: valoresPercentiles,
                        esInverso: esInverso
                    });
                }
            });
        });
        
        return tablasPorCategoria;
    };

    // 🔹 Sincronizar cambios de categoría entre PCA y Percentiles
    const handleChangePCA = (valor) => {
        setPcaSeleccionado(valor);
        setPercentilSeleccionado(valor);
    };

    const handleChangePercentil = (valor) => {
        setPercentilSeleccionado(valor);
        setPcaSeleccionado(valor);
    };

    // 🔹 Crear tabla de pesos PCA
    const datosTablaPCA = Object.entries(getPesosPCASeleccionado()).map(([indicador, datos]) => ({
        "Indicador": indicador,
        "Peso (%)": datos.peso_porcentaje,
        "Promedio": datos.promedio,
        "Desv. Est.": datos.desviacion_estandar,
    }));

    const columnasTableaPCA = ["Indicador", "Peso (%)", "Promedio", "Desv. Est."];

    // ========== RENDER ==========
    return (
        <div className="camel-value-page">
            <Header title="Resultado PCA y Rangos de Calificación Percentiles" />
            
            {/* ========== SECCIÓN ÚNICA: RESULTADOS PCA ========== */}
            <section className="pca-section">
                <h2>📊 Análisis PCA - Pesos de Indicadores por Categoría</h2>
                
                {loadingPCA && <p className="loading-message">⏳ Cargando resultados de PCA...</p>}
                
                {errorPCA && (
                    <div className="error-message">
                        <p>⚠️ {errorPCA}</p>
                        <button className="retry-button" onClick={() => window.location.reload()}>
                            Reintentar
                        </button>
                    </div>
                )}

                {resultadosPCA && (
                    <>
                        {/* Selector de Categoría PCA */}
                        <div className="pca-selector">
                            <label>Seleccionar Categoría para PCA:</label>
                            <select 
                                value={pcaSeleccionado}
                                onChange={(e) => handleChangePCA(e.target.value)}
                            >
                                <option value="general">
                                    🌍 GENERAL (Todas las categorías)
                                </option>
                                {Object.keys(resultadosPCA.pca_por_categoria || {}).map(cat => (
                                    <option key={cat} value={cat}>
                                        📁 {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Información del PCA seleccionado */}
                        <div className="pca-info">
                            {pcaSeleccionado === "general" ? (
                                <div>
                                    <h3>{resultadosPCA.pca_general?.nombre}</h3>
                                    <p>👥 Cooperativas: {resultadosPCA.pca_general?.cantidad_cooperativas}</p>
                                    <p>📝 Registros: {resultadosPCA.pca_general?.cantidad_registros}</p>
                                </div>
                            ) : (
                                <div>
                                    <h3>{resultadosPCA.pca_por_categoria?.[pcaSeleccionado]?.nombre}</h3>
                                    <p>👥 Cooperativas: {resultadosPCA.pca_por_categoria?.[pcaSeleccionado]?.cantidad_cooperativas}</p>
                                    <p>📝 Registros: {resultadosPCA.pca_por_categoria?.[pcaSeleccionado]?.cantidad_registros}</p>
                                </div>
                            )}
                        </div>

                        {/* Tabla de pesos PCA */}
                        {datosTablaPCA.length > 0 && (
                            <div className="tabla-pca-section">
                                <h3>Pesos de Indicadores</h3>
                                <Tablero
                                    columnas={columnasTableaPCA}
                                    datos={datosTablaPCA}
                                />
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* ========== SECCIÓN: PERCENTILES Y RANGOS DE CALIFICACIÓN ========== */}
            <section className="percentiles-section">
                <h2>📈 Rangos de Calificación por Percentiles</h2>
                
                {loadingPercentiles && <p className="loading-message">⏳ Cargando resultados de percentiles...</p>}
                
                {errorPercentiles && (
                    <div className="error-message">
                        <p>⚠️ {errorPercentiles}</p>
                        <button className="retry-button" onClick={() => window.location.reload()}>
                            Reintentar
                        </button>
                    </div>
                )}

                {resultadosPercentiles && (
                    <>
                        {/* Selector de Categoría PERCENTILES */}
                        <div className="percentiles-selector">
                            <label>Seleccionar Categoría para Percentiles:</label>
                            <select 
                                value={percentilSeleccionado}
                                onChange={(e) => handleChangePercentil(e.target.value)}
                            >
                                <option value="general">
                                    🌍 GENERAL (Todas las categorías)
                                </option>
                                {Object.keys(resultadosPercentiles.percentiles_por_categoria || {}).map(cat => (
                                    <option key={cat} value={cat}>
                                        📁 {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Información del Percentil seleccionado */}
                        <div className="percentiles-info">
                            {percentilSeleccionado === "general" ? (
                                <div>
                                    <h3>{resultadosPercentiles.percentiles_generales?.nombre}</h3>
                                    <p>👥 Cooperativas: {resultadosPercentiles.percentiles_generales?.cantidad_cooperativas}</p>
                                    <p>📝 Registros: {resultadosPercentiles.percentiles_generales?.cantidad_registros}</p>
                                </div>
                            ) : (
                                <div>
                                    <h3>{resultadosPercentiles.percentiles_por_categoria?.[percentilSeleccionado]?.nombre}</h3>
                                    <p>👥 Cooperativas: {resultadosPercentiles.percentiles_por_categoria?.[percentilSeleccionado]?.cantidad_cooperativas}</p>
                                    <p>📝 Registros: {resultadosPercentiles.percentiles_por_categoria?.[percentilSeleccionado]?.cantidad_registros}</p>
                                </div>
                            )}
                        </div>

                        {/* Tablas de rangos por indicador agrupados por categoría CAMEL */}
                        <div className="percentiles-tablas-agrupadas">
                            {Object.entries(construirTablasPercentiles()).map(([categoria, tablas]) => (
                                tablas.length > 0 && (
                                    <div key={categoria} className="categoria-camel">
                                        <h2 className={`categoria-titulo categoria-${categoria.toLowerCase()}`}>
                                            {categoria}
                                        </h2>
                                        <div className="percentiles-tablas">
                                            {tablas.map((tabla) => (
                                                <div key={tabla.indicador} className="tabla-percentil-indicador">
                                                    <h3>{tabla.indicador}</h3>
                                                    <table className="tabla-rangos">
                                                        <thead>
                                                            <tr>
                                                                <th>Rango</th>
                                                                <th>Calificación</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tabla.rangos.map((rango, idx) => {
                                                                const minText = rango.minVal === -Infinity 
                                                                    ? "0" 
                                                                    : rango.minVal.toFixed(4);
                                                                const maxText = rango.maxVal === Infinity 
                                                                    ? "∞" 
                                                                    : rango.maxVal.toFixed(4);
                                                                
                                                                return (
                                                                    <tr key={idx}>
                                                                        <td>{minText} ≤ c ≤ {maxText}</td>
                                                                        <td className={`calificacion-${rango.calificacion}`}>
                                                                            {rango.calificacion}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
};

export default CamelValue;
