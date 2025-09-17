from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return{"message": "Bienvenido a mi API con FastAPI 🚀"}

from API.app.routes.camel import router as camel_router
from API.app.routes.cooperativa import router as cooperativa_router
from API.app.routes.indicador import router as indicador_router
from API.app.routes.registro import router as registro_router


app.include_router(camel_router)
app.include_router(cooperativa_router)
app.include_router(indicador_router)
app.include_router(registro_router)
