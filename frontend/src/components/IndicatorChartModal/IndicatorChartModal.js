import React, { useState, useEffect } from 'react';
import './IndicatorChartModal.css';

const API_URL = process.env.REACT_APP_API_URL;

const IndicatorChartModal = ({
  isOpen,
  onClose,
  indicador,
  cooperativa,
  categoria
}) => {
  const [datos, setDatos] = useState([]);
  const [anosDisponibles, setAnosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];

  // Cargar años disponibles al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarDatosHistoricos();
    }
  }, [isOpen, indicador, cooperativa, categoria]);

  const cargarDatosHistoricos = async () => {
    setLoading(true);
    setError(null);

    try {
      // ---------------------------------------------------------
      // 1. Obtener los años disponibles
      // ---------------------------------------------------------
      const resAnos = await fetch(`${API_URL}/anos/`);

      if (!resAnos.ok) {
        throw new Error('Error cargando los años disponibles');
      }

      const dataAnos = await resAnos.json();

      const anios = Array.isArray(dataAnos.anos)
        ? [...dataAnos.anos].sort((a, b) => a - b)
        : [];

      setAnosDisponibles(anios);

      if (anios.length === 0) {
        setDatos([]);
        return;
      }

      // ---------------------------------------------------------
      // 2. Consultar cada año
      // ---------------------------------------------------------
      const consultas = anios.map(async (ano) => {
        let url = `${API_URL}/registros/completo/?year=${ano}`;

        if (cooperativa) {
          url += `&cooperativa_nombre=${encodeURIComponent(cooperativa)}`;
        } else if (categoria) {
          url += `&category=${encodeURIComponent(categoria)}`;
        }

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`Error cargando los datos del año ${ano}`);
        }

        const result = await res.json();

        return {
          ano,
          registros: result
        };
      });

      const resultados = await Promise.all(consultas);

      // ---------------------------------------------------------
      // 3. Construir serie histórica
      // ---------------------------------------------------------
      const datosHistoricos = [];

      resultados.forEach(({ ano, registros }) => {

        // Filtrar únicamente el indicador seleccionado
        const filtrados = registros.filter(
          row => row.nombre_indicador === indicador
        );

        // Agrupar valores por mes
        const porMes = {};

        for (let mes = 1; mes <= 12; mes++) {
          porMes[mes] = [];
        }

        filtrados.forEach(row => {
          const mes = parseInt(row.mes);

          if (mes >= 1 && mes <= 12) {
            const valor = parseFloat(row.valor);

            if (!isNaN(valor)) {
              porMes[mes].push(valor);
            }
          }
        });

        // -------------------------------------------------------
        // Crear los 12 puntos del año
        // -------------------------------------------------------
        for (let mes = 1; mes <= 12; mes++) {

          const valores = porMes[mes];

          let valorPromedio = 0;

          if (valores.length > 0) {
            valorPromedio =
              valores.reduce((a, b) => a + b, 0) /
              valores.length;
          }

          datosHistoricos.push({
            ano: ano,
            mes: mes,
            nombreMes: meses[mes - 1],
            periodo: `${meses[mes - 1].substring(0, 3)} ${ano}`,
            valor: valorPromedio * 100
          });
        }
      });

      // ---------------------------------------------------------
      // 4. Orden cronológico
      // ---------------------------------------------------------
      datosHistoricos.sort((a, b) => {
        if (a.ano !== b.ano) {
          return a.ano - b.ano;
        }

        return a.mes - b.mes;
      });

      setDatos(datosHistoricos);

    } catch (err) {
      setError(err.message);
      console.error('Error cargando histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Dibujar gráfica
  // -------------------------------------------------------------
  const dibujarGrafica = (canvas) => {
    if (!canvas || datos.length === 0) return;

    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    // Limpiar canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // -----------------------------------------------------------
    // Márgenes
    // -----------------------------------------------------------
    const margin = {
      top: 50,
      right: 40,
      bottom: 70,
      left: 70
    };

    const graphWidth =
      width - margin.left - margin.right;

    const graphHeight =
      height - margin.top - margin.bottom;

    // -----------------------------------------------------------
    // Valores
    // -----------------------------------------------------------
    const valores = datos.map(d => d.valor);

    const minDato = Math.min(...valores);
    const maxDato = Math.max(...valores);

    // Agregar un pequeño margen al eje Y
    const diferencia = maxDato - minDato;

    const margenY =
      diferencia === 0
        ? Math.max(Math.abs(maxDato) * 0.1, 1)
        : diferencia * 0.1;

    const minVal = minDato - margenY;
    const maxVal = maxDato + margenY;

    const rango = maxVal - minVal || 1;

    // -----------------------------------------------------------
    // Ejes
    // -----------------------------------------------------------
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    // Eje Y
    ctx.beginPath();
    ctx.moveTo(
      margin.left,
      margin.top
    );

    ctx.lineTo(
      margin.left,
      height - margin.bottom
    );

    ctx.stroke();

    // Eje X
    ctx.beginPath();

    ctx.moveTo(
      margin.left,
      height - margin.bottom
    );

    ctx.lineTo(
      width - margin.right,
      height - margin.bottom
    );

    ctx.stroke();

    // -----------------------------------------------------------
    // Escala Y
    // -----------------------------------------------------------
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 5; i++) {

      const valor =
        minVal + (rango * i / 5);

      const y =
        height -
        margin.bottom -
        (graphHeight * i / 5);

      ctx.fillText(
        valor.toFixed(2) + '%',
        margin.left - 10,
        y
      );

      // Grid
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;

      ctx.beginPath();

      ctx.moveTo(
        margin.left,
        y
      );

      ctx.lineTo(
        width - margin.right,
        y
      );

      ctx.stroke();
    }

    // -----------------------------------------------------------
    // Línea histórica
    // -----------------------------------------------------------
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2.5;

    ctx.beginPath();

    datos.forEach((dato, i) => {

      const x =
        margin.left +
        (
          graphWidth *
          i /
          (datos.length - 1 || 1)
        );

      const y =
        height -
        margin.bottom -
        (
          graphHeight *
          (dato.valor - minVal) /
          rango
        );

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // -----------------------------------------------------------
    // Puntos
    // -----------------------------------------------------------
    ctx.fillStyle = '#1976d2';

    datos.forEach((dato, i) => {

      const x =
        margin.left +
        (
          graphWidth *
          i /
          (datos.length - 1 || 1)
        );

      const y =
        height -
        margin.bottom -
        (
          graphHeight *
          (dato.valor - minVal) /
          rango
        );

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        3,
        0,
        Math.PI * 2
      );

      ctx.fill();
    });

    // -----------------------------------------------------------
    // Eje X
    // Mostrar solamente los años para no saturar el gráfico
    // -----------------------------------------------------------
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const anosMostrados = {};

    datos.forEach((dato, i) => {

      // Mostrar el año solamente en enero
      if (dato.mes === 1) {

        const x =
          margin.left +
          (
            graphWidth *
            i /
            (datos.length - 1 || 1)
          );

        ctx.fillText(
          dato.ano.toString(),
          x,
          height - margin.bottom + 15
        );

        // Línea vertical para separar años
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.moveTo(
          x,
          margin.top
        );

        ctx.lineTo(
          x,
          height - margin.bottom
        );

        ctx.stroke();

        anosMostrados[dato.ano] = true;
      }
    });

    // -----------------------------------------------------------
    // Etiquetas de meses
    // Mostrar algunas etiquetas para evitar saturación
    // -----------------------------------------------------------
    ctx.fillStyle = '#999';
    ctx.font = '10px Arial';

    datos.forEach((dato, i) => {

      // Mostrar cada 3 meses
      if (dato.mes === 1 || dato.mes === 4 ||
          dato.mes === 7 || dato.mes === 10) {

        const x =
          margin.left +
          (
            graphWidth *
            i /
            (datos.length - 1 || 1)
          );

        ctx.fillText(
          dato.nombreMes.substring(0, 3),
          x,
          height - margin.bottom + 38
        );
      }
    });

    // -----------------------------------------------------------
    // Título
    // -----------------------------------------------------------
    ctx.fillStyle = '#000';

    ctx.font = 'bold 14px Arial';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const titulo = cooperativa
      ? `${indicador} - ${cooperativa} (Histórico)`
      : categoria
        ? `${indicador} - ${categoria} (Histórico)`
        : `${indicador} (Histórico)`;

    ctx.fillText(
      titulo,
      width / 2,
      15
    );
  };

  // -------------------------------------------------------------
  // Redibujar cuando cambien los datos
  // -------------------------------------------------------------
  useEffect(() => {

    if (isOpen && datos.length > 0) {

      const canvas =
        document.getElementById('indicator-chart');

      dibujarGrafica(canvas);
    }

  }, [datos, isOpen]);

  // -------------------------------------------------------------
  // Modal cerrado
  // -------------------------------------------------------------
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="modal-header">

          <h2>
            {indicador}
            {cooperativa && ` - ${cooperativa}`}
            {!cooperativa && categoria && ` - ${categoria}`}
          </h2>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ✕
          </button>

        </div>

        {/* Información del histórico */}
        <div className="modal-controls">

          <label>
            Histórico:
          </label>

          <span>
            {anosDisponibles.length > 0
              ? `${anosDisponibles[0]} - ${
                  anosDisponibles[anosDisponibles.length - 1]
                }`
              : 'Cargando años...'}
          </span>

        </div>

        {/* Loading */}
        {loading && (
          <p className="loading-text">
            ⏳ Cargando datos históricos...
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="error-text">
            ❌ Error: {error}
          </p>
        )}

        {/* Gráfica */}
        {!loading && datos.length > 0 && (

          <div className="chart-container">

            <canvas
              id="indicator-chart"
              width={1200}
              height={500}
              style={{
                maxWidth: '100%',
                height: 'auto'
              }}
            />

          </div>

        )}

        {/* Sin datos */}
        {!loading &&
          datos.length === 0 &&
          !error && (

            <p className="no-data-text">
              📭 No hay datos disponibles para este indicador
            </p>

          )}

      </div>
    </div>
  );
};

export default IndicatorChartModal;
