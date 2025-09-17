from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from API.app.database import get_db
from API.app.models.indicador import Indicador
from API.app.schemas.indicador import IndicadorSchema

router = APIRouter(prefix="/indicadores", tags=["indicadores"])

@router.get("/", response_model=List[IndicadorSchema])
def get_all_indicadores(db: Session = Depends(get_db)):
    return db.query(Indicador).all()
