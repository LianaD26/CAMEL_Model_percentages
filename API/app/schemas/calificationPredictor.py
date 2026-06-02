from pydantic import BaseModel
from typing import Dict, Optional

class CalificacionMensual(BaseModel):
    """Schema para calificaciones mensuales de un indicador"""
    indicador: str
    calificaciones: Dict[int, int]  # {mes: calificacion}
    
    class Config:
        from_attributes = True

class CalificationPredictorResponse(BaseModel):
    """Schema para la respuesta de calificaciones de una cooperativa"""
    cooperativa: str
    year: int
    calificaciones: Dict[str, Dict[int, int]]  # {indicador: {mes: calificacion}}
    
    class Config:
        from_attributes = True

class CalificationPredictorSchema(BaseModel):
    """Schema antiguo mantenido por compatibilidad"""
    QUEBRANTO_PATRIMONIAL: Dict[str, float]
    LIQUIDEZ_INMEDIATA: Dict[str, float]
    APORTES_SOCIALES_MINIMOS_Y_CAPITAL: Dict[str, float]
    CAPITAL_INSTITUCIONAL_Y_ACTIVO_TOTAL: Dict[str, float]
    RELACION_SOLVENCIA: Dict[str, float]
    ACTIVO_PRODUCTIVO: Dict[str, float]
    INDICADOR_CALIDAD_RIESGO: Dict[str, float]
    CALIDAD_POR_RIESGO_CON_CASTIGOS: Dict[str, float]
    COBERTURA_CARACTER_TOTAL_RIESGO: Dict[str, float]
    COBERTURA_INDIVIDUAL_CARACTER_IMPRODUCTIVA: Dict[str, float]
    ESTRUCTURA_DE_BALANCE: Dict[str, float]
    MARGEN_FINANCIERO_OPERACION: Dict[str, float]
    MARGEN_OPERACIONAL: Dict[str, float]
    RELACION_OBLIGACIONES_FINANCIERAS_PASIVO_TOTAL: Dict[str, float]
    MARGEN_NETO: Dict[str, float]
    RENTABILIDAD_SOBRE_EL_CAPITAL_INVERTIDO: Dict[str, float]
    RENTABILIDAD_SOBRE_RECURSOS_PROPIOS: Dict[str, float]