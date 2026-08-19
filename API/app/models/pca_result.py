from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from app.database import Base

class PcaResult(Base):
    __tablename__ = "pca_result"

    id_pca_result = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    quantity_cooperatives = Column(Integer, nullable=False)
    quantity_records = Column(Integer, nullable=False)
    id_indicator = Column(Integer, ForeignKey("camel_indicator.id_indicator"), nullable=False)
    weight = Column(Numeric(20, 10), nullable=False)
    weight_percentage = Column(Numeric(20, 10), nullable=False)
