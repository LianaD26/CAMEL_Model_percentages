import pandas as pd
import numpy as np

INDICADORES_INVERSOS = [
    "Indicador de calidad por riesgo",
    "Indicador de calidad por riesgo con castigos",
    "Indicador de Cobertura de la Cartera Total en Riesgo",
    "Indicador de relación entre las obligaciones financieras y el pasivo total",
    "Indicador de Margen Financiero de Operación",
    "Indicador de Margen Operacional"
]

PERCENTILES = [10, 20, 30, 40, 50, 60, 70, 80, 90]
INDICADOR_IRL = "Indicador de relación entre las obligaciones financieras y el pasivo total"


def calcular_percentiles(df, indicadores):
    """
    Calcula percentiles P10-P90 para cada indicador.
    
    Args:
        df: DataFrame con valores de indicadores
        indicadores: Lista de IDs de indicadores a procesar
        
    Returns:
        Dict con percentiles por indicador
    """
    
    resultado = {}
    
    for indicador_id in indicadores:
        # Filtrar datos para este indicador
        df_indicador = df[df["id_indicador"] == indicador_id].copy()
        
        if df_indicador.empty:
            continue
        
        # Obtener nombre del indicador
        nombre = df_indicador["indicador_nombre"].iloc[0] if not df_indicador.empty else str(indicador_id)
        
        valores = df_indicador["valor"].dropna().astype(float)
        
        if len(valores) == 0:
            continue
        
        # Calcular percentiles
        percentiles_dict = {}
        for p in PERCENTILES:
            percentiles_dict[f"p{p}"] = float(np.percentile(valores, p))
        
        resultado[nombre] = percentiles_dict
    
    return resultado


def asignar_calificacion(valor, cortes, inverso):
    """
    Asigna calificación 1-10 basada en percentiles.
    
    Args:
        valor: Valor a calificar
        cortes: Dict con percentiles
        inverso: Boolean, True si indicador inverso (menor es mejor)
        
    Returns:
        Calificación 1-10
    """
    
    if valor is None or pd.isna(valor):
        return None
    
    # Extraer cortes de percentiles
    p_values = [cortes.get(f"p{p}") for p in PERCENTILES]
    p_values = [v for v in p_values if v is not None]
    
    if not p_values:
        return None
    
    # Contar en cuántos percentiles cae el valor
    if inverso:
        # Para indicadores inversos: más bajo es mejor
        count = sum(1 for p in p_values if valor <= p)
    else:
        # Para indicadores normales: más alto es mejor
        count = sum(1 for p in p_values if valor >= p)
    
    # Convertir count a calificación 1-10
    calificacion = min(10, max(1, count + 1))
    
    return calificacion


def calificar_dataframe(df, percentiles):
    """
    Aplica calificaciones a un DataFrame basado en percentiles.
    
    Args:
        df: DataFrame con valores de indicadores
        percentiles: Dict con percentiles por indicador
        
    Returns:
        DataFrame con columna "calificacion" agregada
    """
    
    calificaciones = []
    
    for idx, row in df.iterrows():
        indicador = row.get("indicador_nombre")
        valor = row["valor"]
        
        if pd.isna(valor):
            calificaciones.append(None)
            continue
        
        # IRL → aplicar log10
        if indicador == INDICADOR_IRL:
            if valor <= 0:
                calificaciones.append(None)
                continue
            valor = np.log10(valor)
        
        inverso = indicador in INDICADORES_INVERSOS
        
        nota = asignar_calificacion(
            valor=valor,
            cortes=percentiles.get(indicador, {}),
            inverso=inverso
        )
        
        calificaciones.append(nota)
    
    df["calificacion"] = calificaciones
    
    return df, percentiles


# ======================================================
# GENERAR Y GUARDAR PERCENTILES EN JSON
# ======================================================

import json
import os
from datetime import datetime
from app.services.cargar_datos_percentiles import cargar_datos_percentiles
from sqlalchemy.orm import Session

# Ruta del archivo JSON donde se guardarán los resultados
PERCENTILES_RESULTS_DIR = os.path.join(os.path.dirname(__file__), "../../data")
PERCENTILES_RESULTS_FILE = os.path.join(PERCENTILES_RESULTS_DIR, "percentiles_resultados.json")


