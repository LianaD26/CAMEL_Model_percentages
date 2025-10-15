from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict

from API.app.database import get_db
from API.app.service.calificationPredictor import CalificationPredictorService
from API.app.schemas.calificationPredictor import CalificationPredictorResponse

router = APIRouter(
    prefix="/predictor",
    tags=["predictor"]
)

@router.get(
    "/calificacion/{cooperativa_nombre}",
    response_model=CalificationPredictorResponse
)
def get_calificacion_cooperativa(
    cooperativa_nombre: str,
    year: int = Query(..., description="Año a analizar"),
    db: Session = Depends(get_db)
):
    """
    Obtiene las calificaciones mensuales de una cooperativa basadas en percentiles
    
    Args:
        cooperativa_nombre: Nombre de la cooperativa
        year: Año a analizar
        
    Returns:
        Calificaciones mensuales (1-10) por cada indicador
        
    Example:
        GET /predictor/calificacion/COOPANTEX%20COOPERATIVA%20DE%20AHORRO%20Y%20CREDITO?year=2024
    """
    try:
        service = CalificationPredictorService(db)
        resultado = service.obtener_calificacion_cooperativa(cooperativa_nombre, year)
        
        if "error" in resultado:
            raise HTTPException(status_code=404, detail=resultado["error"])
        
        return CalificationPredictorResponse(**resultado)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al calcular calificaciones: {str(e)}"
        )

@router.get(
    "/calificaciones-globales/{year}",
    response_model=Dict[str, Dict[int, int]]
)
def get_calificaciones_globales(
    year: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene las calificaciones promedio de todos los indicadores para un año
    
    Args:
        year: Año a analizar
        
    Returns:
        Calificaciones promedio mensuales por indicador
        
    Example:
        GET /predictor/calificaciones-globales/2024
    """
    try:
        service = CalificationPredictorService(db)
        calificaciones = service.calcular_calificaciones_por_percentiles(year)
        
        if not calificaciones:
            raise HTTPException(
                status_code=404, 
                detail=f"No se encontraron datos para el año {year}"
            )
        
        return calificaciones
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al calcular calificaciones: {str(e)}"
        )

@router.get("/test")
def test_endpoint():
    """Endpoint de prueba para verificar que el router funciona"""
    return {
        "message": "Predictor API funcionando correctamente",
        "endpoints": {
            "calificacion_cooperativa": "/predictor/calificacion/{cooperativa_nombre}?year={year}",
            "calificaciones_globales": "/predictor/calificaciones-globales/{year}"
        }
    }
