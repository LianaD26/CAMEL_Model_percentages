from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from app.database import get_db
from app.models.camel import Camel
from app.schemas.camel import CamelSchema
from app.services.pca import (
    calcular_y_guardar_pesos_pca
)
from app.services.percentiles import (
    obtener_todos_percentiles,
    generar_percentiles_completo,
    cargar_percentiles_desde_archivo
)
import pandas as pd
import json

from .. import database

router = APIRouter(prefix="/camels", tags=["camels"])

@router.get("/", response_model=List[CamelSchema])
def get_all_camels(db: Session = Depends(get_db)):
    return db.query(Camel).all()

@router.post("/pca/calcular-nuevo")
def calcular_pca_nuevo_endpoint(
    anio: Optional[int] = Query(None, description="Año específico para filtrar (opcional)"),
    n_componentes: int = Query(3, description="Número de componentes PCA"),
    db: Session = Depends(get_db)
):
    """
    Calcula pesos PCA usando la nueva función optimizada.
    Conecta: BD → cargar_datos_pca → pca.py → JSON
    
    Parámetros:
        - anio: Año específico (opcional, si no se envía trae todos)
        - n_componentes: Número de componentes PCA (default: 3)
    
    Returns:
        Dict con resultados calculados y guardados en JSON
    """
    try:
        resultado = calcular_y_guardar_pesos_pca(
            db=db,
            anio=anio,
            n_componentes=n_componentes
        )
        
        if resultado.get("exito"):
            return {
                "status": "success",
                "mensaje": resultado.get("mensaje"),
                "anio": anio,
                "n_componentes": n_componentes,
                "resultados": resultado.get("resultados"),
                "detalles_guardado": resultado.get("guardado")
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=resultado.get("error", "Error desconocido al calcular PCA")
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al calcular PCA: {str(e)}"
        )


@router.get("/pca/resultados-json")
def obtener_resultados_pca_json():
    """
    Obtiene los resultados del PCA guardados en JSON.
    Lee directamente desde API/data/pca_resultados.json
    
    Returns:
        Dict con todos los resultados de PCA guardados
    """
    try:
        from pathlib import Path
        
        base_dir = Path(__file__).parent.parent.parent
        ruta_json = base_dir / "data" / "pca_resultados.json"
        
        if not ruta_json.exists():
            raise HTTPException(
                status_code=404,
                detail="No hay resultados de PCA calculados. Ejecuta primero POST /camels/pca/calcular-nuevo"
            )
        
        with open(ruta_json, "r", encoding="utf-8") as f:
            resultados = json.load(f)
        
        return {
            "status": "success",
            "ruta": str(ruta_json),
            "datos": resultados
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener resultados: {str(e)}"
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


@router.get("/percentiles/resultados-json")
def obtener_percentiles_json_enriquecidos(db: Session = Depends(get_db)):
    """
    Obtiene los percentiles calculados con metadata enriquecida
    (nombre del indicador y categoría CAMEL).
    
    Returns:
        Dict con percentiles enriquecidos
    """
    try:
        from app.services.percentiles import (
            cargar_percentiles_desde_archivo,
            enriquecer_percentiles_con_metadata
        )
        
        # Cargar percentiles desde archivo
        percentiles = cargar_percentiles_desde_archivo()
        
        if not percentiles:
            raise HTTPException(
                status_code=404,
                detail="No hay resultados de percentiles calculados. Ejecuta primero POST /camels/percentiles/generar"
            )
        
        # Enriquecer con metadata
        percentiles_enriquecidos = enriquecer_percentiles_con_metadata(db, percentiles)
        
        return {
            "status": "success",
            "datos": percentiles_enriquecidos
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener percentiles: {str(e)}"
        )
