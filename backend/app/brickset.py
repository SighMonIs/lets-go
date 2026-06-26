import json

import httpx

from app.config import settings

BASE_URL = "https://brickset.com/api/v3.asmx"


async def lookup_by_barcode(barcode: str) -> dict | None:
    """Look up a LEGO set by EAN/UPC barcode via Brickset API."""
    if not settings.brickset_api_key:
        return None

    params = {
        "apiKey": settings.brickset_api_key,
        "userHash": "",
        "params": json.dumps({"barcode": barcode}),
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/getSets", params=params, timeout=10)

    if resp.status_code != 200:
        return None

    data = resp.json()
    sets = data.get("sets", [])
    if not sets:
        return None

    s = sets[0]
    image = s.get("image", {})

    return {
        "set_num": f"{s['number']}-{s.get('numberVariant', 1)}",
        "name": s.get("name", "Unknown"),
        "year": s.get("year"),
        "num_parts": s.get("pieces"),
        "set_img_url": image.get("imageURL") or image.get("thumbnailURL"),
        "set_url": s.get("bricksetURL"),
    }