def generar_percentiles_completo(db: Session):
    """
    Genera y guarda percentiles para:
    1. Percentiles generales (todas las categorías)
    2. Percentiles por cada categoría individual
    
    Guarda los resultados en archivo JSON.
    
    Args:
        db: Sesión de base de datos
        
    Returns:
        Dict con todos los resultados de percentiles
    """
    
    resultados_completos = {
        "fecha_calculo": datetime.now().isoformat(),
        "percentiles_generales": {},
        "percentiles_por_categoria": {}
    }
    
    # --- 1. Calcular percentiles GENERALES (todas las categorías) ---
    print("Calculando percentiles GENERALES...")
    df_general = cargar_datos_percentiles(db, categoria=None)
    
    if not df_general.empty:
        indicadores = df_general["id_indicador"].unique()
        percentiles_general = calcular_percentiles(df_general, indicadores)
        
        if percentiles_general:
            resultados_completos["percentiles_generales"] = {
                "nombre": "GENERALES (Todas las categorías)",
                "cantidad_cooperativas": int(df_general["id_cooperativa"].nunique()),
                "cantidad_registros": int(len(df_general)),
                "percentiles": percentiles_general
            }
            print(f"[OK] Percentiles GENERALES calculados: {resultados_completos['percentiles_generales']['cantidad_cooperativas']} cooperativas")
    
    # --- 2. Obtener categorías únicas ---
    from app.models.cooperativa import Cooperativa
    query_categorias = db.query(Cooperativa.category).distinct().all()
    categorias = [cat[0] for cat in query_categorias if cat[0]]
    
    print(f"\nEncontradas {len(categorias)} categorías")
    
    # --- 3. Calcular percentiles por cada categoría ---
    for categoria in sorted(categorias):
        print(f"Calculando percentiles para: {categoria}")
        df_categoria = cargar_datos_percentiles(db, categoria=categoria)
        
        if not df_categoria.empty:
            indicadores = df_categoria["id_indicador"].unique()
            percentiles_categoria = calcular_percentiles(df_categoria, indicadores)
            
            if percentiles_categoria:  # Solo guardar si hay resultados válidos
                resultados_completos["percentiles_por_categoria"][categoria] = {
                    "nombre": categoria,
                    "cantidad_cooperativas": int(df_categoria["id_cooperativa"].nunique()),
                    "cantidad_registros": int(len(df_categoria)),
                    "percentiles": percentiles_categoria
                }
                print(f"   [OK] {resultados_completos['percentiles_por_categoria'][categoria]['cantidad_cooperativas']} cooperativas")
    
    # --- 4. Guardar en archivo JSON ---
    os.makedirs(PERCENTILES_RESULTS_DIR, exist_ok=True)
    with open(PERCENTILES_RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(resultados_completos, f, indent=2, ensure_ascii=False)
    
    print(f"\nResultados guardados en: {PERCENTILES_RESULTS_FILE}")
    
    return resultados_completos


def cargar_percentiles_desde_archivo():
    """
    Carga los resultados de percentiles desde el archivo JSON.
    
    Returns:
        Dict con resultados percentiles o {} si el archivo no existe
    """
    
    if not os.path.exists(PERCENTILES_RESULTS_FILE):
        print(f"[WARNING] Archivo percentiles no encontrado: {PERCENTILES_RESULTS_FILE}")
        return {}
    
    with open(PERCENTILES_RESULTS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def obtener_percentiles_categoria(categoria=None):
    """
    Obtiene los percentiles para una categoría específica.
    
    Args:
        categoria: Nombre de la categoría, o None para generales
        
    Returns:
        Dict con percentiles por indicador
    """
    
    resultados = cargar_percentiles_desde_archivo()
    
    if not resultados:
        return {}
    
    if categoria is None:
        # Usar percentiles generales
        return resultados.get("percentiles_generales", {}).get("percentiles", {})
    else:
        # Usar percentiles de categoría específica
        return resultados.get("percentiles_por_categoria", {}).get(categoria, {}).get("percentiles", {})


def obtener_todos_percentiles():
    """
    Retorna todos los resultados de percentiles (generales + por categoría).
    
    Returns:
        Dict con estructura completa de percentiles
    """
    return cargar_percentiles_desde_archivo()


def enriquecer_percentiles_con_metadata(db: Session, percentiles_dict: dict) -> dict:
    """
    Enriquece los percentiles con metadata: nombre del indicador y categoría CAMEL.
    
    Los percentiles pueden tener como claves:
    - IDs de indicador (números)
    - Nombres de indicador (strings)
    
    Args:
        db: Sesión de SQLAlchemy
        percentiles_dict: Diccionario con percentiles calculados
    
    Returns:
        Diccionario enriquecido con: nombre_indicador, categoria_camel
    """
    from app.models.indicador import Indicador
    from app.models.camel import Camel
    
    # Obtener mapeo de ID_indicador -> (nombre, categoría CAMEL)
    # También crear mapeo inverso: nombre -> ID y categoría CAMEL
    indicadores_info_por_id = {}
    indicadores_info_por_nombre = {}
    
    indicadores_db = db.query(Indicador).all()
    for ind in indicadores_db:
        camel = db.query(Camel).filter(Camel.id_camel == ind.id_camel).first()
        categoria_camel = camel.name if camel else "Desconocida"
        info = {
            "nombre": ind.name,
            "categoria_camel": categoria_camel
        }
        indicadores_info_por_id[ind.id_indicator] = info
        indicadores_info_por_nombre[ind.name] = info
    
    resultado_enriquecido = {}
    
    # Enriquecer percentiles_generales
    if "percentiles_generales" in percentiles_dict and percentiles_dict["percentiles_generales"]:
        pct_gen = percentiles_dict["percentiles_generales"]
        pct_gen_enriquecidos = {}
        
        if "percentiles" in pct_gen:
            for clave_indicador, valores_pct in pct_gen["percentiles"].items():
                # Determinar si la clave es un ID o un nombre
                info_ind = None
                if clave_indicador.isdigit():
                    # Es un ID
                    id_ind_int = int(clave_indicador)
                    info_ind = indicadores_info_por_id.get(id_ind_int)
                else:
                    # Es un nombre
                    info_ind = indicadores_info_por_nombre.get(clave_indicador)
                
                # Default si no se encuentra
                if not info_ind:
                    info_ind = {
                        "nombre": clave_indicador,
                        "categoria_camel": "Desconocida"
                    }
                
                pct_gen_enriquecidos[str(clave_indicador)] = {
                    "nombre_indicador": info_ind["nombre"],
                    "categoria_camel": info_ind["categoria_camel"],
                    **valores_pct
                }
        
        resultado_enriquecido["percentiles_generales"] = {
            "nombre": pct_gen.get("nombre"),
            "cantidad_cooperativas": pct_gen.get("cantidad_cooperativas"),
            "cantidad_registros": pct_gen.get("cantidad_registros"),
            "percentiles": pct_gen_enriquecidos
        }
    
    # Enriquecer percentiles_por_categoria
    if "percentiles_por_categoria" in percentiles_dict:
        resultado_enriquecido["percentiles_por_categoria"] = {}
        
        for categoria, datos_cat in percentiles_dict["percentiles_por_categoria"].items():
            pct_cat_enriquecidos = {}
            
            if "percentiles" in datos_cat:
                for clave_indicador, valores_pct in datos_cat["percentiles"].items():
                    # Determinar si la clave es un ID o un nombre
                    info_ind = None
                    if clave_indicador.isdigit():
                        # Es un ID
                        id_ind_int = int(clave_indicador)
                        info_ind = indicadores_info_por_id.get(id_ind_int)
                    else:
                        # Es un nombre
                        info_ind = indicadores_info_por_nombre.get(clave_indicador)
                    
                    # Default si no se encuentra
                    if not info_ind:
                        info_ind = {
                            "nombre": clave_indicador,
                            "categoria_camel": "Desconocida"
                        }
                    
                    pct_cat_enriquecidos[str(clave_indicador)] = {
                        "nombre_indicador": info_ind["nombre"],
                        "categoria_camel": info_ind["categoria_camel"],
                        **valores_pct
                    }
            
            resultado_enriquecido["percentiles_por_categoria"][categoria] = {
                "nombre": datos_cat.get("nombre"),
                "cantidad_cooperativas": datos_cat.get("cantidad_cooperativas"),
                "cantidad_registros": datos_cat.get("cantidad_registros"),
                "percentiles": pct_cat_enriquecidos
            }
    
    return resultado_enriquecido