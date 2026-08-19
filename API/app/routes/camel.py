from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.camel import Camel
from app.models.indicador import Indicador
from app.models.pca_result import PcaResult
from app.models.percentile_result import PercentileResult
from app.schemas.camel import CamelSchema
from app.schemas.pca_result import PcaResultadosResponse
from app.schemas.percentile_result import PercentilResultadosResponse

router = APIRouter(prefix="/camels", tags=["camels"])


@router.get("/", response_model=List[CamelSchema])
def get_all_camels(db: Session = Depends(get_db)):
    return db.query(Camel).all()


@router.get("/pca/resultados-json", response_model=PcaResultadosResponse)
def get_pca_resultados(db: Session = Depends(get_db)):
    """Devuelve los pesos PCA precalculados por categoría desde la tabla pca_result."""
    filas = (
        db.query(PcaResult, Indicador.name, Camel.name)
        .join(Indicador, PcaResult.id_indicator == Indicador.id_indicator)
        .join(Camel, Indicador.id_camel == Camel.id_camel)
        .all()
    )

    resultados = {}
    for pca, nombre_indicador, categoria_camel in filas:
        categoria = resultados.setdefault(
            pca.category,
            {
                "cantidad_cooperativas": pca.quantity_cooperatives,
                "cantidad_registros": pca.quantity_records,
                "pesos": {},
            },
        )
        categoria["pesos"][str(pca.id_indicator)] = {
            "nombre_indicador": nombre_indicador,
            "categoria_camel": categoria_camel,
            "peso": float(pca.weight),
            "peso_porcentaje": float(pca.weight_percentage),
        }

    return {"datos": {"ultimoCalculo": {"resultados": resultados}}}


@router.get("/percentiles/resultados-json", response_model=PercentilResultadosResponse)
def get_percentiles_resultados(db: Session = Depends(get_db)):
    """Devuelve los percentiles P10-P90 precalculados por categoría desde percentile_result."""
    filas = (
        db.query(PercentileResult, Indicador.name, Camel.name)
        .join(Indicador, PercentileResult.id_indicator == Indicador.id_indicator)
        .join(Camel, Indicador.id_camel == Camel.id_camel)
        .all()
    )

    por_categoria = {}
    for pct, nombre_indicador, categoria_camel in filas:
        categoria = por_categoria.setdefault(
            pct.category,
            {
                "cantidad_cooperativas": pct.quantity_cooperatives,
                "cantidad_registros": pct.quantity_records,
                "percentiles": {},
            },
        )
        categoria["percentiles"][str(pct.id_indicator)] = {
            "nombre_indicador": nombre_indicador,
            "categoria_camel": categoria_camel,
            "p10": float(pct.p10) if pct.p10 is not None else None,
            "p20": float(pct.p20) if pct.p20 is not None else None,
            "p30": float(pct.p30) if pct.p30 is not None else None,
            "p40": float(pct.p40) if pct.p40 is not None else None,
            "p50": float(pct.p50) if pct.p50 is not None else None,
            "p60": float(pct.p60) if pct.p60 is not None else None,
            "p70": float(pct.p70) if pct.p70 is not None else None,
            "p80": float(pct.p80) if pct.p80 is not None else None,
            "p90": float(pct.p90) if pct.p90 is not None else None,
        }

    generales = por_categoria.pop("General", {
        "cantidad_cooperativas": 0,
        "cantidad_registros": 0,
        "percentiles": {},
    })

    return {
        "datos": {
            "percentiles_generales": generales,
            "percentiles_por_categoria": por_categoria,
        }
    }
