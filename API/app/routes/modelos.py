# app/routers/modelos.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.evaluar_modelos import evaluar_modelos_machine_learning

router = APIRouter(prefix="/modelos", tags=["Modelos"])

class CamelInput(BaseModel):
    """
    Estructura del cuerpo JSON que enviará el frontend.
    Ejemplo:
    {
        "cooperativa": "COOPXYZ",
        "ano": 2024,
        "valores_CAMEL": [
            {"mes": 1, "valor": 0.65},
            {"mes": 2, "valor": 0.63},
            ...
        ]
    }
    """
    cooperativa: str
    ano: int
    valores_CAMEL: List[Dict[str, Any]]

@router.post("/evaluar")
def evaluar_modelos_endpoint(data: CamelInput):
    """
    Evalúa SVM y Random Forest usando los valores CAMEL mensuales enviados desde el frontend.
    """
    try:
        import pandas as pd
        import math
        import numpy as np

        # 🔹 Función para limpiar valores no compatibles con JSON
        def limpiar_json(obj):
            if isinstance(obj, float):
                if math.isinf(obj) or math.isnan(obj):
                    return None
                return obj
            elif isinstance(obj, list):
                return [limpiar_json(x) for x in obj]
            elif isinstance(obj, dict):
                return {k: limpiar_json(v) for k, v in obj.items()}
            return obj

        # Convertir la lista de meses a DataFrame
        df = pd.DataFrame(data.valores_CAMEL)
        df["ID_cooperativa"] = data.cooperativa
        df["ano"] = data.ano

        # Validar estructura esperada
        if "mes" not in df.columns or "valor" not in df.columns:
            raise ValueError("Los datos deben tener columnas 'mes' y 'valor'.")

        # Renombrar para coincidir con el modelo
        df = df.rename(columns={"valor": "Valor_CAMEL"})

        # Llamar a la función de evaluación
        resultados = evaluar_modelos_machine_learning(df)

        # 🔹 Limpiar resultados antes de devolverlos
        resultados_limpios = limpiar_json(resultados)

        return {
            "cooperativa": data.cooperativa,
            "año": data.ano,
            "resultados": resultados_limpios
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al evaluar modelo: {str(e)}")