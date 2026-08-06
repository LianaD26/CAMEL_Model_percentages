import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.registro import Registro
from app.models.cooperativa import Cooperativa
from app.models.indicador import Indicador


def obtener_datos_para_pca(
    db: Session,
    categoria: str = None,
    anio: int = None,
    mes: int = None,
    lista_coops: list = None
) -> pd.DataFrame:
    """
    Obtiene datos de la base de datos para calcular PCA.
    
    Args:
        db: Sesión de SQLAlchemy
        categoria: Filtrar por categoría de cooperativa (opcional)
        anio: Filtrar por año (opcional)
        mes: Filtrar por mes (opcional)
        lista_coops: Lista de IDs de cooperativas (opcional, si es None trae todas)
    
    Returns:
        DataFrame con columnas: ID_cooperativa, ID_indicador, valor, categoria, anio, mes
    """
    
    # Construir query base
    query = db.query(
        Registro.id_cooperative,
        Registro.id_indicator,
        Registro.value,
        Cooperativa.category,
        Registro.year,
        Registro.month
    ).join(
        Cooperativa, Registro.id_cooperative == Cooperativa.id_cooperative
    )
    
    # Aplicar filtros
    if categoria:
        query = query.filter(Cooperativa.category == categoria)
    
    if anio:
        query = query.filter(Registro.year == anio)
    
    if mes:
        query = query.filter(Registro.month == mes)
    
    if lista_coops:
        query = query.filter(Registro.id_cooperative.in_(lista_coops))
    
    # Ejecutar query
    resultados = query.all()
    
    if not resultados:
        raise ValueError("No se encontraron datos con los filtros especificados")
    
    # Convertir a DataFrame
    df = pd.DataFrame(
        resultados,
        columns=["ID_cooperativa", "ID_indicador", "valor", "categoria", "anio", "mes"]
    )
    
    # Convertir valor a numérico (por si acaso)
    df["valor"] = pd.to_numeric(df["valor"], errors="coerce")
    
    return df


def obtener_datos_pca_por_categoria(
    db: Session,
    categoria: str,
    anio: int = None
) -> tuple:
    """
    Obtiene datos PCA para una categoría específica y devuelve el DataFrame
    más la lista de cooperativas.
    
    Args:
        db: Sesión de SQLAlchemy
        categoria: Categoría de cooperativas
        anio: Año específico (opcional)
    
    Returns:
        Tupla (df, lista_coops) lista para usar en pesos_pca_grupo_coops()
    """
    
    df = obtener_datos_para_pca(db, categoria=categoria, anio=anio)
    lista_coops = df["ID_cooperativa"].unique().tolist()
    
    return df, lista_coops


def obtener_todas_las_categorias(db: Session) -> list:
    """
    Obtiene lista de todas las categorías de cooperativas en la BD.
    
    Args:
        db: Sesión de SQLAlchemy
    
    Returns:
        Lista de categorías
    """
    categorias = db.query(Cooperativa.category).distinct().all()
    return [cat[0] for cat in categorias if cat[0]]


def obtener_datos_pca_comparativa(
    db: Session,
    anio: int = None,
    mes: int = None
) -> dict:
    """
    Obtiene datos PCA para todas las categorías, útil para comparativas.
    
    Args:
        db: Sesión de SQLAlchemy
        anio: Año específico (opcional)
        mes: Mes específico (opcional)
    
    Returns:
        Diccionario con estructura: {categoria: (df, lista_coops)}
    """
    
    categorias = obtener_todas_las_categorias(db)
    datos_por_categoria = {}
    
    for categoria in categorias:
        try:
            df, lista_coops = obtener_datos_pca_por_categoria(
                db, 
                categoria=categoria, 
                anio=anio
            )
            datos_por_categoria[categoria] = (df, lista_coops)
        except ValueError:
            # Si no hay datos para esa categoría, continuar
            continue
    
    return datos_por_categoria
