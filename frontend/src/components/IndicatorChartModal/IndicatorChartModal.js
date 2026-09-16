import React, { useState, useEffect } from 'react';
import './IndicatorChartModal.css';

const API_URL = process.env.REACT_APP_API_URL;

const IndicatorChartModal = ({ isOpen, onClose, indicador, cooperativa, categoria }) => {
  const [datos, setDatos] = useState([]);
  const [anoSeleccionado, setAnoSeleccionado] = useState(new Date().getFullYear());
  const [anosDisponibles, setAnosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Cargar años disponibles al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarAnosDisponibles();
    }
  }, [isOpen]);

  // Cargar datos cuando cambia año, indicador o cooperativa
  useEffect(() => {
    if (isOpen && indicador) {
      cargarDatos();
    }
  }, [anoSeleccionado, indicador, cooperativa, categoria, isOpen]);

  const cargarAnosDisponibles = async () => {
    try {
      const res = await fetch(`${API_URL}/anos/`);
      const data = await res.json();
      const anios = Array.isArray(data.anos) ? data.anos.sort((a, b) => b - a) : [];
      setAnosDisponibles(anios);
      if (anios.length > 0) {
        setAnoSeleccionado(anios[0]);
      }
    } catch (err) {
      console.error("Error cargando años:", err);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_URL}/registros/completo/?year=${anoSeleccionado}`;
      
      if (cooperativa) {
        url += `&cooperativa_nombre=${cooperativa}`;
      } else if (categoria) {
        url += `&category=${categoria}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Error cargando datos');

      const result = await res.json();
      
      // Filtrar por indicador
      const filtrados = result.filter(row => row.nombre_indicador === indicador);
      
      // Agrupar por mes
      const porMes = {};
      meses.forEach(mes => porMes[mes] = []);
      
      filtrados.forEach(row => {
        const nombreMes = meses[row.mes - 1];
        if (nombreMes) {
          porMes[nombreMes].push(row.valor);
        }
      });

      // Calcular promedios
      const datosGrafica = meses.map(mes => ({
        mes: mes.substring(0, 3), // Abreviar mes
        valor: porMes[mes].length > 0 
          ? (porMes[mes].reduce((a, b) => a + b, 0) / porMes[mes].length) * 100
          : 0
      }));

      setDatos(datosGrafica);
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const dibujarGrafica = (canvas) => {
    if (!canvas || datos.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Limpiar canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Márgenes
    const margin = { top: 40, right: 30, bottom: 40, left: 60 };
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    // Encontrar min y max
    const valores = datos.map(d => d.valor);
    const minVal = Math.min(...valores);
    const maxVal = Math.max(...valores);
    const rango = maxVal - minVal || 1;

    // Dibujar ejes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    // Eje Y
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();

    // Eje X
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Escala en Y
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 5; i++) {
      const valor = minVal + (rango * i / 5);
      const y = height - margin.bottom - (graphHeight * i / 5);
      
      ctx.fillText(valor.toFixed(2) + '%', margin.left - 10, y);
      
      // Línea de grid
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }

    // Dibujar línea
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 3;

    for (let i = 0; i < datos.length; i++) {
      const x = margin.left + (graphWidth * i / (datos.length - 1 || 1));
      const y = height - margin.bottom - (graphHeight * (datos[i].valor - minVal) / rango);

      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Etiquetas X (meses)
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '12px Arial';

    datos.forEach((d, i) => {
      const x = margin.left + (graphWidth * i / (datos.length - 1 || 1));
      ctx.fillText(d.mes, x, height - margin.bottom + 10);
    });

    // Título
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const titulo = cooperativa ? `${indicador} - ${cooperativa} (${anoSeleccionado})` : `${indicador} - ${anoSeleccionado}`;
    ctx.fillText(titulo, width / 2, 10);
  };

  useEffect(() => {
    if (isOpen && datos.length > 0) {
      const canvas = document.getElementById('indicator-chart');
      dibujarGrafica(canvas);
    }
  }, [datos]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{indicador} {cooperativa && `- ${cooperativa}`}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-controls">
          <label>Seleccionar Año:</label>
          <select
            value={anoSeleccionado}
            onChange={(e) => setAnoSeleccionado(parseInt(e.target.value))}
            disabled={loading}
          >
            {anosDisponibles.map(ano => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        </div>

        {loading && <p className="loading-text">⏳ Cargando datos...</p>}
        
        {error && <p className="error-text">❌ Error: {error}</p>}

        {!loading && datos.length > 0 && (
          <div className="chart-container">
            <canvas
              id="indicator-chart"
              width={700}
              height={400}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        )}

        {!loading && datos.length === 0 && !error && (
          <p className="no-data-text">📭 No hay datos disponibles para este indicador</p>
        )}
      </div>
    </div>
  );
};

export default IndicatorChartModal;
