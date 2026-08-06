import pandas as pd
import json
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from app.services.cargar_datos_pca import (
    obtener_datos_pca_por_categoria,
    obtener_todas_las_categorias
)


def pesos_pca_grupo_coops(
    df,
    lista_coops,
    col_nombre="ID_cooperativa",
    nombre_col_categoria="categoria",
    categoria="General",
    n_componentes=3
):
    
    # filtrar cooperativas
    df_filtrado = df[df[col_nombre].isin(lista_coops)].copy()
    
    # Si NO es General, filtrar por categoría específica
    if categoria != "General":
        df_filtrado = df_filtrado[df_filtrado[nombre_col_categoria] == categoria].copy()
    
    if df_filtrado.empty:
        raise ValueError("No hay datos para las cooperativas indicadas")
    
    # LIMPIEZA 
    df_filtrado["valor"] = (
        df_filtrado["valor"]
        .astype(str)
        .str.replace(",", "", regex=False)
        .str.strip()
    )
    
    df_filtrado["valor"] = pd.to_numeric(df_filtrado["valor"], errors="coerce")
    
    # pivot (matriz indicadores)
    df_pivot = df_filtrado.pivot_table(
        index=col_nombre,
        columns="ID_indicador",
        values="valor",
        aggfunc="mean"
    )
    
    # Validar que hay suficientes muestras y características
    n_samples, n_features = df_pivot.shape
    if n_samples < 2:
        raise ValueError(f"Insuficientes muestras ({n_samples}) para PCA")
    
    # Ajustar n_componentes si excede los límites
    n_comps_valido = min(n_componentes, n_samples - 1, n_features)
    if n_comps_valido < 1:
        raise ValueError(f"No hay suficientes datos: {n_samples} muestras, {n_features} características")
    
    # imputar faltantes
    imputer = SimpleImputer(strategy="mean")
    X_imputed = imputer.fit_transform(df_pivot)
    
    # escalar
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imputed)
    
    # PCA
    pca = PCA(n_components=n_comps_valido)
    pca.fit(X_scaled)
    
    loadings = pd.DataFrame(
        pca.components_.T,
        index=df_pivot.columns
    )
    
    pesos = (loadings**2).mean(axis=1)
    
    # porcentaje
    pesos = (pesos / pesos.sum()) 
    
    return pesos.sort_values(ascending=False)


# ============================================================================
# FUNCIONES DE INTEGRACIÓN: Cálculo + Guardado de Resultados PCA
# ============================================================================

def obtener_ruta_json_resultados() -> Path:
    """
    Obtiene la ruta del archivo JSON de resultados PCA.
    Crea el directorio si no existe.
    
    Returns:
        Path al archivo pca_resultados.json
    """
    base_dir = Path(__file__).parent.parent.parent
    data_dir = base_dir / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    
    return data_dir / "pca_resultados.json"


def calcular_pesos_pca_categoria(
    db: Session,
    categoria: str = None,
    anio: int = None,
    n_componentes: int = 3
) -> dict:
    """
    Calcula los pesos PCA para una categoría específica o para todas (General).
    
    Args:
        db: Sesión de SQLAlchemy
        categoria: Categoría de cooperativas (None para "General" = todas)
        anio: Año específico (opcional)
        n_componentes: Número de componentes PCA
    
    Returns:
        Diccionario con los pesos: {ID_indicador: peso}
    """
    
    try:
        if categoria is None:
            # Caso General: traer todas las cooperativas sin filtrar por categoría
            from app.services.cargar_datos_pca import obtener_datos_para_pca
            df = obtener_datos_para_pca(db, anio=anio)
            lista_coops = df["ID_cooperativa"].unique().tolist()
            categoria_filtro = "General"
        else:
            # Caso específico: traer por categoría
            df, lista_coops = obtener_datos_pca_por_categoria(
                db, 
                categoria=categoria, 
                anio=anio
            )
            categoria_filtro = categoria
        
        # Validar que hay suficientes datos para PCA
        if len(lista_coops) < 2:
            return {"error": f"Insuficientes cooperativas ({len(lista_coops)}) para calcular PCA"}
        
        # Ajustar n_componentes si es necesario
        n_comps_ajustado = min(n_componentes, len(lista_coops) - 1)
        if n_comps_ajustado < 1:
            n_comps_ajustado = 1
        
        pesos = pesos_pca_grupo_coops(
            df,
            lista_coops,
            col_nombre="ID_cooperativa",
            nombre_col_categoria="categoria",
            categoria=categoria_filtro,
            n_componentes=n_comps_ajustado
        )
        
        return pesos.to_dict()
        
    except Exception as e:
        return {"error": str(e)}


