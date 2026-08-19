import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import Tablero from '../../components/tablero';
import './home.css';

const API_URL = process.env.REACT_APP_API_URL;

const Home = () => {
    // Debug: mostrar API_URL
    console.log("API_URL configurado:", API_URL);
    // Estados para los filtros
    const [categoria, setCategoria] = useState("");
    const [cooperativa, setCooperativa] = useState("");
    const [busquedaCooperativa, setBusquedaCooperativa] = useState("");
    const [ano, setAno] = useState("");
    const [categorias, setCategorias] = useState([]);
    const [cooperativas, setCooperativas] = useState([]);
    const [anos, setAnos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterError, setFilterError] = useState("");

    // Estados
    const [datos, setDatos] = useState(() => {
        const datosGuardados = localStorage.getItem('datosTabla');
        return datosGuardados ? JSON.parse(datosGuardados) : [];
    });
    const [riesgos, setRiesgos] = useState({});

    // Cargar años disponibles desde la API
    useEffect(() => {
        const cargarAnos = async () => {
            try {
                console.log("📅 Cargando años desde:", `${API_URL}/anos/`);
                const res = await fetch(`${API_URL}/anos/`);
                const data = await res.json();
                console.log("📅 Años obtenidos:", data);
                // El endpoint retorna {anos: [...], total: N}
                const aniosList = Array.isArray(data.anos) ? data.anos.sort((a, b) => a - b) : [];
                console.log("📅 Años después de procesar:", aniosList);
                setAnos(aniosList);
            } catch (err) {
                console.error("❌ Error cargando años:", err);
                setAnos([]);
            }
        };
        cargarAnos();
    }, []);

    // Cargar cooperativas y extraer categorías únicas
    useEffect(() => {
        const cargarCooperativas = async () => {
            try {
                console.log("🏢 Cargando cooperativas desde:", `${API_URL}/cooperativas/`);
                const res = await fetch(`${API_URL}/cooperativas/`);
                const data = await res.json();
                console.log("🏢 Cooperativas obtenidas:", data.length, "registros");
                setCooperativas(data);
                
                // Extraer categorías únicas
                const categoriasUnicas = [...new Set(data.map(c => c.category).filter(c => c))];
                console.log("📊 Categorías únicas:", categoriasUnicas);
                setCategorias(categoriasUnicas.sort());
            } catch (err) {
                console.error("❌ Error cargando cooperativas:", err);
                setCooperativas([]);
                setCategorias([]);
            }
        };
        cargarCooperativas();
    }, []);

    // Debug: mostrar estado de filtros
    useEffect(() => {
        const botonHabilitado = !ano || (!categoria && !cooperativa) || (categoria && cooperativa) || loading;
        console.log("📊 Estado actual de filtros:");
        console.log("  - Categoría:", categoria || "(vacío)");
        console.log("  - Cooperativa:", cooperativa || "(vacío)");
        console.log("  - Año:", ano || "(vacío)");
        console.log("  - Botón HABILITADO:", !botonHabilitado);
        console.log("  - Modo búsqueda:", categoria ? "POR CATEGORÍA" : cooperativa ? "POR COOPERATIVA" : "NINGUNO");
    }, [categoria, cooperativa, ano, loading]);

    // Cuando se selecciona un filtro, guardar en localStorage para mantener compatibilidad
    useEffect(() => {
        if (ano && (cooperativa || categoria)) {
            localStorage.setItem('anoSeleccionado', ano);
            if (cooperativa) {
                localStorage.setItem('cooperativaSeleccionada', cooperativa);
            }
            if (categoria) {
                localStorage.setItem('categoriaSeleccionada', categoria);
            }
        }
    }, [cooperativa, categoria, ano]);
    const columnas = [
        'Tipo', 'Indicador', 'Enero', 'Febrero', 'Marzo', 'Abril',
        'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre',
        'Noviembre', 'Diciembre', 'Promedio', 'Riesgo Bajo', 'Riesgo Alto'
    ];

    // extraer datos del los indicadores del local storage
    const indicadoresGuardados = () => {
        const datosGuardados = localStorage.getItem('indicadoresIRL_SOLV');
        return datosGuardados ? JSON.parse(datosGuardados) : {};
    };


    // Guardar datos en localStorage cuando cambien
    useEffect(() => {
        if (datos.length > 0) {
            localStorage.setItem('datosTabla', JSON.stringify(datos));
        }
    }, [datos]);

    // Función para aplicar indicadores guardados
    const aplicarIndicadoresGuardados = () => {
        if (!cooperativa || !ano || datos.length === 0) return;
        
        const indicadores = indicadoresGuardados();
        const key = `${cooperativa}|${ano}`;
        
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
                    // Actualizar IRL (datos redondeados de API)
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
                    
                    // Actualizar Solvencia (datos redondeados de API)
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
    }, [cooperativa, ano, datos.length, aplicarIndicadoresGuardados]);

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
    }, [cooperativa, ano, aplicarIndicadoresGuardados]);

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

    // Consultar datos desde la API
    const fetchData = async () => {
        if (!ano || (!categoria && !cooperativa)) {
            setFilterError('Por favor, selecciona un año y una categoría o cooperativa');
            return;
        }
        if (categoria && cooperativa) {
            setFilterError('No puedes seleccionar categoría y cooperativa a la vez');
            return;
        }
        
        setFilterError("");
        setLoading(true);
        try {
            let url = `${API_URL}/registros/completo/?year=${ano}`;
            
            if (cooperativa) {
                url += `&cooperativa_nombre=${cooperativa}`;
            } else if (categoria) {
                url += `&category=${categoria}`;
            }
            
            console.log("🔍 Consultando API:", url);
            const res = await fetch(url);
            
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || 'Error en la API');
            }
            
            const result = await res.json();
            console.log("✅ Datos obtenidos:", result.length, "registros");

            // Acumular valores por indicador/mes para hacer promedio después
            const acumulados = {};
            const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
            
            result.forEach(row => {
                const key = row.nombre_camel + '|' + row.nombre_indicador;
                if (!acumulados[key]) {
                    acumulados[key] = {
                        Tipo: row.nombre_camel,
                        Indicador: row.nombre_indicador,
                        Enero: [], Febrero: [], Marzo: [], Abril: [],
                        Mayo: [], Junio: [], Julio: [], Agosto: [],
                        Septiembre: [], Octubre: [], Noviembre: [], Diciembre: []
                    };
                }
                // Acumular valor en el array del mes correspondiente
                const nombreMes = meses[row.mes - 1];
                acumulados[key][nombreMes].push(row.valor);
            });

            // Convertir arrays a promedios
            const agrupados = {};
            Object.keys(acumulados).forEach(key => {
                agrupados[key] = {
                    Tipo: acumulados[key].Tipo,
                    Indicador: acumulados[key].Indicador,
                    Enero: null, Febrero: null, Marzo: null, Abril: null,
                    Mayo: null, Junio: null, Julio: null, Agosto: null,
                    Septiembre: null, Octubre: null, Noviembre: null, Diciembre: null
                };
                
                meses.forEach(mes => {
                    const valores = acumulados[key][mes];
                    if (valores.length > 0) {
                        const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
                        agrupados[key][mes] = promedio;
                        console.log(`  📊 ${key} - ${mes}: ${valores.length} valor(es) → promedio ${promedio.toFixed(4)}`);
                    }
                });
            });

            const datosFinales = Object.values(agrupados).map(fila => {
                const promedio = calcularPromedio(fila);
                return {
                    ...fila,
                    Promedio: promedio,
                    'Riesgo Alto': promedio + 0.05,
                    'Riesgo Bajo': promedio - 0.01
                };
            });

            const ordenCAMELS = ['C','A','M','E','L','S'];
            const datosOrdenados = datosFinales.sort((a, b) => {
                const indiceA = ordenCAMELS.indexOf(a.Tipo.charAt(0).toUpperCase());
                const indiceB = ordenCAMELS.indexOf(b.Tipo.charAt(0).toUpperCase());
                return indiceA - indiceB;
            });

            setDatos(datosOrdenados);

            const riesgosInit = {};
            datosOrdenados.forEach(row => {
                const key = row.Tipo + '|' + row.Indicador;
                riesgosInit[key] = {
                    bajo: row['Riesgo Bajo'],
                    alto: row['Riesgo Alto']
                };
            });
            setRiesgos(riesgosInit);

            // Después de cargar datos, aplicar los indicadores guardados
            setTimeout(() => aplicarIndicadoresGuardados(), 100);

        } catch (err) {
            setFilterError('Error al consultar la API: ' + err.message);
            console.error("❌ Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Cargar datos automáticamente si hay cooperativa/categoría y año seleccionados
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (ano && (cooperativa || categoria) && datos.length === 0) {
            fetchData();
        }
    }, [ano, cooperativa, categoria]);

    return (
        <div className="home-page">
            <Header title="CAMEL Model - Consulta de Indicadores"/>
            <div className="main-content">
                <div className="info-display">
                    <h3>Filtros de Búsqueda</h3>
                    
                    <div className="filters-container">
                        {/* Filtro Categoría */}
                        <div className="filter-group">
                            <label>Categoría: {cooperativa && <span style={{color: 'red'}}>(deshabilitado)</span>}</label>
                            <select 
                                value={categoria} 
                                onChange={(e) => {
                                    setCategoria(e.target.value);
                                    setCooperativa(""); // Resetear cooperativa cuando cambio categoría
                                }}
                                disabled={cooperativa !== ""}
                            >
                                <option value="">-- Seleccionar Categoría --</option>
                                {categorias.map((cat, idx) => (
                                    <option key={idx} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro Cooperativa */}
                        <div className="filter-group">
                            <label>Cooperativa: {categoria && <span style={{color: 'red'}}>(deshabilitado)</span>}</label>
                            
                            <div className="cooperativa-filter-container">
                                {/* 🔍 Buscador de cooperativas */}
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar..."
                                    value={busquedaCooperativa}
                                    onChange={(e) => setBusquedaCooperativa(e.target.value)}
                                    disabled={categoria !== "" || cooperativas.length === 0}
                                    className="buscar-cooperativa"
                                />
                                
                                <select 
                                    value={cooperativa} 
                                    onChange={(e) => {
                                        setCooperativa(e.target.value);
                                        setBusquedaCooperativa(""); // Limpiar búsqueda al seleccionar
                                        if (e.target.value) {
                                            setCategoria(""); // Resetear categoría cuando selecciono cooperativa
                                        }
                                    }}
                                    disabled={categoria !== "" || cooperativas.length === 0}
                                >
                                    <option value="">-- Seleccionar Cooperativa --</option>
                                    {cooperativas
                                        .filter((coop) => 
                                            coop.name.toLowerCase().includes(busquedaCooperativa.toLowerCase())
                                        )
                                        .map((coop, idx) => (
                                            <option key={idx} value={coop.name}>{coop.name}</option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        {/* Filtro Año */}
                        <div className="filter-group">
                            <label>Año: <span style={{color: 'red'}}>*</span></label>
                            <select 
                                value={ano} 
                                onChange={(e) => setAno(e.target.value)}
                            >
                                <option value="">-- Seleccionar Año --</option>
                                {anos.map((year, idx) => (
                                    <option key={idx} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Botón Buscar - FUERA DEL GRID */}
                    <div style={{marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center'}}>
                        <button 
                            className="search-button"
                            onClick={fetchData}
                            disabled={!ano || (!categoria && !cooperativa) || (categoria && cooperativa) || loading}
                        >
                            {loading ? "⏳ Buscando..." : "🔍 Buscar"}
                        </button>
                        {!ano ? (
                            <span style={{color: '#856404', fontSize: '13px'}}>
                                ⚠️ Selecciona un Año
                            </span>
                        ) : (!categoria && !cooperativa) ? (
                            <span style={{color: '#856404', fontSize: '13px'}}>
                                ⚠️ Selecciona Categoría O Cooperativa (no ambas)
                            </span>
                        ) : null}
                    </div>

                    {filterError && (
                        <div className="warning-message">
                            <p>⚠️ {filterError}</p>
                        </div>
                    )}

                    {loading && (
                        <div className="loading-message">
                            <p>⏳ Cargando datos...</p>
                        </div>
                    )}
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
