from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from API.app.database import get_db
from API.app.models.camel import Camel
from API.app.schemas.camel import CamelSchema

from .. import database, models
from ..models.modelo_ag import genetic_algorithm, camel_structure
from ..models.get_data_for_model import get_X_y_from_db

router = APIRouter(prefix="/camels", tags=["camels"])

@router.get("/", response_model=List[CamelSchema])
def get_all_camels(db: Session = Depends(get_db)):
    return db.query(Camel).all()

@router.get("/optimizar-pesos")
def optimizar_pesos(db: Session = Depends(database.get_db)):
    X, y = get_X_y_from_db(db, target_column="riesgo")

    # execute GA
    best_weights, best_auc = genetic_algorithm(X, y)

    # format output
    idx = 0
    pesos_dict = {}
    for block, indicators in camel_structure.items():
        for ind in indicators:
            pesos_dict[f"{block}-{ind}"] = float(best_weights[idx])
            idx += 1

    return {"pesos": pesos_dict, "mejor_auc": best_auc}
