from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.crud import anos as anos_crud
from app.schemas.anos import AnoResponse

router = APIRouter(
    prefix="/anos",
    tags=["años"]
)

@router.get("/", response_model=AnoResponse)
def get_unique_years(db: Session = Depends(get_db)):
    """
    Obtiene todos los años únicos disponibles en la base de datos
    
    Returns:
        AnoResponse: Lista de años únicos y total de años
    """
    try:
        unique_years = anos_crud.get_unique_years(db)
        return AnoResponse(
            anos=unique_years,
            total=len(unique_years)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al obtener años únicos: {str(e)}"
        )

@router.get("/count")
def get_years_count(db: Session = Depends(get_db)):
    """
    Obtiene el número total de años únicos
    
    Returns:
        dict: Diccionario con el conteo de años únicos
    """
    try:
        count = anos_crud.get_years_count(db)
        return {"total_years": count}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al contar años: {str(e)}"
        )