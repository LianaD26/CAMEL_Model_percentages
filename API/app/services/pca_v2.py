"""
Módulo de cálculo de PCA mejorado.
Genera PCA para categoría general y por categoría individual.
Guarda resultados en archivo JSON para acceso desde frontend.
"""

from sklearn.preprocessing import MinMaxScaler
from sklearn.decomposition import PCA
import pandas as pd
import json
import os
from datetime import datetime
from app.services.cargar_datos_pca import cargar_datos_desde_db
from sqlalchemy.orm import Session

# Ruta del archivo JSON donde se guardarán los resultados
PCA_RESULTS_DIR = os.path.join(os.path.dirname(__file__), "../../data")
PCA_RESULTS_FILE = os.path.join(PCA_RESULTS_DIR, "pca_resultados.json")


def calcular_pca_para_categoria(df_datos, nombre_categoria="GENERAL"):
    """
    Calcula PCA para un conjunto de datos específico.
    
    Args:
        df_datos: DataFrame con datos pivotados (indicadores como columnas)
        nombre_categoria: Nombre de la categoría (para referencia)
    
    Returns:
        Dict con resultados PCA: {indicador: {peso: %, importancia: float, ...}, ...}
    """
    
    if df_datos.empty:
        return {}
    
    # --- 1. Seleccionar columnas numéricas (indicadores) ---
    indicadores = [
        col for col in df_datos.columns if col not in [
            "ano", "mes", "id_cooperativa", "cooperativa_nombre", 
            "categoria", "id_indicador", "Periodo"
        ]
    ]
    
    if not indicadores:
        return {}
    
    # --- 2. Limpiar datos (remover NaN) ---
    df_limpios = df_datos[indicadores].dropna()
    
    if df_limpios.empty or len(df_limpios) < 2:
        return {}
    
    # --- 3. Escalar indicadores con MinMaxScaler ---
    scaler = MinMaxScaler()
    df_scaled = pd.DataFrame(
        scaler.fit_transform(df_limpios),
        columns=indicadores
    )
    
    # --- 4. Aplicar PCA ---
    pca = PCA()
    pca.fit(df_scaled)
    
    # --- 5. Calcular cargas (importancia en componentes) ---
    cargas = pd.DataFrame(abs(pca.components_), columns=indicadores)
    
    # --- 6. Varianza explicada ---
    varianza = pca.explained_variance_ratio_
    
    # --- 7. Calcular importancia ponderada por varianza ---
    importancia = (cargas.T @ varianza).to_numpy().flatten()
    
    # --- 8. Calcular pesos (%) ---
    total_importancia = importancia.sum()
    if total_importancia == 0:
        return {}
    
    pesos = (importancia / total_importancia * 100)
    
    # --- 9. Construir resultado ---
    resultado = {}
    for idx, indicador in enumerate(indicadores):
        resultado[indicador] = {
            "peso_porcentaje": round(pesos[idx], 2),
            "importancia": round(importancia[idx], 6),
            "promedio": round(float(df_limpios[indicador].mean()), 4),
            "desviacion_estandar": round(float(df_limpios[indicador].std()), 4)
        }
    
    # Ordenar por peso descendente
    resultado = dict(sorted(resultado.items(), key=lambda x: x[1]["peso_porcentaje"], reverse=True))
    
    return resultado


def generar_pca_completo(db: Session):
    """
    Genera y guarda PCA para:
    1. Todas las categorías (general)
    2. Cada categoría individual
    
    Guarda los resultados en un archivo JSON.
    
    Args:
        db: Sesión de base de datos
        
    Returns:
        Dict con todos los resultados PCA
    """
    
    resultados_completos = {
        "fecha_calculo": datetime.now().isoformat(),
        "pca_general": {},
        "pca_por_categoria": {}
    }
    
    # --- 1. Calcular PCA GENERAL (todas las categorías) ---
    print("📊 Calculando PCA GENERAL...")
    df_general = cargar_datos_desde_db(db, categoria=None)
    
    if not df_general.empty:
        pca_general = calcular_pca_para_categoria(df_general, "GENERAL")
        if pca_general:
            resultados_completos["pca_general"] = {
                "nombre": "GENERAL (Todas las categorías)",
                "cantidad_cooperativas": int(df_general["id_cooperativa"].nunique()),
                "cantidad_registros": int(len(df_general)),
                "pesos": pca_general
            }
            print(f"✅ PCA GENERAL calculado: {resultados_completos['pca_general']['cantidad_cooperativas']} cooperativas")
    
    # --- 2. Obtener categorías únicas ---
    from app.models.cooperativa import Cooperativa
    query_categorias = db.query(Cooperativa.category).distinct().all()
    categorias = [cat[0] for cat in query_categorias if cat[0]]
    
    print(f"\n📁 Encontradas {len(categorias)} categorías")
    
    # --- 3. Calcular PCA por cada categoría ---
    for categoria in sorted(categorias):
        print(f"📊 Calculando PCA para: {categoria}")
        df_categoria = cargar_datos_desde_db(db, categoria=categoria)
        
        if not df_categoria.empty:
            pca_categoria = calcular_pca_para_categoria(df_categoria, categoria)
            
            if pca_categoria:  # Solo guardar si hay resultados válidos
                resultados_completos["pca_por_categoria"][categoria] = {
                    "nombre": categoria,
                    "cantidad_cooperativas": int(df_categoria["id_cooperativa"].nunique()),
                    "cantidad_registros": int(len(df_categoria)),
                    "pesos": pca_categoria
                }
                print(f"   ✅ {resultados_completos['pca_por_categoria'][categoria]['cantidad_cooperativas']} cooperativas")
    
    # --- 4. Guardar en archivo JSON ---
    os.makedirs(PCA_RESULTS_DIR, exist_ok=True)
    with open(PCA_RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(resultados_completos, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Resultados guardados en: {PCA_RESULTS_FILE}")
    
    return resultados_completos


def cargar_pca_desde_archivo():
    """
    Carga los resultados de PCA desde el archivo JSON.
    
    Returns:
        Dict con resultados PCA o {} si el archivo no existe
    """
    
    if not os.path.exists(PCA_RESULTS_FILE):
        print(f"⚠️  Archivo PCA no encontrado: {PCA_RESULTS_FILE}")
        return {}
    
    with open(PCA_RESULTS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def obtener_pesos_pca(categoria=None):
    """
    Obtiene los pesos PCA (como float 0-1) para una categoría específica.
    
    Args:
        categoria: Nombre de la categoría, o None para general
        
    Returns:
        Dict con {indicador: peso_decimal, ...}
    """
    
    resultados = cargar_pca_desde_archivo()
    
    if not resultados:
        return {}
    
    if categoria is None:
        # Usar PCA general
        pca_data = resultados.get("pca_general", {}).get("pesos", {})
    else:
        # Usar PCA de categoría específica
        pca_data = resultados.get("pca_por_categoria", {}).get(categoria, {}).get("pesos", {})
    
    # Convertir a diccionario {indicador: peso_decimal}
    pesos_decimales = {}
    for indicador, datos in pca_data.items():
        peso_porcentaje = datos.get("peso_porcentaje", 0)
        pesos_decimales[indicador.replace("_", " ").upper().strip()] = peso_porcentaje / 100
    
    return pesos_decimales


def obtener_todos_pca():
    """
    Retorna todos los resultados PCA (general + por categoría).
    
    Returns:
        Dict con estructura completa de PCA
    """
    return cargar_pca_desde_archivo()
