from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class LegoSetBase(BaseModel):
    set_num: str
    name: str
    year: Optional[int] = None
    theme: Optional[str] = None
    num_parts: Optional[int] = None
    image_url: Optional[str] = None
    set_img_url: Optional[str] = None
    rebrickable_url: Optional[str] = None
    barcode: Optional[str] = None
    notes: Optional[str] = None
    condition: Optional[str] = "unknown"
    quantity: Optional[int] = 1
    estimated_value: Optional[float] = None


class LegoSetCreate(LegoSetBase):
    pass


class LegoSetUpdate(BaseModel):
    notes: Optional[str] = None
    condition: Optional[str] = None
    quantity: Optional[int] = None
    estimated_value: Optional[float] = None


class LegoSetOut(LegoSetBase):
    id: int
    scanned_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RebrickableSet(BaseModel):
    set_num: str
    name: str
    year: int
    theme_id: Optional[int] = None
    num_parts: int
    set_img_url: Optional[str] = None
    set_url: Optional[str] = None
