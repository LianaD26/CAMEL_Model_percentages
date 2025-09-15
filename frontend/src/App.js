import React, { useState, useEffect } from 'react';
import './App.css';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function App() {
  const [cooperativa, setCooperativa] = useState('');
  const [cooperativas, setCooperativas] = useState([]);
  const [year, setYear] = useState('');
  const [data, setData] = useState([]);
  const [riesgos, setRiesgos] = useState({});

  useEffect(() => {
    fetch('http://localhost:8000/cooperativas/')
      .then(res => res.json())
      .then(data => setCooperativas(data))
      .catch(() => setCooperativas([]));
  }, []);

  const fetchData = async (e) => {
    e.preventDefault();
    if (!cooperativa || !year) return;
    try {
      const res = await fetch(
        `http://localhost:8000/registros/completo/?cooperativa_nombre=${cooperativa}&year=${year}`
      );
      const result = await res.json();
      setData(result);

      const riesgosInit = {};
      result.forEach(row => {
        const key = row.nombre_camel + '|' + row.nombre_indicador;
        if (!riesgosInit[key]) {
          riesgosInit[key] = { bajo: 0.0, alto: 1.0 };
        }
      });
      setRiesgos(riesgosInit);
    } catch (err) {
      alert('Error al consultar la API');
    }
  };

  const agrupados = {};
  data.forEach(row => {
    const key = row.nombre_camel + '|' + row.nombre_indicador;
    if (!agrupados[key]) {
      agrupados[key] = {
        nombre_camel: row.nombre_camel,
        nombre_indicador: row.nombre_indicador,
        valores: Array(12).fill(null)
      };
    }
    agrupados[key].valores[row.mes - 1] = row.valor;
  });

  const handleRiesgoChange = (key, tipo, value) => {
    setRiesgos(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [tipo]: parseFloat(value) || 0.0
      }
    }));
  };

  return (
    <>
      {/* Header fuera del contenedor principal, ocupa 100% del ancho */}
      <div className="header-container">
        <h1 className="main-header">
          CAMEL Model - Consulta de Indicadores
        </h1>
      </div>

      <div className="App">
        {/* Formulario de búsqueda */}
        <form onSubmit={fetchData} className="search-form">
          <select
            value={cooperativa}
            onChange={e => setCooperativa(e.target.value)}
            required
          >
            <option value="">Seleccione una cooperativa</option>
            {cooperativas.map(c => (
              <option key={c.ID_cooperativa} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Año"
            value={year}
            onChange={e => setYear(e.target.value)}
            required
          />
          <button type="submit">Consultar</button>
        </form>

        {/* Tabla de resultados */}
        <div className="table-container">
          <table className="result-table" border="1">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nombre Indicador</th>
                {MESES.map(m => <th key={m}>{m}</th>)}
                <th>Riesgo Bajo</th>
                <th>Riesgo Alto</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(agrupados).map(([key, row]) => {
                const riesgo = riesgos[key] || { bajo: 0.0, alto: 1.0 };

                return (
                  <tr key={key}>
                    <td>{row.nombre_camel}</td>
                    <td>{row.nombre_indicador}</td>
                    {row.valores.map((valor, i) => {
                      let color = '';
                      if (typeof valor === 'number') {
                        if (valor < riesgo.bajo) color = '#ffcccc';       // rojo claro
                        else if (valor >= riesgo.bajo && valor <= riesgo.alto) color = '#ccffcc'; // verde claro
                        else if (valor > riesgo.alto) color = '#00ff00'; // verde fuerte
                      }
                      return (
                        <td key={i} className={color ? 'cell-color' : ''} style={color ? { background: color } : {}}>
                          {typeof valor === 'number' ? valor.toFixed(3) : ''}
                        </td>
                      );
                    })}
                    <td>
                      <input
                        type="number"
                        step="0.001"
                        value={riesgo.bajo}
                        onChange={e => handleRiesgoChange(key, 'bajo', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.001"
                        value={riesgo.alto}
                        onChange={e => handleRiesgoChange(key, 'alto', e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default App;
