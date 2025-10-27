from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.cooperativa import Cooperativa
from app.schemas.cooperativa import CooperativaSchema

router = APIRouter(prefix="/cooperativas", tags=["cooperativas"])

@router.get("/", response_model=List[CooperativaSchema])
def get_all_cooperativas(db: Session = Depends(get_db)):
    return db.query(Cooperativa).all()
