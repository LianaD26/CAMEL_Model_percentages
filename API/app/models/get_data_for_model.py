import numpy as np
from API.app.models.indicador import Indicador
from API.app.models.modelo_ag import camel_structure

def get_X_y_from_db(db, target_column):
    """
    Extrae los indicadores definidos en camel_structure y la variable objetivo de la base de datos.
    Args:
        db: sesión de SQLAlchemy
        target_column: nombre del atributo objetivo en Indicador
    Returns:
        X: np.ndarray de indicadores
        y: np.ndarray de variable objetivo
    """
    indicadores = []
    y = []
    query = db.query(Indicador).all()
    for registro in query:
        fila = []
        for bloque, nombres in camel_structure.items():
            for nombre in nombres:
                valor = getattr(registro, nombre, None)
                fila.append(valor if valor is not None else 0)
        indicadores.append(fila)
        y.append(getattr(registro, target_column, 0))
    X = np.array(indicadores)
    y = np.array(y)
    return X, y
