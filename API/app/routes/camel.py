from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from app.database import get_db
from app.models.camel import Camel
from app.schemas.camel import CamelSchema
from app.services.pca import (
    promedio_indicadores,
    obtener_todos_pca,
    generar_pca_completo,
    cargar_pca_desde_archivo
)
from app.services.percentiles import (
    obtener_todos_percentiles,
    generar_percentiles_completo,
    cargar_percentiles_desde_archivo
)
import pandas as pd

from .. import database

router = APIRouter(prefix="/camels", tags=["camels"])

@router.get("/", response_model=List[CamelSchema])
def get_all_camels(db: Session = Depends(get_db)):
    return db.query(Camel).all()

@router.get("/prom")
def obtener_pca_mensual():
    """Endpoint para obtener los resultados del PCA mensual (compatibilidad)."""
    resultados_df = promedio_indicadores()
    return resultados_df.to_dict(orient="records")

@router.get("/pca/todos")
def obtener_todos_pca_endpoint():
    """
    Obtiene todos los resultados de PCA calculados.
    Incluye PCA general y por cada categoría.
    
    Returns:
        Dict con estructura:
        {
            "fecha_calculo": "ISO datetime",
            "pca_general": {...},
            "pca_por_categoria": {
                "categoria1": {...},
                "categoria2": {...},
                ...
            }
        }
    """
    resultados = obtener_todos_pca()
    
    if not resultados:
        raise HTTPException(
            status_code=404,
            detail="No se han calculado resultados de PCA. Ejecuta primero /camels/pca/generar"
        )
    
    return resultados

@router.post("/pca/generar")
def generar_pca_endpoint(db: Session = Depends(get_db)):
    """
    Genera y calcula PCA para:
    1. Categoría general (todas las cooperativas)
    2. Cada categoría individual
    
    Guarda los resultados en archivo JSON.
    
    Returns:
        Dict con resultados generados
    """
    try:
        resultados = generar_pca_completo(db)
        return {
            "status": "success",
            "mensaje": "PCA calculado y guardado correctamente",
            "resumen": {
                "cantidad_pca_general": 1 if resultados.get("pca_general") else 0,
                "cantidad_pca_categorias": len(resultados.get("pca_por_categoria", {})),
                "total_pca_calculados": 1 + len(resultados.get("pca_por_categoria", {}))
            },
            "datos": resultados
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar PCA: {str(e)}"
        )


@router.get("/percentiles/todos")
def obtener_todos_percentiles_endpoint():
    """
    Obtiene todos los resultados de percentiles calculados.
    Incluye percentiles generales y por cada categoría.
    
    Returns:
        Dict con estructura:
        {
            "fecha_calculo": "ISO datetime",
            "percentiles_generales": {...},
            "percentiles_por_categoria": {
                "categoria1": {...},
                "categoria2": {...},
                ...
            }
        }
    """
    resultados = obtener_todos_percentiles()
    
    if not resultados:
        raise HTTPException(
            status_code=404,
            detail="No se han calculado resultados de percentiles. Ejecuta primero /camels/percentiles/generar"
        )
    
    return resultados


@router.post("/percentiles/generar")
def generar_percentiles_endpoint(db: Session = Depends(get_db)):
    """
    Genera y calcula percentiles para:
    1. Percentiles generales (todas las cooperativas)
    2. Cada categoría individual
    
    Guarda los resultados en archivo JSON.
    
    Returns:
        Dict con resultados generados
    """
    try:
        resultados = generar_percentiles_completo(db)
        return {
            "status": "success",
            "mensaje": "Percentiles calculados y guardados correctamente",
            "resumen": {
                "cantidad_percentiles_generales": 1 if resultados.get("percentiles_generales") else 0,
                "cantidad_percentiles_categorias": len(resultados.get("percentiles_por_categoria", {})),
                "total_percentiles_calculados": 1 + len(resultados.get("percentiles_por_categoria", {}))
            },
            "datos": resultados
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar percentiles: {str(e)}"
        )
