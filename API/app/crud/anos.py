from sqlalchemy.orm import Session
from sqlalchemy import distinct
from app.models.registro import Registro
from typing import List

def get_unique_years(db: Session) -> List[int]:
    """Obtiene todos los años únicos de la tabla registro"""
    try:
        result = db.query(distinct(Registro.ano)).order_by(Registro.ano).all()
        years = [year[0] for year in result if year[0] is not None]
        return years
    except Exception as e:
        raise Exception(f"Error al obtener años únicos: {str(e)}")

def get_years_count(db: Session) -> int:
    """Obtiene el conteo de años únicos"""
    try:
        result = db.query(distinct(Registro.ano)).count()
        return result
    except Exception as e:
        raise Exception(f"Error al contar años únicos: {str(e)}")