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
    year: int,
    cooperativa_nombre: str = None,
    category: str = None,
    db: Session = Depends(get_db)
):
    # Validar que se proporcione cooperativa_nombre O category, pero no ambas
    if not cooperativa_nombre and not category:
        raise HTTPException(status_code=400, detail="Debes proporcionar cooperativa_nombre o category")
    if cooperativa_nombre and category:
        raise HTTPException(status_code=400, detail="No puedes proporcionar ambos: cooperativa_nombre y category")
    
    query = (
        db.query(
            Registro.id_record.label("ID_registro"),
            Registro.value.label("valor"),
            Registro.year.label("ano"),
            Registro.month.label("mes"),
            Indicador.name.label("nombre_indicador"),
            Cooperativa.name.label("nombre_cooperativa"),
            Camel.name.label("nombre_camel")
        )
        .join(Indicador, Registro.id_indicator == Indicador.id_indicator)
        .join(Camel, Indicador.id_camel == Camel.id_camel)
        .join(Cooperativa, Registro.id_cooperative == Cooperativa.id_cooperative)
        .filter(Registro.year == year)
    )
    
    if cooperativa_nombre:
        query = query.filter(Cooperativa.name == cooperativa_nombre)
    elif category:
        query = query.filter(Cooperativa.category == category)
    
    return query.all()




@router.get("/filtro", response_model=List[RegistroSchema], operation_id="get_registros_filtrados_unico")
def get_registros_filtrados(
    cooperativa_id: int,
    year: int,
    db: Session = Depends(get_db)
):
    query = db.query(Registro)
    query = query.filter(Registro.id_cooperative == cooperativa_id)
    query = query.filter(Registro.year == year)
    return query.all()
