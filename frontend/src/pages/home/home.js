import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import Tablero from '../../components/tablero';
import './home.css';

const API_URL = process.env.REACT_APP_API_URL;

const Home = () => { 
    const [cooperativa, setCooperativa] = useState('');
    const [cooperativas, setCooperativas] = useState([]);
    const [year, setYear] = useState('');
    const [data, setData] = useState([]);
    const [riesgos, setRiesgos] = useState({});
    
    const [columnas, setColumnas] = useState(['Tipo', 'Indicador', 'Enero', 'Febrero', 
                                            'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
                                            'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 
                                            'Diciembre','Promedio','Riesgo Bajo','Riesgo Alto']);
    
    const [datos, setDatos] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/cooperativas/`)
            .then(res => res.json())
            .then(data => setCooperativas(data))
            .catch(() => setCooperativas([]));
    }, []);

    // Función para formatear números a 5 decimales
    const formatearNumero = (numero) => {
        if (numero === null || numero === undefined || numero === '') {
            return 0;
        }
        return parseFloat(parseFloat(numero).toFixed(5));
    };

    // Función para manejar cambios en los valores de riesgo
    const handleRiesgoChange = (filaIndex, columna, nuevoValor) => {
        // FORMATEAR el nuevo valor a 5 decimales
        const valorFormateado = formatearNumero(nuevoValor);
        
        const nuevosDatos = [...datos];
        nuevosDatos[filaIndex][columna] = valorFormateado; // Guardar valor formateado
        
        // Actualizar el objeto de riesgos también
        const fila = nuevosDatos[filaIndex];
        const key = fila.Tipo + '|' + fila.Indicador;
        const nuevosRiesgos = { ...riesgos };
        
        if (columna === 'Riesgo Alto') {
            nuevosRiesgos[key] = { ...nuevosRiesgos[key], alto: valorFormateado };
        } else if (columna === 'Riesgo Bajo') {
            nuevosRiesgos[key] = { ...nuevosRiesgos[key], bajo: valorFormateado };
        }
        
        setDatos(nuevosDatos);
        setRiesgos(nuevosRiesgos);
    };

    //funcion para calcular el promedio
    const calcularPromedio = (fila) => {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const suma = meses.reduce((acc, mes) => acc + (fila[mes] || 0), 0);
        return suma / meses.length;
    };

    //funcion para agragar Riesgo Alto
    const agregarRiesgoAlto = (fila) => {
        return fila.Promedio + 0.05;
    }
    
    //funcion para agragar Riesgo Bajo
    const agregarRiesgoBajo = (fila) => {
        return fila.Promedio - 0.01;
    }

    // Funcion para cambiar el color de cada registro segun el riesgo
    const obtenerClaseRiesgo = (fila, columna) => {
        const columnasRiesgo = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 
                                'Diciembre'];
        
        if (!columnasRiesgo.includes(columna)) {
            return '';
        }

        const valor = fila[columna];
        
        if (valor === null || valor === undefined || isNaN(valor)) {
            return '';
        }

        const riesgoAlto = fila['Riesgo Alto'];
        const riesgoBajo = fila['Riesgo Bajo'];
        const promedioIndicador = (riesgoAlto + riesgoBajo) / 2;

        if (valor >= riesgoAlto) return 'riesgo-alto';
        if (valor >= promedioIndicador && valor < riesgoAlto) return 'riesgo-medio-alto';
        if (valor < promedioIndicador && valor > riesgoBajo) return 'riesgo-medio-bajo';
        if (valor <= riesgoBajo) return 'riesgo-bajo';
        
        return '';
    };

    const fetchData = async (e) => {
        e.preventDefault();
        if (!cooperativa || !year) return;

        try {
            const res = await fetch(
            `${API_URL}/registros/completo/?cooperativa_nombre=${cooperativa}&year=${year}`
            );
            const result = await res.json();
            setData(result);

            // Crear estructura agrupada
            const agrupados = {};
            result.forEach(row => {
            const key = row.nombre_camel + '|' + row.nombre_indicador;
            if (!agrupados[key]) {
                agrupados[key] = {
                Tipo: row.nombre_camel,
                Indicador: row.nombre_indicador,
                Enero: null, Febrero: null, Marzo: null, Abril: null,
                Mayo: null, Junio: null, Julio: null, Agosto: null,
                Septiembre: null, Octubre: null, Noviembre: null, Diciembre: null
                };
            }
            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            agrupados[key][meses[row.mes - 1]] = row.valor;
            });

            // Calcular promedios y riesgos en la misma pasada
            const datosFinales = Object.values(agrupados).map(fila => {
            const promedio = calcularPromedio(fila);
            return {
                ...fila,
                Promedio: promedio,
                'Riesgo Alto': promedio + 0.05,
                'Riesgo Bajo': promedio - 0.01
            };
            });

            // ORDENAR POR PRIMERA LETRA según ['C','A','M','E','L','S']
            const ordenCAMELS = ['C', 'A', 'M', 'E', 'L', 'S'];
            const datosOrdenados = datosFinales.sort((a, b) => {
                const primeraLetraA = a.Tipo.charAt(0).toUpperCase();
                const primeraLetraB = b.Tipo.charAt(0).toUpperCase();
                
                const indiceA = ordenCAMELS.indexOf(primeraLetraA);
                const indiceB = ordenCAMELS.indexOf(primeraLetraB);
                
                return indiceA - indiceB;
            });

            setDatos(datosOrdenados);

            // Inicializar riesgos
            const riesgosInit = {};
            datosOrdenados.forEach(row => {
            const key = row.Tipo + '|' + row.Indicador;
            riesgosInit[key] = {
                bajo: row['Riesgo Bajo'],
                alto: row['Riesgo Alto']
            };
            });
            setRiesgos(riesgosInit);

        } catch (err) {
            alert('Error al consultar la API');
        }
    };
    
    return (
        <div className="home-page">
            <Header title="CAMEL Model - Consulta de Indicadores"/>
            <div className="main-content">
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
                
                <Tablero 
                    columnas={columnas} 
                    datos={datos} 
                    obtenerClaseRiesgo={obtenerClaseRiesgo}
                    onRiesgoChange={handleRiesgoChange}
                />
            </div>
        </div>
    );
}

export default Home;