def calcular_pesos_pca_todas_categorias(
    db: Session,
    anio: int = None,
    n_componentes: int = 3
) -> dict:
    """
    Calcula pesos PCA para TODAS las categorías INCLUYENDO la General.
    
    Args:
        db: Sesión de SQLAlchemy
        anio: Año específico (opcional)
        n_componentes: Número de componentes PCA
    
    Returns:
        Diccionario con estructura: {categoria: {ID_indicador: peso}}
        Incluye "General" + todas las categorías individuales
    """
    
    resultados = {}
    
    # 1. PRIMERO: Calcular PCA General (mezcla de todas las categorías)
    pesos_general = calcular_pesos_pca_categoria(
        db,
        categoria=None,  # None = todas las cooperativas
        anio=anio,
        n_componentes=n_componentes
    )
    resultados["General"] = pesos_general
    
    # 2. LUEGO: Calcular PCA para cada categoría individual
    categorias = obtener_todas_las_categorias(db)
    for categoria in categorias:
        pesos = calcular_pesos_pca_categoria(
            db,
            categoria=categoria,
            anio=anio,
            n_componentes=n_componentes
        )
        resultados[categoria] = pesos
    
    return resultados


def guardar_resultados_pca_json(
    resultados: dict,
    anio: int = None,
    timestamp: bool = True
) -> dict:
    """
    Guarda los resultados PCA en JSON (SOBRESCRIBE archivo anterior).
    
    Args:
        resultados: Diccionario con los pesos PCA
        anio: Año para metadata (opcional)
        timestamp: Si incluir timestamp en los resultados
    
    Returns:
        Diccionario con información del guardado
    """
    
    ruta_json = obtener_ruta_json_resultados()
    
    # Preparar entrada con metadata
    entrada = {
        "resultados": resultados,
        "anio": anio,
    }
    
    if timestamp:
        entrada["timestamp"] = datetime.now().isoformat()
    
    # SOBRESCRIBIR: Crear diccionario limpio sin datos antiguos
    datos_completos = {
        "ultimoCalculo": entrada
    }
    
    # Escribir archivo (SOBRESCRIBE completamente)
    with open(ruta_json, "w", encoding="utf-8") as f:
        json.dump(datos_completos, f, indent=2, ensure_ascii=False)
    
    return {
        "exito": True,
        "ruta": str(ruta_json),
        "clave_guardada": "ultimoCalculo",
        "categorias_guardadas": list(resultados.keys())
    }


