import numpy as np
import pandas as pd
from sklearn.svm import SVR
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, mean_absolute_error
from math import sqrt

def preparar_datos_temporales(df, indicador_objetivo="Valor_CAMEL"):
    """
    Convierte datos mensuales en un dataset supervisado:
    X = meses anteriores, y = mes siguiente.
    """
    df = df.sort_values(by=["ID_cooperativa", "ano", "mes"])
    df["target"] = df.groupby("ID_cooperativa")[indicador_objetivo].shift(-1)
    df = df.dropna(subset=["target"])

    indicadores = [
        col for col in df.columns 
        if col not in ["ano", "mes", "Periodo", "cooperativa_nombre", "ID_cooperativa", "target"]
    ]

    X = df[indicadores]
    y = df["target"]
    return X, y, indicadores


def evaluar_modelo(modelo, X_train, y_train, cv=5):
    """
    Calcula validación cruzada, RMSE y MAE para un modelo.
    """
    scores = cross_val_score(modelo, X_train, y_train, cv=cv, scoring='r2')
    mean_cv = np.mean(scores)

    modelo.fit(X_train, y_train)
    y_pred = modelo.predict(X_train)

    rmse = sqrt(mean_squared_error(y_train, y_pred))
    mae = mean_absolute_error(y_train, y_pred)

    return {
        "RMSE": round(rmse, 4),
        "MAE": round(mae, 4),
        "R2_CV": round(mean_cv, 4)
    }


def predecir_mes_siguiente(modelo, df, indicadores):
    """
    Usa el último registro de la cooperativa para predecir el valor CAMEL del siguiente mes.
    """
    ultimo = df.sort_values(by=["ano", "mes"]).iloc[-1]
    X_nuevo = ultimo[indicadores].values.reshape(1, -1)
    pred = modelo.predict(X_nuevo)[0]
    return round(float(pred), 4)


def evaluar_modelos_machine_learning(df):
    """
    Evalúa SVM y Random Forest prediciendo la calificación del siguiente mes.
    """
    X, y, indicadores = preparar_datos_temporales(df, indicador_objetivo="Valor_CAMEL")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    resultados = {}

    # === Modelo 1: SVM ===
    svm_model = SVR(kernel='rbf', C=1.0, epsilon=0.1)
    resultados["SVM"] = evaluar_modelo(svm_model, X_train, y_train)
    svm_model.fit(X_train, y_train)
    y_pred_svm = svm_model.predict(X_test)
    resultados["SVM"]["RMSE_test"] = round(sqrt(mean_squared_error(y_test, y_pred_svm)), 4)
    resultados["SVM"]["MAE_test"] = round(mean_absolute_error(y_test, y_pred_svm), 4)
    resultados["SVM"]["Predicción_mes_siguiente"] = predecir_mes_siguiente(svm_model, df, indicadores)

    # === Modelo 2: Random Forest ===
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    resultados["Random Forest"] = evaluar_modelo(rf_model, X_train, y_train)
    rf_model.fit(X_train, y_train)
    y_pred_rf = rf_model.predict(X_test)
    resultados["Random Forest"]["RMSE_test"] = round(sqrt(mean_squared_error(y_test, y_pred_rf)), 4)
    resultados["Random Forest"]["MAE_test"] = round(mean_absolute_error(y_test, y_pred_rf), 4)
    resultados["Random Forest"]["Predicción_mes_siguiente"] = predecir_mes_siguiente(rf_model, df, indicadores)

    return resultados
