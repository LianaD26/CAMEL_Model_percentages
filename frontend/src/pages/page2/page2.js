import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import Tablero from '../../components/tablero';
import './page2.css';

const API_URL = process.env.REACT_APP_API_URL;

const Page2 = () => {
<<<<<<< HEAD
    // Estados para cooperativa y año
    const [cooperativa, setCooperativa] = useState(localStorage.getItem('cooperativaSeleccionada') || '');
    const [ano, setAno] = useState(localStorage.getItem('anoSeleccionado') || '');
    
    // Estados para las listas de cooperativas y años
    const [cooperativas, setCooperativas] = useState([]);
    const [anios, setAnios] = useState([]);
    
=======
>>>>>>> 01a9bb3ab76d041936b48f1e23bdd1d43a8017ad
    // Estados para los datos de IRL y Solvencia
    const [datosIrl, setDatosIrl] = useState({
        enero: '0', febrero: '0', marzo: '0', abril: '0', mayo: '0', junio: '0',
        julio: '0', agosto: '0', septiembre: '0', octubre: '0', noviembre: '0', diciembre: '0'
    });
    
    const [datosSolvencia, setDatosSolvencia] = useState({
        enero: '0', febrero: '0', marzo: '0', abril: '0', mayo: '0', junio: '0',
        julio: '0', agosto: '0', septiembre: '0', octubre: '0', noviembre: '0', diciembre: '0'
    });

<<<<<<< HEAD
    // Función para calcular promedio (sin redondeo, solo para cálculo)
=======
    // Función para calcular promedio
>>>>>>> 01a9bb3ab76d041936b48f1e23bdd1d43a8017ad
    const calcularPromedio = (datos) => {
        const valores = Object.values(datos).filter(valor => valor !== '' && !isNaN(valor));
        if (valores.length === 0) return 0;
        const suma = valores.reduce((acc, val) => acc + parseFloat(val), 0);
<<<<<<< HEAD
        return suma / valores.length; // Sin redondeo
=======
        return (suma / valores.length).toFixed(2);
>>>>>>> 01a9bb3ab76d041936b48f1e23bdd1d43a8017ad
    };

    // Columnas de la tabla
    const columnas = ['Indicador', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Promedio'];

    // Preparar datos para la tabla
    const datosTabla = [
        {
            Indicador: 'IRL',
            Enero: datosIrl.enero,
            Febrero: datosIrl.febrero,
            Marzo: datosIrl.marzo,
            Abril: datosIrl.abril,
            Mayo: datosIrl.mayo,
            Junio: datosIrl.junio,
            Julio: datosIrl.julio,
            Agosto: datosIrl.agosto,
            Septiembre: datosIrl.septiembre,
            Octubre: datosIrl.octubre,
            Noviembre: datosIrl.noviembre,
            Diciembre: datosIrl.diciembre,
            Promedio: calcularPromedio(datosIrl)
        },
        {
            Indicador: 'Solvencia',
            Enero: datosSolvencia.enero,
            Febrero: datosSolvencia.febrero,
            Marzo: datosSolvencia.marzo,
            Abril: datosSolvencia.abril,
            Mayo: datosSolvencia.mayo,
            Junio: datosSolvencia.junio,
            Julio: datosSolvencia.julio,
            Agosto: datosSolvencia.agosto,
            Septiembre: datosSolvencia.septiembre,
            Octubre: datosSolvencia.octubre,
            Noviembre: datosSolvencia.noviembre,
            Diciembre: datosSolvencia.diciembre,
            Promedio: calcularPromedio(datosSolvencia)
        }
    ];

    // Función para manejar cambios en inputs de IRL
    const handleIrlChange = (mes, valor) => {
<<<<<<< HEAD
        // Redondear a 5 decimales en Page2 
        const valorRedondeado = valor === '' ? '' : parseFloat(parseFloat(valor).toFixed(5));
        setDatosIrl(prev => ({
            ...prev,
            [mes]: valorRedondeado
=======
        setDatosIrl(prev => ({
            ...prev,
            [mes]: valor
>>>>>>> 01a9bb3ab76d041936b48f1e23bdd1d43a8017ad
        }));
    };

    // Función para manejar cambios en inputs de Solvencia
    const handleSolvenciaChange = (mes, valor) => {
<<<<<<< HEAD
        // Redondear a 5 decimales en Page2 (única fuente de redondeo)
        const valorRedondeado = valor === '' ? '' : parseFloat(parseFloat(valor).toFixed(5));
        setDatosSolvencia(prev => ({
            ...prev,
            [mes]: valorRedondeado
        }));
    };

    // Función para guardar datos en localStorage
    const guardarDatos = () => {
        if (!cooperativa || !ano) {
            alert('Debe seleccionar una cooperativa y un año');
            return;
        }
        // Estructura: { "cooperativa|año": { irl: {...}, solvencia: {...} } }
        const key = `${cooperativa}|${ano}`;
        const datosGuardados = JSON.parse(localStorage.getItem('indicadoresIRL_SOLV') || '{}');
        datosGuardados[key] = {
            irl: datosIrl,
            solvencia: datosSolvencia
        };
        localStorage.setItem('indicadoresIRL_SOLV', JSON.stringify(datosGuardados));
        alert(`Datos guardados exitosamente para ${cooperativa} - ${ano}`);
    };

    // extraer datos guardados al montar
    const extraerDatosGuardados = () => {
        const key = `${cooperativa}|${ano}`;
        const datosGuardados = JSON.parse(localStorage.getItem('indicadoresIRL_SOLV') || '{}');
        if (datosGuardados[key]) {
            setDatosIrl(datosGuardados[key].irl);
            setDatosSolvencia(datosGuardados[key].solvencia);
        } else {
            // Si no hay datos guardados, inicializar en 0
            setDatosIrl({
                enero: '0', febrero: '0', marzo: '0', abril: '0', mayo: '0', junio: '0',
                julio: '0', agosto: '0', septiembre: '0', octubre: '0', noviembre: '0', diciembre: '0'
            });
            setDatosSolvencia({
                enero: '0', febrero: '0', marzo: '0', abril: '0', mayo: '0', junio: '0',
                julio: '0', agosto: '0', septiembre: '0', octubre: '0', noviembre: '0', diciembre: '0'
            });
        }
    };

    // Cargar cooperativas y años al montar el componente
    useEffect(() => {
        fetch(`${API_URL}/cooperativas/`)
            .then(res => res.json())
            .then(setCooperativas)
            .catch(() => setCooperativas([]));

        fetch(`${API_URL}/anos/`)
            .then(res => res.json())
            .then(data => setAnios(data.anos || []))
            .catch(() => setAnios([]));
    }, []);

    // Guardar selección en localStorage cuando cambien
    useEffect(() => {
        if (cooperativa) localStorage.setItem('cooperativaSeleccionada', cooperativa);
        if (ano) localStorage.setItem('anoSeleccionado', ano);
    }, [cooperativa, ano]);

    // Extraer datos guardados cuando cambien cooperativa o año
    useEffect(() => {
        if (cooperativa && ano) {
            extraerDatosGuardados();
        }
    }, [cooperativa, ano]);

=======
        setDatosSolvencia(prev => ({
            ...prev,
            [mes]: valor
        }));
    };

>>>>>>> 01a9bb3ab76d041936b48f1e23bdd1d43a8017ad
    return (
        <div className="irl-solvencia-container"> 
            <Header title="Cálculo de los indicadores de IRL y Solvencia"/>
            {/* Formularios de entrada */}
            <div className="input-section">
<<<<<<< HEAD

                <div className='info-selected-and-saved'>
                    <h3>Seleccione Cooperativa y Año:</h3>
                    <div className="search-form">
                        <select
                            value={cooperativa}
                            onChange={e => setCooperativa(e.target.value)}
                            required
                        >
                            <option value="">Seleccione una cooperativa</option>
                            {cooperativas.map(c => (
                                <option key={c.ID_cooperativa} value={c.nombre}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                        <select
                            value={ano}
                            onChange={e => setAno(e.target.value)}
                            required
                        >
                            <option value="">Seleccione un año</option>
                            {anios.map((a, index) => (
                                <option key={index} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={guardarDatos}>Guardar Datos</button>
                </div>

=======
>>>>>>> 01a9bb3ab76d041936b48f1e23bdd1d43a8017ad
                <h3>Ingrese los datos de IRL por mes:</h3>
                <div className="input-grid">
                    {Object.keys(datosIrl).map(mes => (
                        <div key={mes} className="input-group">
                            <label>{mes.charAt(0).toUpperCase() + mes.slice(1)}:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={datosIrl[mes]}
                                onChange={(e) => handleIrlChange(mes, e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    ))}
                </div>

                <h3>Ingrese los datos de Solvencia por mes:</h3>
                <div className="input-grid">
                    {Object.keys(datosSolvencia).map(mes => (
                        <div key={mes} className="input-group">
                            <label>{mes.charAt(0).toUpperCase() + mes.slice(1)}:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={datosSolvencia[mes]}
                                onChange={(e) => handleSolvenciaChange(mes, e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabla con los resultados */}
            <Tablero columnas={columnas} datos={datosTabla} />
        </div>
    );
};

export default Page2;