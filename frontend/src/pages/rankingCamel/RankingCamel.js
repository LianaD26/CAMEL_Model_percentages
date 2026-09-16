import React, { useState, useEffect } from "react";
import Header from "../../components/header";
import "./RankingCamel.css";

const API_URL = process.env.REACT_APP_API_URL;

const RankingCamel = () => {
  const [resultados, setResultados] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("General");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  // Cargar resultados al montar el componente
  useEffect(() => {
    const cargarResultados = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/camels/resultados/ranking-json`);
        if (!response.ok) {
          throw new Error("No se han calculado resultados CAMEL aún");
        }
        const data = await response.json();
        console.log("📊 Datos de resultados CAMEL:", data);
        setResultados(data.datos);

        // Establecer la primera categoría disponible
        const categorias = Object.keys(data.datos);
        if (categorias.length > 0) {
          setCategoriaSeleccionada(categorias[0]);
        }
      } catch (err) {
        setError(err.message);
        console.error("❌ Error cargando resultados CAMEL:", err);
      } finally {
        setLoading(false);
      }
    };

    cargarResultados();
  }, []);

  // Obtener datos de la categoría seleccionada
  const datosCategoria = resultados?.[categoriaSeleccionada];

  // Filtrar cooperativas según búsqueda
  const cooperativasFiltradas = datosCategoria?.cooperativas?.filter((coop) =>
    coop.nombre_cooperativa.toLowerCase().includes(busqueda.toLowerCase())
  ) || [];

  return (
    <div className="ranking-camel-container">
      <Header title="Ranking CAMEL - Clasificación de Cooperativas" />

      {loading && <p className="loading-message">⏳ Cargando resultados CAMEL...</p>}

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      )}

      {resultados && (
        <section className="ranking-section">
          <h2>📊 Resultados CAMEL por Categoría</h2>

          {/* Selector de Categoría */}
          <div className="categoria-selector">
            <label>Seleccionar Categoría:</label>
            <select
              value={categoriaSeleccionada}
              onChange={(e) => {
                setCategoriaSeleccionada(e.target.value);
                setBusqueda(""); // Limpiar búsqueda al cambiar categoría
              }}
            >
              {Object.keys(resultados).map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          {/* Información de la Categoría */}
          {datosCategoria && (
            <>
              <div className="categoria-info">
                <div className="info-item">
                  <span className="info-label">Categoría:</span>
                  <span className="info-value">{datosCategoria.categoria}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Cantidad de Cooperativas:</span>
                  <span className="info-value">{datosCategoria.cantidad_cooperativas}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Cantidad de Registros:</span>
                  <span className="info-value">{datosCategoria.cantidad_registros}</span>
                </div>
              </div>

              {/* Tabla de Cooperativas */}
              <div className="cooperativas-table-section">
                <div className="tabla-header">
                  <h3>Cooperativas - Resultado CAMEL</h3>
                  <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Buscar cooperativa..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>
                <p className="resultados-info">
                  Mostrando {cooperativasFiltradas.length} de {datosCategoria.cooperativas.length} cooperativas
                </p>
                {cooperativasFiltradas.length > 0 ? (
                  <table className="cooperativas-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Cooperativa</th>
                        <th>Resultado CAMEL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cooperativasFiltradas.map((coop, index) => (
                        <tr key={coop.id_cooperative}>
                          <td>{index + 1}</td>
                          <td>{coop.nombre_cooperativa}</td>
                          <td>{coop.result.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data-message">
                    {busqueda
                      ? `📭 No se encontraron cooperativas que coincidan con "${busqueda}"`
                      : "📭 No hay cooperativas para esta categoría"}
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default RankingCamel;
