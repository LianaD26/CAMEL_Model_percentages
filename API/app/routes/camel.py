from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.camel import Camel
from app.schemas.camel import CamelSchema
from app.services.pca import promedio_indicadores
import pandas as pd

from .. import database

router = APIRouter(prefix="/camels", tags=["camels"])

@router.get("/", response_model=List[CamelSchema])
def get_all_camels(db: Session = Depends(get_db)):
    return db.query(Camel).all()

@router.get("/prom")
def obtener_pca_mensual():
    """Endpoint para obtener los resultados del PCA mensual."""
    resultados_df = promedio_indicadores()
    return resultados_df.to_dict(orient="records")
