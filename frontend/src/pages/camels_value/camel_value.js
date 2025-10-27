import React, { useState, useEffect, useCallback } from "react";
import Header from "../../components/header";
import Tablero from "../../components/tablero";
import { pesoIndicadores } from "../../constants/camelWeights";
import "./camels_value.css";

const API_URL = process.env.REACT_APP_API_URL;

const CamelValue = () => {
    // Leemos cooperativa y año desde localStorage (no se modifican)
    const cooperativa = localStorage.getItem("cooperativaSeleccionada") || "";
    const ano = localStorage.getItem("anoSeleccionado") || "";

    const [calificaciones, setCalificaciones] = useState([]);
    const [valoresCAMEL, setValoresCAMEL] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Preparamos la tabla de pesos para mostrar
    const datosTabla = Object.entries(pesoIndicadores).map(([indicador, peso]) => ({
        Indicador: indicador.replace(/_/g, " ").toUpperCase(),
        "Peso (%)": peso,
        "Peso Decimal": peso / 100,
    }));

    const columnasTabla = ["Indicador", "Peso (%)", "Peso Decimal"];

    // 🔹 Normalizar pesos (garantiza que siempre se use peso/100)
    const mapeoIndicadorPeso = {};
    Object.entries(pesoIndicadores).forEach(([indicador, peso]) => {
        const nombreFormateado = indicador.replace(/_/g, " ").toUpperCase().trim();
        // Detecta si el peso parece estar en porcentaje (> 1)
        const pesoNormalizado = peso > 1 ? peso / 100 : peso;
        mapeoIndicadorPeso[nombreFormateado] = pesoNormalizado;
    });

    // 🔹 Función para obtener calificaciones desde la API
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

            // Transformar los datos: indicadores → filas, meses → columnas
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

            // Calcular valores CAMEL
            calcularValoresCAMEL(data.calificaciones, mapeoIndicadorPeso);
        } catch (err) {
            setError(`Error al obtener calificaciones: ${err.message}`);
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    }, [cooperativa, ano]);

    const enviarValoresCAMEL = async () => {
        try {
            const valores = [];

            for (let mes = 1; mes <= 12; mes++) {
                const valor = parseFloat(valoresCAMEL[0][`Mes ${mes}`]);
                if (!isNaN(valor)) {
                    valores.push({ mes, valor });
                }
            }

            const body = {
                cooperativa,
                ano: parseInt(ano),
                valores_CAMEL: valores,
            };

            console.log("📤 Enviando body al backend:", body);

            const response = await fetch(`${API_URL}/modelos/evaluar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            console.log("📥 Respuesta del servidor:", response);

            const text = await response.text(); // lee incluso si hay error
            console.log("📄 Contenido devuelto:", text);

            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status} - ${text}`);
            }

            const data = JSON.parse(text);
            console.log("📊 Resultados del modelo:", data);
            alert("✅ Evaluación completada. Revisa la consola para ver resultados.");
        } catch (err) {
            console.error("❌ Error al enviar valores CAMEL:", err);
            alert(`Error al evaluar el modelo: ${err.message}`);
        }
    };

    // 🔹 Calcular valores CAMEL mensuales
    const calcularValoresCAMEL = (calificacionesData, mapeoIndicadorPeso) => {
        const valoresCAMELMensuales = { Método: "Valor CAMEL Total" };

        for (let mes = 1; mes <= 12; mes++) {
            let sumaCAMEL = 0;
            let indicadoresValidos = 0;

            Object.entries(calificacionesData).forEach(([indicador, meses]) => {
                const nombreIndicador = indicador.replace(/_/g, " ").toUpperCase().trim();

                // Intentar coincidencia exacta o parcial con los pesos
                const clavePeso = Object.keys(mapeoIndicadorPeso).find(
                    k => nombreIndicador.includes(k) || k.includes(nombreIndicador)
                );

                const peso = mapeoIndicadorPeso[clavePeso];
                const calificacion = meses[mes] ?? meses[`Mes ${mes}`] ?? meses[String(mes)];

                if (peso === undefined) {
                    console.warn(`⚠️ Peso no encontrado para indicador: ${nombreIndicador}`);
                    return;
                }

                if (!isNaN(calificacion)) {
                    sumaCAMEL += calificacion * peso;
                    indicadoresValidos++;
                }
            });

            valoresCAMELMensuales[`Mes ${mes}`] =
                indicadoresValidos > 0 ? sumaCAMEL.toFixed(4) : "-";
        }

        setValoresCAMEL([valoresCAMELMensuales]);
    };

    // 🔹 Ejecutar cálculo al cargar o cambiar cooperativa/año
    useEffect(() => {
        if (cooperativa && ano) {
            obtenerCalificaciones();
        }
    }, [cooperativa, ano, obtenerCalificaciones]);

    // Columnas para las tablas
    const columnasCalificaciones = [
        "Indicador",
        "Mes 1",
        "Mes 2",
        "Mes 3",
        "Mes 4",
        "Mes 5",
        "Mes 6",
        "Mes 7",
        "Mes 8",
        "Mes 9",
        "Mes 10",
        "Mes 11",
        "Mes 12",
    ];

    const columnasCAMEL = [
        "Método",
        "Mes 1",
        "Mes 2",
        "Mes 3",
        "Mes 4",
        "Mes 5",
        "Mes 6",
        "Mes 7",
        "Mes 8",
        "Mes 9",
        "Mes 10",
        "Mes 11",
        "Mes 12",
    ];

    // Etiquetas legibles para meses
    const etiquetasMeses = {
        Indicador: "Indicador",
        Método: "Método",
        "Mes 1": "Enero",
        "Mes 2": "Febrero",
        "Mes 3": "Marzo",
        "Mes 4": "Abril",
        "Mes 5": "Mayo",
        "Mes 6": "Junio",
        "Mes 7": "Julio",
        "Mes 8": "Agosto",
        "Mes 9": "Septiembre",
        "Mes 10": "Octubre",
        "Mes 11": "Noviembre",
        "Mes 12": "Diciembre",
    };

    // Componente para mostrar tablas con etiquetas traducidas
    const TableroConEtiquetas = ({ columnas, datos, etiquetas }) => (
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
                                    <td key={colIndex} className="tablero-cell">
                                        {fila[columna] || "-"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="camel-value-page">
            <Header title="Valor de CAMEL mensual" />
            <div className="input-section">
                <h3>Cooperativa Seleccionada: {cooperativa}</h3>
                <h3>Año: {ano}</h3>

                {!cooperativa && (
                    <div className="warning-message">
                        <p>
                            ⚠️ No hay cooperativa seleccionada. Por favor, selecciona una
                            desde la página principal.
                        </p>
                    </div>
                )}

                {!ano && (
                    <div className="warning-message">
                        <p>
                            ⚠️ No hay año seleccionado. Por favor, selecciona un año desde la
                            página principal.
                        </p>
                    </div>
                )}
            </div>

            {/* Tabla de pesos */}
            <div className="tabla-porcentajes-section">
                <h3>Pesos de los Indicadores CAMEL</h3>
                <Tablero
                    columnas={columnasTabla}
                    datos={datosTabla}
                    obtenerClaseRiesgo={null}
                    onRiesgoChange={null}
                />
            </div>

            {/* Tabla de calificaciones */}
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

            {/* Tabla de resultados CAMEL */}
            {cooperativa && ano && valoresCAMEL.length > 0 && (
                <div className="tabla-valores-camel-section">
                    <h3>Valores CAMEL Mensuales - {cooperativa} - {ano}</h3>
                    <p className="descripcion-camel">
                        Fórmula: CAMEL = Σ(Calificación × (Peso / 100)) para cada mes
                    </p>
                    <TableroConEtiquetas
                        columnas={columnasCAMEL}
                        datos={valoresCAMEL}
                        etiquetas={etiquetasMeses}
                    />
                </div>
            )}
            <button onClick={enviarValoresCAMEL} className="evaluar-modelo-button">
                Evaluar modelo predictivo
            </button>

        </div>
    );
};

export default CamelValue;
