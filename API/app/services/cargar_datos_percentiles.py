# services/cargar_datos_percentiles.py
"""
Extrae datos de percentiles desde PostgreSQL Neon.
Similar a cargar_datos_pca.py pero mantiene estructura para calcular percentiles.
"""

import pandas as pd
from sqlalchemy.orm import Session
from app.models.registro import Registro
from app.models.indicador import Indicador
from app.models.cooperativa import Cooperativa
from app.models.camel import Camel


def cargar_datos_percentiles(db: Session, categoria: str = None):
    """
    Carga datos desde PostgreSQL para el cálculo de percentiles.
    
    Args:
        db: Sesión de base de datos SQLAlchemy
        categoria: (Optional) Filtrar por categoría. Si es None, carga todas.
    
    Returns:
        DataFrame con estructura:
        Columnas: [ID_indicador, valor, year, month, id_cooperativa, cooperativa_nombre, categoria]
        (NO pivotada, para facilitar cálculo de percentiles)
    """
    
    # Query base: obtener todos los registros necesarios
    query = db.query(
        Registro.id_record,
        Registro.value,
        Registro.year,
        Registro.month,
        Indicador.name.label('indicador_nombre'),
        Indicador.id_indicator,
        Cooperativa.name.label('cooperativa_nombre'),
        Cooperativa.id_cooperative,
        Cooperativa.category
    ).join(
        Indicador, Registro.id_indicator == Indicador.id_indicator
    ).join(
        Camel, Indicador.id_camel == Camel.id_camel
    ).join(
        Cooperativa, Registro.id_cooperative == Cooperativa.id_cooperative
    )
    
    # Filtrar por categoría si se proporciona
    if categoria:
        query = query.filter(Cooperativa.category == categoria)
    
    # Ejecutar query
    resultados = query.all()
    
    # Convertir a DataFrame
    df = pd.DataFrame([
        {
            'id_record': r.id_record,
            'valor': r.value,
            'year': r.year,
            'month': r.month,
            'indicador_nombre': r.indicador_nombre,
            'id_indicador': r.id_indicator,
            'cooperativa_nombre': r.cooperativa_nombre,
            'id_cooperativa': r.id_cooperative,
            'categoria': r.category
        }
        for r in resultados
    ])
    
    return df
