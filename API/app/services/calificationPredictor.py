import datetime
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.registro import Registro
from app.models.indicador import Indicador
from app.models.cooperativa import Cooperativa
from typing import Dict, List

class CalificationPredictorService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_registros_filtrados(self, cooperativa_nombre: str, year_inicial: int = 2014):
        """Obtiene registros filtrados usando CRUD directamente"""
        year_actual = datetime.datetime.now().year
        
        registros = self.db.query(Registro).join(
            Cooperativa, Registro.id_cooperative == Cooperativa.id_cooperative
        ).filter(
            Cooperativa.name == cooperativa_nombre,
            Registro.year >= year_inicial,
            Registro.year <= year_actual
        ).order_by(Registro.year.asc()).all()
        
        return pd.DataFrame(registros)
    
    def calcular_calificaciones_por_percentiles(self, year: int) -> Dict[str, Dict[int, int]]:
        """
        Calcula las calificaciones basadas en percentiles para cada indicador
        
        Args:
            year: Año a analizar
            
        Returns:
            Dict con estructura: {
                'indicador_nombre': {mes: calificacion, ...},
                ...
            }
        """
        # Obtener todos los registros del año especificado
        registros = self.db.query(
            Registro.id_indicator,
            Registro.month,
            Registro.value,
            Indicador.name.label('indicador_nombre')
        ).join(
            Indicador, Registro.id_indicator == Indicador.id_indicator
        ).filter(
            Registro.year == year
        ).all()
        
        if not registros:
            return {}
        
        # Convertir a DataFrame
        df = pd.DataFrame([
            {
                'id_indicator': r.id_indicator,
                'month': r.month,
                'value': r.value,
                'indicador_nombre': r.indicador_nombre
            }
            for r in registros
        ])
        
        # Calcular percentiles y calificaciones por indicador
        calificaciones = {}
        
        for indicador in df['indicador_nombre'].unique():
            df_indicador = df[df['indicador_nombre'] == indicador].copy()
            
            # Calcular percentiles para cada valor
            df_indicador['percentil'] = df_indicador['value'].rank(pct=True) * 100
            
            # Asignar calificación basada en percentiles
            def asignar_calificacion(percentil):
                if percentil <= 10:
                    return 1
                elif percentil <= 20:
                    return 2
                elif percentil <= 30:
                    return 3
                elif percentil <= 40:
                    return 4
                elif percentil <= 50:
                    return 5
                elif percentil <= 60:
                    return 6
                elif percentil <= 70:
                    return 7
                elif percentil <= 80:
                    return 8
                elif percentil <= 90:
                    return 9
                else:
                    return 10
            
            df_indicador['calificacion'] = df_indicador['percentil'].apply(asignar_calificacion)
            
            # Crear diccionario mes -> calificación promedio
            calificaciones[indicador] = df_indicador.groupby('month')['calificacion'].mean().round().astype(int).to_dict()
        
        return calificaciones
    
    def obtener_calificacion_cooperativa(self, cooperativa_nombre: str, year: int) -> Dict:
        """
        Obtiene las calificaciones mensuales de una cooperativa específica para un año
        
        Args:
            cooperativa_nombre: Nombre de la cooperativa
            year: Año a analizar
            
        Returns:
            Dict con calificaciones mensuales por indicador
        """
        # Obtener ID de la cooperativa
        cooperativa = self.db.query(Cooperativa).filter(
            Cooperativa.name == cooperativa_nombre
        ).first()
        
        if not cooperativa:
            return {"error": "Cooperativa no encontrada"}
        
        # Obtener todos los registros de todas las cooperativas para calcular percentiles
        todos_registros = self.db.query(
            Registro.id_indicator,
            Registro.month,
            Registro.value,
            Registro.id_cooperative,
            Indicador.name.label('indicador_nombre')
        ).join(
            Indicador, Registro.id_indicator == Indicador.id_indicator
        ).filter(
            Registro.year == year
        ).all()
        
        if not todos_registros:
            return {"error": f"No hay datos para el año {year}"}
        
        # Convertir a DataFrame
        df_todos = pd.DataFrame([
            {
                'id_indicator': r.id_indicator,
                'month': r.month,
                'value': r.value,
                'id_cooperative': r.id_cooperative,
                'indicador_nombre': r.indicador_nombre
            }
            for r in todos_registros
        ])
        
        resultado = {
            "cooperativa": cooperativa_nombre,
            "year": year,
            "calificaciones": {}
        }
        
        # Calcular calificaciones por indicador
        for indicador in df_todos['indicador_nombre'].unique():
            df_indicador = df_todos[df_todos['indicador_nombre'] == indicador].copy()
            
            # Calcular percentiles globales
            df_indicador['percentil'] = df_indicador['value'].rank(pct=True) * 100
            
            # Asignar calificación
            def asignar_calificacion(percentil):
                if percentil <= 10:
                    return 1
                elif percentil <= 20:
                    return 2
                elif percentil <= 30:
                    return 3
                elif percentil <= 40:
                    return 4
                elif percentil <= 50:
                    return 5
                elif percentil <= 60:
                    return 6
                elif percentil <= 70:
                    return 7
                elif percentil <= 80:
                    return 8
                elif percentil <= 90:
                    return 9
                else:
                    return 10
            
            df_indicador['calificacion'] = df_indicador['percentil'].apply(asignar_calificacion)
            
            # Filtrar solo la cooperativa solicitada
            df_coop = df_indicador[df_indicador['id_cooperative'] == cooperativa.id_cooperative]
            
            if not df_coop.empty:
                # Crear diccionario mes -> calificación
                calificaciones_mensuales = {}
                for mes in range(1, 13):
                    mes_data = df_coop[df_coop['month'] == mes]
                    if not mes_data.empty:
                        calificaciones_mensuales[mes] = int(mes_data['calificacion'].iloc[0])
                
                resultado["calificaciones"][indicador] = calificaciones_mensuales
        
        return resultado
