import React, { useState, useEffect, useCallback } from "react";
import Header from "../../components/header";
import Tablero from "../../components/tablero";
import { pesoIndicadores } from "../../constants/camelWeights";
import "./camels_value.css";

const API_URL = process.env.REACT_APP_API_URL;

const CamelValue = () => {
    // ========== ESTADO PARA PCA ==========
    const [resultadosPCA, setResultadosPCA] = useState(null);
    const [pcaSeleccionado, setPcaSeleccionado] = useState("general");
    const [loadingPCA, setLoadingPCA] = useState(true);
    const [errorPCA, setErrorPCA] = useState(null);

    // ========== ESTADO PARA CALIFICACIONES ==========
    const [categoria, setCategoria] = useState("");
    const [cooperativa, setCooperativa] = useState("");
    const [ano, setAno] = useState("");
    const [categorias, setCategorias] = useState([]);
    const [cooperativas, setCooperativas] = useState([]);
    const [anos, setAnos] = useState([]);
    const [calificaciones, setCalificaciones] = useState([]);
    const [valoresCAMEL, setValoresCAMEL] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    // 🔹 Cargar años disponibles
    useEffect(() => {
        const cargarAnos = async () => {
            try {
                const response = await fetch(`${API_URL}/anos/`);
                if (response.ok) {
                    const data = await response.json();
                    setAnos(data.anos || []);
                }
            } catch (err) {
                console.error("Error cargando años:", err);
            }
        };
        cargarAnos();
    }, []);

    // 🔹 Cargar categorías y cooperativas
    useEffect(() => {
        const cargarCoperativas = async () => {
            try {
                const response = await fetch(`${API_URL}/cooperativas/`);
                if (response.ok) {
                    const data = await response.json();
                    const categoriasUnicas = [...new Set(data.map(c => c.category).filter(Boolean))];
                    setCategorias(categoriasUnicas);
                    setCooperativas(data);
                }
            } catch (err) {
                console.error("Error cargando cooperativas:", err);
            }
        };
        cargarCoperativas();
    }, []);

    // 🔹 Filtrar cooperativas por categoría
    const cooperativasFiltradas = categoria 
        ? cooperativas.filter(c => c.category === categoria)
        : cooperativas;

    // 🔹 Obtener pesos PCA del PCA seleccionado
    const getPesosPCASeleccionado = () => {
        if (!resultadosPCA) return {};
        
        if (pcaSeleccionado === "general") {
            return resultadosPCA.pca_general?.pesos || {};
        } else {
            return resultadosPCA.pca_por_categoria?.[pcaSeleccionado]?.pesos || {};
        }
    };

    // 🔹 Crear tabla de pesos PCA
    const datosTablaPCA = Object.entries(getPesosPCASeleccionado()).map(([indicador, datos]) => ({
        "Indicador": indicador,
        "Peso (%)": datos.peso_porcentaje,
        "Promedio": datos.promedio,
        "Desv. Est.": datos.desviacion_estandar,
    }));

    const columnasTableaPCA = ["Indicador", "Peso (%)", "Promedio", "Desv. Est."];

    // 🔹 Normalizar pesos para cálculo de CAMEL
    const mapeoIndicadorPeso = {};
    Object.entries(getPesosPCASeleccionado()).forEach(([indicador, datos]) => {
        const nombreFormateado = indicador.replace(/_/g, " ").toUpperCase().trim();
        mapeoIndicadorPeso[nombreFormateado] = datos.peso_porcentaje / 100;
    });

    // 🔹 Función para obtener calificaciones
    const obtenerCalificaciones = useCallback(async () => {
        if (!cooperativa || !ano) {
            setError("Por favor selecciona una cooperativa y un año");
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
            const datosCalificaciones = [];

            Object.entries(data.calificaciones).forEach(([indicador, meses]) => {
                const fila = {
                    Indicador: indicador.replace(/_/g, " ").toUpperCase().trim(),
                };

                for (let mes = 1; mes <= 12; mes++) {
                    fila[`Mes ${mes}`] = meses[mes] || "-";
                }

                datosCalificaciones.push(fila);
            });

            setCalificaciones(datosCalificaciones);
            calcularValoresCAMEL(data.calificaciones, mapeoIndicadorPeso);
        } catch (err) {
            setError(`Error al obtener calificaciones: ${err.message}`);
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    }, [cooperativa, ano, mapeoIndicadorPeso]);

    // 🔹 Calcular valores CAMEL
    const calcularValoresCAMEL = (calificacionesData, mapeo) => {
        const valoresCAMELMensuales = { Método: "Valor CAMEL Total" };

        for (let mes = 1; mes <= 12; mes++) {
            let sumaCAMEL = 0;
            let indicadoresValidos = 0;

            Object.entries(calificacionesData).forEach(([indicador, meses]) => {
                const nombreIndicador = indicador.replace(/_/g, " ").toUpperCase().trim();
                const clavePeso = Object.keys(mapeo).find(
                    k => nombreIndicador.includes(k) || k.includes(nombreIndicador)
                );

                const peso = mapeo[clavePeso];
                const calificacion = meses[mes];

                if (peso !== undefined && !isNaN(calificacion)) {
                    sumaCAMEL += calificacion * peso;
                    indicadoresValidos++;
                }
            });

            valoresCAMELMensuales[`Mes ${mes}`] =
                indicadoresValidos > 0 ? sumaCAMEL.toFixed(4) : "-";
        }

        setValoresCAMEL([valoresCAMELMensuales]);
    };

    // 🔹 Ejecutar cálculo cuando cambien filtros
    useEffect(() => {
        if (cooperativa && ano) {
            obtenerCalificaciones();
        }
    }, [cooperativa, ano, obtenerCalificaciones]);

    const columnasCalificaciones = [
        "Indicador", "Mes 1", "Mes 2", "Mes 3", "Mes 4", "Mes 5", "Mes 6",
        "Mes 7", "Mes 8", "Mes 9", "Mes 10", "Mes 11", "Mes 12",
    ];

    const columnasCAMEL = [
        "Método", "Mes 1", "Mes 2", "Mes 3", "Mes 4", "Mes 5", "Mes 6",
        "Mes 7", "Mes 8", "Mes 9", "Mes 10", "Mes 11", "Mes 12",
    ];

    // ========== RENDER ==========
    return (
        <div className="camel-value-page">
            <Header title="Resultado PCA y Rangos de Calificación Percentiles" />
            
            {/* ========== SECCIÓN 1: RESULTADOS PCA ========== */}
            <section className="pca-section">
                <h2>📊 Análisis PCA - Pesos de Indicadores</h2>
                
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
                        {/* Selector de PCA */}
                        <div className="pca-selector">
                            <label>Seleccionar Análisis PCA:</label>
                            <select 
                                value={pcaSeleccionado}
                                onChange={(e) => setPcaSeleccionado(e.target.value)}
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
                                <h3>Pesos de Indicadores (PCA)</h3>
                                <Tablero
                                    columnas={columnasTableaPCA}
                                    datos={datosTablaPCA}
                                    titulo="Matriz de Pesos PCA"
                                />
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* ========== SECCIÓN 2: CALIFICACIONES Y CAMEL ========== */}
            <section className="calificaciones-section">
                <h2>🔍 Consulta de Calificaciones por Cooperativa</h2>

                {/* Filtros */}
                <div className="filtros-cooperativa">
                    <div className="filtro-grupo">
                        <label>Categoría (Opcional):</label>
                        <select 
                            value={categoria}
                            onChange={(e) => {
                                setCategoria(e.target.value);
                                setCooperativa("");
                            }}
                        >
                            <option value="">-- Todas las categorías --</option>
                            {categorias.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filtro-grupo">
                        <label>Cooperativa: <span style={{color: 'red'}}>*</span></label>
                        <select 
                            value={cooperativa}
                            onChange={(e) => setCooperativa(e.target.value)}
                            disabled={cooperativasFiltradas.length === 0}
                        >
                            <option value="">-- Seleccionar Cooperativa --</option>
                            {cooperativasFiltradas.map((coop, idx) => (
                                <option key={idx} value={coop.name}>{coop.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filtro-grupo">
                        <label>Año: <span style={{color: 'red'}}>*</span></label>
                        <select value={ano} onChange={(e) => setAno(e.target.value)}>
                            <option value="">-- Seleccionar Año --</option>
                            {anos.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Estado de carga y errores */}
                {loading && <p className="loading-message">⏳ Cargando calificaciones...</p>}
                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                        <button className="retry-button" onClick={obtenerCalificaciones}>
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Tabla de calificaciones */}
                {!loading && !error && calificaciones.length > 0 && (
                    <div className="tabla-calificaciones-section">
                        <h3>Calificaciones Mensuales - {cooperativa} ({ano})</h3>
                        <Tablero
                            columnas={columnasCalificaciones}
                            datos={calificaciones}
                        />
                    </div>
                )}

                {/* Tabla de valores CAMEL */}
                {!loading && !error && valoresCAMEL.length > 0 && (
                    <div className="tabla-camel-section">
                        <h3>Valores CAMEL Compostos</h3>
                        <Tablero
                            columnas={columnasCAMEL}
                            datos={valoresCAMEL}
                        />
                    </div>
                )}

                {!loading && !error && calificaciones.length === 0 && cooperativa && ano && (
                    <div className="no-data-message">
                        <p>📊 No se encontraron datos para esta cooperativa y año.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default CamelValue;
