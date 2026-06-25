from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.database import Base


class LegoSet(Base):
    __tablename__ = "lego_sets"

    id = Column(Integer, primary_key=True, index=True)
    set_num = Column(String, unique=True, index=True, nullable=False)  # e.g. "75192-1"
    name = Column(String, nullable=False)
    year = Column(Integer)
    theme = Column(String)
    num_parts = Column(Integer)
    image_url = Column(String)
    set_img_url = Column(String)
    rebrickable_url = Column(String)
    barcode = Column(String, index=True)  # EAN/UPC from scan
    notes = Column(Text)
    condition = Column(String, default="unknown")  # sealed, complete, incomplete, parts_only
    quantity = Column(Integer, default=1)
    estimated_value = Column(Float)
    scanned_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
