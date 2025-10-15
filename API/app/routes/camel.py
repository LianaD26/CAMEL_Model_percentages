from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from API.app.database import get_db
from API.app.models.camel import Camel
from API.app.schemas.camel import CamelSchema
from API.app.services.pca import promedio_indicadores

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
