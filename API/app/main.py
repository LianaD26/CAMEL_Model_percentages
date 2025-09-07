from fastapi import FastAPI
from app.routes.camel import router as camel_router
from app.routes.cooperativa import router as cooperativa_router
from app.routes.indicador import router as indicador_router
from app.routes.registro import router as registro_router

app = FastAPI()

@app.get("/")
def root():
    return{"message": "Bienvenido a mi API con FastAPI 🚀"}

app.include_router(camel_router)
app.include_router(cooperativa_router)
app.include_router(indicador_router)
app.include_router(registro_router)


from app.routes.camel import router as camel_router
from app.routes.cooperativa import router as cooperativa_router
from app.routes.indicador import router as indicador_router
from app.routes.registro import router as registro_router


app.include_router(camel_router)
app.include_router(cooperativa_router)
app.include_router(indicador_router)
app.include_router(registro_router)