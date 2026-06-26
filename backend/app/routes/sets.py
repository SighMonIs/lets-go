import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.brickset import lookup_by_barcode
from app.rebrickable import lookup_set_by_number, search_sets_by_query

log = logging.getLogger(__name__)
router = APIRouter(prefix="/sets", tags=["sets"])


@router.get("/", response_model=list[schemas.LegoSetOut])
def list_sets(db: Session = Depends(get_db)):
    return db.query(models.LegoSet).order_by(models.LegoSet.scanned_at.desc()).all()


@router.get("/{set_id}", response_model=schemas.LegoSetOut)
def get_set(set_id: int, db: Session = Depends(get_db)):
    lego_set = db.query(models.LegoSet).filter(models.LegoSet.id == set_id).first()
    if not lego_set:
        raise HTTPException(status_code=404, detail="Set not found")
    return lego_set


@router.patch("/{set_id}", response_model=schemas.LegoSetOut)
def update_set(set_id: int, data: schemas.LegoSetUpdate, db: Session = Depends(get_db)):
    lego_set = db.query(models.LegoSet).filter(models.LegoSet.id == set_id).first()
    if not lego_set:
        raise HTTPException(status_code=404, detail="Set not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lego_set, field, value)
    db.commit()
    db.refresh(lego_set)
    return lego_set


@router.delete("/{set_id}")
def delete_set(set_id: int, db: Session = Depends(get_db)):
    lego_set = db.query(models.LegoSet).filter(models.LegoSet.id == set_id).first()
    if not lego_set:
        raise HTTPException(status_code=404, detail="Set not found")
    db.delete(lego_set)
    db.commit()
    return {"ok": True}


@router.post("/scan", response_model=schemas.LegoSetOut)
async def scan_barcode(payload: dict, db: Session = Depends(get_db)):
    """
    Receive a barcode/set number from the scanner, look it up on Rebrickable,
    and save (or return existing) record.
    """
    barcode: str = payload.get("barcode", "").strip()
    if not barcode:
        raise HTTPException(status_code=400, detail="barcode is required")

    # Check if already in DB by barcode
    existing = db.query(models.LegoSet).filter(models.LegoSet.barcode == barcode).first()
    if existing:
        existing.quantity = (existing.quantity or 1) + 1
        db.commit()
        db.refresh(existing)
        return existing

    log.info("Scan request: barcode=%s", barcode)

    # Step 1: UPC Item DB converts EAN-13 → set number
    upc_result = await lookup_by_barcode(barcode)
    log.info("UPC lookup result: %s", upc_result)

    # Step 2: if we got a set number from UPC DB, look it up on Rebrickable
    if upc_result and upc_result.get("_needs_rebrickable"):
        rb_data = await lookup_set_by_number(upc_result["set_num"])
        log.info("Rebrickable lookup for set %s: %s", upc_result["set_num"], rb_data)
    else:
        rb_data = upc_result

    # Fall back: treat barcode as a set number directly (manual entry)
    if not rb_data:
        rb_data = await lookup_set_by_number(barcode)
        log.info("Rebrickable direct result: %s", rb_data)

    if not rb_data:
        results = await search_sets_by_query(barcode)
        rb_data = results[0] if results else None
        log.info("Rebrickable search result: %s", rb_data)

    if not rb_data:
        raise HTTPException(
            status_code=404,
            detail=f"No LEGO set found for barcode '{barcode}'. Try entering the set number manually.",
        )

    set_num = rb_data.get("set_num", barcode)

    # If same set_num already exists (different barcode), just bump quantity
    existing_by_num = db.query(models.LegoSet).filter(models.LegoSet.set_num == set_num).first()
    if existing_by_num:
        existing_by_num.quantity = (existing_by_num.quantity or 1) + 1
        db.commit()
        db.refresh(existing_by_num)
        return existing_by_num

    lego_set = models.LegoSet(
        set_num=set_num,
        name=rb_data.get("name", "Unknown"),
        year=rb_data.get("year"),
        num_parts=rb_data.get("num_parts"),
        set_img_url=rb_data.get("set_img_url"),
        rebrickable_url=rb_data.get("set_url"),
        barcode=barcode,
    )
    db.add(lego_set)
    db.commit()
    db.refresh(lego_set)
    return lego_set


@router.post("/lookup")
async def lookup_set(payload: dict):
    """Preview a set from Rebrickable without saving."""
    query: str = payload.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    rb_data = await lookup_set_by_number(query)
    if rb_data:
        return rb_data

    results = await search_sets_by_query(query)
    return {"results": results}
