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
                const response = await fetch(`${API_URL}/camels/pca/resultados-json`);
                if (!response.ok) {
                    throw new Error("No se han calculado resultados de PCA aún");
                }
                const data = await response.json();
                console.log("📊 Datos crudos del API:", data);
                
                // Estructura esperada: data.datos.ultimoCalculo.resultados
                // resultados es un objeto: { "General": {...}, "Micro 1": {...}, ... }
                if (data.datos && data.datos.ultimoCalculo && data.datos.ultimoCalculo.resultados) {
                    const resultadosProcesados = {
                        pca_general: {
                            nombre: "GENERAL (Todas las categorías)",
                            cantidad_cooperativas: 0,
                            cantidad_registros: 0,
                            pesos: {}
                        },
                        pca_por_categoria: {}
                    };

                    const resultados = data.datos.ultimoCalculo.resultados;
                    
                    // Procesar cada categoría del JSON
                    Object.entries(resultados).forEach(([categoria, datosCategoria]) => {
                        // datosCategoria tiene: cantidad_cooperativas, cantidad_registros, pesos
                        const pesos = {};
                        
                        if (datosCategoria.pesos) {
                            Object.entries(datosCategoria.pesos).forEach(([idIndicador, datosPeso]) => {
                                // datosPeso tiene: nombre_indicador, categoria_camel, peso, peso_porcentaje
                                const nombreIndicador = datosPeso.nombre_indicador || `Indicador ${idIndicador}`;
                                
                                pesos[nombreIndicador] = {
                                    peso_porcentaje: datosPeso.peso_porcentaje,
                                    importancia: datosPeso.peso,
                                    categoria_camel: datosPeso.categoria_camel,
                                    promedio: 0,
                                    desviacion_estandar: 0
                                };
                            });
                        }

                        // Asignar a General o a categoría específica
                        if (categoria.toLowerCase() === "general") {
                            resultadosProcesados.pca_general.pesos = pesos;
                            resultadosProcesados.pca_general.cantidad_cooperativas = datosCategoria.cantidad_cooperativas || 0;
                            resultadosProcesados.pca_general.cantidad_registros = datosCategoria.cantidad_registros || 0;
                        } else {
                            resultadosProcesados.pca_por_categoria[categoria] = {
                                nombre: categoria,
                                cantidad_cooperativas: datosCategoria.cantidad_cooperativas || 0,
                                cantidad_registros: datosCategoria.cantidad_registros || 0,
                                pesos: pesos
                            };
                        }
                    });

                    setResultadosPCA(resultadosProcesados);
                    console.log("✅ Resultados PCA procesados:", resultadosProcesados);
                } else {
                    throw new Error("Formato de datos PCA inválido. Verifica la estructura del JSON.");
                }
            } catch (err) {
                setErrorPCA(err.message);
                console.error("❌ Error cargando PCA:", err);
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
                const response = await fetch(`${API_URL}/camels/percentiles/resultados-json`);
                if (!response.ok) {
                    throw new Error("No se han calculado resultados de percentiles aún");
                }
                const data = await response.json();
                console.log("📈 Datos de percentiles cargados:", data);
                setResultadosPercentiles(data.datos);
            } catch (err) {
                setErrorPercentiles(err.message);
                console.error("❌ Error cargando percentiles:", err);
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
        const ordenCAMEL = ["Capital", "Assets", "Managerial", "Earnings", "Liquidity"];
        
        // Inicializar arrays para cada categoría CAMEL
        ordenCAMEL.forEach(cat => {
            tablasPorCategoria[cat] = [];
        });
        
        // Procesar cada indicador enriquecido
        Object.entries(percentiles).forEach(([idIndicador, datosPct]) => {
            // datosPct tiene: nombre_indicador, categoria_camel, p10, p20, ..., p90
            const nombreIndicador = datosPct.nombre_indicador || `Indicador ${idIndicador}`;
            const categoriaCAMEL = datosPct.categoria_camel || "Desconocida";
            const esInverso = INDICADORES_INVERSOS.includes(nombreIndicador);
            
            // Los rangos SIEMPRE en el mismo orden (P10, P20, ..., P90)
            const rangosBase = [
                { minVal: -Infinity, maxVal: datosPct.p10, calificacion: 1 },
                { minVal: datosPct.p10, maxVal: datosPct.p20, calificacion: 2 },
                { minVal: datosPct.p20, maxVal: datosPct.p30, calificacion: 3 },
                { minVal: datosPct.p30, maxVal: datosPct.p40, calificacion: 4 },
                { minVal: datosPct.p40, maxVal: datosPct.p50, calificacion: 5 },
                { minVal: datosPct.p50, maxVal: datosPct.p60, calificacion: 6 },
                { minVal: datosPct.p60, maxVal: datosPct.p70, calificacion: 7 },
                { minVal: datosPct.p70, maxVal: datosPct.p80, calificacion: 8 },
                { minVal: datosPct.p80, maxVal: datosPct.p90, calificacion: 9 },
                { minVal: datosPct.p90, maxVal: Infinity, calificacion: 10 },
            ];
            
            // Para indicadores inversos: invertir SOLO la calificación (10, 9, 8, ..., 1)
            const rangos = esInverso
                ? rangosBase.map(r => ({ ...r, calificacion: 11 - r.calificacion }))
                : rangosBase;
            
            // Agregar a la categoría CAMEL correspondiente
            if (tablasPorCategoria[categoriaCAMEL]) {
                tablasPorCategoria[categoriaCAMEL].push({
                    indicador: nombreIndicador,
                    rangos: rangos,
                    percentiles: datosPct,
                    esInverso: esInverso
                });
            } else {
                // Si la categoría no existe, ponerla en Desconocida
                if (!tablasPorCategoria["Desconocida"]) {
                    tablasPorCategoria["Desconocida"] = [];
                }
                tablasPorCategoria["Desconocida"].push({
                    indicador: nombreIndicador,
                    rangos: rangos,
                    percentiles: datosPct,
                    esInverso: esInverso
                });
            }
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

    // 🔹 Crear tabla de pesos PCA organizados por categoría CAMEL
    const datosTablaPCA = (() => {
        const pesos = getPesosPCASeleccionado();
        const datosOrdenados = [];
        const ordenCAMEL = ["Capital", "Assets", "Managerial", "Earnings", "Liquidity"];

        // Agrupar por categoría CAMEL
        const agrupadoPorCAMEL = {};
        Object.entries(pesos).forEach(([nombreIndicador, datos]) => {
            const camelCategoria = datos.categoria_camel || "Desconocida";
            if (!agrupadoPorCAMEL[camelCategoria]) {
                agrupadoPorCAMEL[camelCategoria] = [];
            }
            agrupadoPorCAMEL[camelCategoria].push({
                nombre: nombreIndicador,
                peso_porcentaje: datos.peso_porcentaje
            });
        });

        // Recorrer en orden CAMEL
        ordenCAMEL.forEach(camelCategoria => {
            if (agrupadoPorCAMEL[camelCategoria]) {
                // Ordenar por peso descendente
                agrupadoPorCAMEL[camelCategoria].sort((a, b) => b.peso_porcentaje - a.peso_porcentaje);
                
                agrupadoPorCAMEL[camelCategoria].forEach(item => {
                    datosOrdenados.push({
                        "Indicador": item.nombre,
                        "Categoría CAMEL": camelCategoria,
                        "Peso (%)": parseFloat(item.peso_porcentaje)
                    });
                });
            }
        });

        return datosOrdenados;
    })();

    const columnasTableaPCA = ["Indicador", "Categoría CAMEL", "Peso (%)"];

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
