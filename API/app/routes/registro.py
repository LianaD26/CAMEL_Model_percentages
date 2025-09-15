from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.camel import Camel
from app.database import get_db
from app.models.registro import Registro
from app.models.indicador import Indicador
from app.models.cooperativa import Cooperativa
from app.schemas.registro import RegistroSchema
from app.schemas.registro_completo import RegistroCompletoSchema

router = APIRouter(prefix="/registros", tags=["registros"])

@router.get(
    "/completo",
    response_model=List[RegistroCompletoSchema],
    operation_id="get_registros_completos_unico"
)
def get_registros_completos(
    cooperativa_nombre: str,
    year: int,
    db: Session = Depends(get_db)
):
    query = (
        db.query(
            Registro.ID_registro.label("ID_registro"),
            Registro.valor,
            Registro.ano,
            Registro.mes,
            Indicador.nombre.label("nombre_indicador"),
            Cooperativa.nombre.label("nombre_cooperativa"),
            Camel.nombre.label("nombre_camel")
        )
        .join(Indicador, Registro.ID_indicador == Indicador.ID_indicador)
        .join(Camel, Indicador.ID_camel == Camel.ID_camel)
        .join(Cooperativa, Registro.ID_cooperativa == Cooperativa.ID_cooperativa)
        .filter(Cooperativa.nombre == cooperativa_nombre)
        .filter(Registro.ano == year)
    )
    return query.all()




@router.get("/filtro", response_model=List[RegistroSchema], operation_id="get_registros_filtrados_unico")
def get_registros_filtrados(
    cooperativa_id: int,
    year: int,
    db: Session = Depends(get_db)
):
    query = db.query(Registro)
    query = query.filter(Registro.ID_cooperativa == cooperativa_id)
    query = query.filter(Registro.ano == year)
    return query.all()
