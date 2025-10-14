import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import Tablero from '../../components/tablero';
import './home.css';

const API_URL = process.env.REACT_APP_API_URL;

const Home = () => {
    const [cooperativa, setCooperativa] = useState(() => localStorage.getItem('cooperativaSeleccionada') || 'No seleccionada');
    const [year, setYear] = useState(() => localStorage.getItem('anoSeleccionado') || 'No seleccionado');
    const [datos, setDatos] = useState(() => {
        const datosGuardados = localStorage.getItem('datosTabla');
        return datosGuardados ? JSON.parse(datosGuardados) : [];
    });
    const [riesgos, setRiesgos] = useState({});
    const columnas = [
        'Tipo', 'Indicador', 'Enero', 'Febrero', 'Marzo', 'Abril',
        'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre',
        'Noviembre', 'Diciembre', 'Promedio', 'Riesgo Bajo', 'Riesgo Alto'
    ];

    // extraer datos del los indicadores del local storage
    const indicadoresGuardados = () => {
        const data = localStorage.getItem('indicadoresIRL_SOLV');
        return data ? JSON.parse(data) : {};
    };


    // Sincronizar cooperativa y año desde localStorage
    useEffect(() => {
        const handleStorageUpdate = () => {
            setCooperativa(localStorage.getItem('cooperativaSeleccionada') || 'No seleccionada');
            setYear(localStorage.getItem('anoSeleccionado') || 'No seleccionado');
        };

        // Escuchar cambios en localStorage
        window.addEventListener('storage', handleStorageUpdate);
        
        // También verificar cambios periódicamente (para cambios en la misma pestaña)
        const interval = setInterval(handleStorageUpdate, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageUpdate);
            clearInterval(interval);
        };
    }, []);

    // Guardar datos en localStorage cuando cambien
    useEffect(() => {
        if (datos.length > 0) {
            localStorage.setItem('datosTabla', JSON.stringify(datos));
        }
    }, [datos]);

    // Función para aplicar indicadores guardados
    const aplicarIndicadoresGuardados = () => {
        if (!cooperativa || !year || datos.length === 0) return;
        
        const indicadores = indicadoresGuardados();
        const key = `${cooperativa}|${year}`;
        
        if (indicadores[key]) {
            const { irl, solvencia } = indicadores[key];
            
            // Mapeo de meses (localStorage usa minúsculas, tabla usa mayúsculas)
            const mesesMap = {
                enero: 'Enero', febrero: 'Febrero', marzo: 'Marzo',
                abril: 'Abril', mayo: 'Mayo', junio: 'Junio',
                julio: 'Julio', agosto: 'Agosto', septiembre: 'Septiembre',
                octubre: 'Octubre', noviembre: 'Noviembre', diciembre: 'Diciembre'
            };
            
            setDatos(datosActuales => {
                const nuevosData = [...datosActuales];
                
                nuevosData.forEach(fila => {
                    // Actualizar IRL (sin redondeo adicional, ya viene redondeado de Page2)
                    if (irl && fila.Indicador === 'Indicador de Riesgo de Liquidez - IRL') {
                        Object.keys(irl).forEach(mes => {
                            const mesCapitalizado = mesesMap[mes.toLowerCase()];
                            if (mesCapitalizado && irl[mes] !== null && irl[mes] !== '') {
                                fila[mesCapitalizado] = irl[mes]; // Sin parseFloat, mantener valor original
                            }
                        });
                        // Recalcular promedio (sin redondeo adicional)
                        const promedio = calcularPromedio(fila);
                        fila.Promedio = promedio;
                        fila['Riesgo Alto'] = promedio + 0.05;
                        fila['Riesgo Bajo'] = promedio - 0.01;
                    }
                    
                    // Actualizar Solvencia (sin redondeo adicional, ya viene redondeado de Page2)
                    if (solvencia && (fila.Indicador === 'Relación Solvencia' || fila.Indicador === 'Indicador de Solvencia')) {
                        Object.keys(solvencia).forEach(mes => {
                            const mesCapitalizado = mesesMap[mes.toLowerCase()];
                            if (mesCapitalizado && solvencia[mes] !== null && solvencia[mes] !== '') {
                                fila[mesCapitalizado] = solvencia[mes]; // Sin parseFloat, mantener valor original
                            }
                        });
                        // Recalcular promedio (sin redondeo adicional)
                        const promedio = calcularPromedio(fila);
                        fila.Promedio = promedio;
                        fila['Riesgo Alto'] = promedio + 0.05;
                        fila['Riesgo Bajo'] = promedio - 0.01;
                    }
                });
                
                return nuevosData;
            });
        }
    };

    // useEffect para aplicar indicadores cuando cambien cooperativa, año o datos
    useEffect(() => {
        aplicarIndicadoresGuardados();
    }, [cooperativa, year, datos.length]);

    // useEffect para escuchar cambios en localStorage
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'indicadoresIRL_SOLV') {
                aplicarIndicadoresGuardados();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        // También verificar cambios periódicamente (para cambios en la misma pestaña)
        const interval = setInterval(() => {
            aplicarIndicadoresGuardados();
        }, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [cooperativa, year]);

    // Formatear números (solo para valores de riesgo editables, sin redondeo para mostrar)
    const formatearNumero = (numero) => {
        if (numero === null || numero === undefined || numero === '') return 0;
        return parseFloat(numero);
    };

    // Cambios en valores de riesgo
    const handleRiesgoChange = (filaIndex, columna, nuevoValor) => {
        const valorFormateado = formatearNumero(nuevoValor);
        const nuevosDatos = [...datos];
        nuevosDatos[filaIndex][columna] = valorFormateado;

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

    // Calcular promedio (sin redondeo adicional, acepta valores ya redondeados)
    const calcularPromedio = (fila) => {
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
            'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const suma = meses.reduce((acc, mes) => acc + (parseFloat(fila[mes]) || 0), 0);
        return suma / meses.length; // Sin redondeo adicional
    };

    // Colorear según riesgo
    const obtenerClaseRiesgo = (fila, columna) => {
        const columnasRiesgo = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
            'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        if (!columnasRiesgo.includes(columna)) return '';

        const valor = fila[columna];
        if (valor === null || valor === undefined || isNaN(valor)) return '';

        const riesgoAlto = fila['Riesgo Alto'];
        const riesgoBajo = fila['Riesgo Bajo'];
        const promedioIndicador = (riesgoAlto + riesgoBajo) / 2;

        if (valor >= riesgoAlto) return 'riesgo-alto';
        if (valor >= promedioIndicador && valor < riesgoAlto) return 'riesgo-medio-alto';
        if (valor < promedioIndicador && valor > riesgoBajo) return 'riesgo-medio-bajo';
        if (valor <= riesgoBajo) return 'riesgo-bajo';
        return '';
    };

    return (
        <div className="home-page">
            <Header title="CAMEL Model - Consulta de Indicadores"/>
            <div className="main-content">
                <div className="info-display">
                    <h3>Cooperativa Seleccionada: {cooperativa}</h3>
                    <h3>Año: {year}</h3>
                    <p><em>Para cambiar la cooperativa o año, ve a la página de "Cálculo de IRL y Solvencia"</em></p>
                </div>
                <Tablero
                    columnas={columnas}
                    datos={datos}
                    obtenerClaseRiesgo={obtenerClaseRiesgo}
                    onRiesgoChange={handleRiesgoChange}
                />
            </div>
        </div>
    );
};

export default Home;