def calcular_y_guardar_pesos_pca(
    db: Session,
    anio: int = None,
    n_componentes: int = 3
) -> dict:
    """
    FUNCIÓN PRINCIPAL: Calcula pesos PCA para todas las categorías
    y los guarda en JSON automáticamente con metadata enriquecida.
    
    Conecta: cargar_datos_pca → pca.py → enriquecimiento → JSON
    
    Args:
        db: Sesión de SQLAlchemy
        anio: Año específico (opcional)
        n_componentes: Número de componentes PCA
    
    Returns:
        Diccionario con resumen del proceso
    """
    
    try:
        # 1. Calcular pesos para todas las categorías
        resultados = calcular_pesos_pca_todas_categorias(
            db,
            anio=anio,
            n_componentes=n_componentes
        )
        
        # 2. Enriquecer resultados con metadata
        resultados_enriquecidos = enriquecer_resultados_pca(
            db,
            resultados,
            anio=anio
        )
        
        # 3. Guardar en JSON
        info_guardado = guardar_resultados_pca_json(
            resultados_enriquecidos,
            anio=anio,
            timestamp=True
        )
        
        return {
            "exito": True,
            "mensaje": f"PCA calculado y guardado exitosamente",
            "resultados": resultados_enriquecidos,
            "guardado": info_guardado
        }
        
    except Exception as e:
        return {
            "exito": False,
            "mensaje": f"Error al calcular y guardar PCA: {str(e)}",
            "error": str(e)
        }


def enriquecer_resultados_pca(
    db: Session,
    resultados_pca: dict,
    anio: int = None
) -> dict:
    """
    Enriquece los resultados PCA con metadata: cantidad de cooperativas, 
    registros, nombre del indicador y categoría CAMEL.
    
    Args:
        db: Sesión de SQLAlchemy
        resultados_pca: Diccionario con {categoria: {ID_indicador: peso}}
        anio: Año específico (opcional)
    
    Returns:
        Diccionario enriquecido con estructura:
        {
            categoria: {
                cantidad_cooperativas: int,
                cantidad_registros: int,
                pesos: {
                    ID_indicador: {
                        nombre_indicador: str,
                        categoria_camel: str,
                        peso: float,
                        peso_porcentaje: float
                    }
                }
            }
        }
    """
    from app.models.indicador import Indicador
    from app.models.camel import Camel
    from app.services.cargar_datos_pca import obtener_datos_pca_por_categoria, obtener_datos_para_pca
    
    resultado_enriquecido = {}
    
    # Obtener mapeo de ID_indicador -> (nombre, categoría CAMEL)
    indicadores_info = {}
    indicadores_db = db.query(Indicador).all()
    for ind in indicadores_db:
        camel = db.query(Camel).filter(Camel.id_camel == ind.id_camel).first()
        categoria_camel = camel.name if camel else "Desconocida"
        indicadores_info[ind.id_indicator] = {
            "nombre": ind.name,
            "categoria_camel": categoria_camel
        }
    
    # Procesar cada categoría de cooperativas
    for categoria, pesos_dict in resultados_pca.items():
        if "error" in pesos_dict:
            continue
        
        # Obtener datos para calcular cantidad de cooperativas y registros
        try:
            if categoria.lower() == "general":
                df = obtener_datos_para_pca(db, anio=anio)
                lista_coops = df["ID_cooperativa"].unique().tolist()
            else:
                df, lista_coops = obtener_datos_pca_por_categoria(db, categoria=categoria, anio=anio)
            
            cantidad_cooperativas = len(lista_coops)
            cantidad_registros = len(df)
            
            # Enriquecer pesos con información de indicadores
            pesos_enriquecidos = {}
            for id_indicador, peso in pesos_dict.items():
                id_ind_int = int(id_indicador) if isinstance(id_indicador, str) else id_indicador
                
                info_ind = indicadores_info.get(id_ind_int, {
                    "nombre": f"Indicador {id_indicador}",
                    "categoria_camel": "Desconocida"
                })
                
                pesos_enriquecidos[str(id_indicador)] = {
                    "nombre_indicador": info_ind["nombre"],
                    "categoria_camel": info_ind["categoria_camel"],
                    "peso": peso,
                    "peso_porcentaje": round(peso * 100, 2)
                }
            
            resultado_enriquecido[categoria] = {
                "cantidad_cooperativas": cantidad_cooperativas,
                "cantidad_registros": cantidad_registros,
                "pesos": pesos_enriquecidos
            }
            
        except Exception as e:
            print(f"Error enriqueciendo categoría {categoria}: {str(e)}")
            continue
    
    return resultado_enriquecido