import React, { useState, useEffect } from "react";
import Header from "../../components/header";
import { pesoIndicadores } from "../../constants/camelWeights";
import "./RankingCamel.css";

const API_URL = process.env.REACT_APP_API_URL;

const RankingCamel = () => {
  const [anio, setAnio] = useState(2024);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Normalizamos los pesos igual que en CamelValue
  const mapeoIndicadorPeso = {};
  Object.entries(pesoIndicadores).forEach(([indicador, peso]) => {
    const nombreFormateado = indicador.replace(/_/g, " ").toUpperCase().trim();
    mapeoIndicadorPeso[nombreFormateado] = peso > 1 ? peso / 100 : peso;
  });

  const obtenerRanking = async () => {
    setLoading(true);
    setError(null);
    setRanking([]);

    try {
      // 1️⃣ Obtener todas las cooperativas
      const resCoops = await fetch(`${API_URL}/cooperativas`);
      const cooperativas = await resCoops.json();

      const resultados = [];

      // 2️⃣ Para cada cooperativa, obtener sus calificaciones y calcular CAMEL promedio anual
      for (const coop of cooperativas) {
        try {
          const res = await fetch(
            `${API_URL}/predictor/calificacion/${encodeURIComponent(coop.nombre)}?year=${anio}`
          );

          if (!res.ok) continue;

          const data = await res.json();
          const camelMensual = calcularCAMELMensual(data.calificaciones, mapeoIndicadorPeso);
          const promedioAnual = promedio(camelMensual);

          resultados.push({
            nombre: coop.nombre,
            promedioAnual,
          });
        } catch (err) {
          console.warn(`Error con ${coop.nombre}:`, err);
        }
      }

      // 3️⃣ Ordenar y seleccionar top 10
      resultados.sort((a, b) => b.promedioAnual - a.promedioAnual);
      setRanking(resultados.slice(0, 10));
    } catch (err) {
      console.error(err);
      setError("No se pudo obtener el ranking.");
    } finally {
      setLoading(false);
    }
  };

  // --- Función de cálculo CAMEL mensual ---
  const calcularCAMELMensual = (calificacionesData, mapeoIndicadorPeso) => {
    const valores = [];

    for (let mes = 1; mes <= 12; mes++) {
      let sumaCAMEL = 0;
      let indicadoresValidos = 0;

      Object.entries(calificacionesData).forEach(([indicador, meses]) => {
        const nombreIndicador = indicador.replace(/_/g, " ").toUpperCase().trim();
        const clavePeso = Object.keys(mapeoIndicadorPeso).find(
          (k) => nombreIndicador.includes(k) || k.includes(nombreIndicador)
        );
        const peso = mapeoIndicadorPeso[clavePeso];
        const calificacion = meses[mes] ?? meses[`Mes ${mes}`] ?? meses[String(mes)];

        if (peso !== undefined && !isNaN(calificacion)) {
          sumaCAMEL += calificacion * peso;
          indicadoresValidos++;
        }
      });

      if (indicadoresValidos > 0) valores.push(sumaCAMEL);
    }

    return valores;
  };

  const promedio = (valores) =>
    valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;

return (
    <div className="ranking-container">
      <Header title="Ranking CAMEL - Top 10" />

      <div className="controls">
        <label>
          Año:&nbsp;
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
            {[2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <button onClick={obtenerRanking}>Calcular Ranking</button>
      </div>

      {loading && <p className="loading">⏳ Calculando ranking...</p>}
      {error && <p className="error">❌ {error}</p>}

      {!loading && ranking.length > 0 && (
        <table className="ranking-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cooperativa</th>
              <th>Promedio CAMEL</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((coop, index) => (
              <tr key={coop.nombre} className={`rank-${index + 1}`}>
                <td>{index + 1}</td>
                <td>{coop.nombre}</td>
                <td>{coop.promedioAnual.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const thStyle = { border: "1px solid #ccc", padding: "8px", background: "#eee" };
const tdStyle = { border: "1px solid #ccc", padding: "8px" };

export default RankingCamel;