import json
import logging

import httpx

from app.config import settings

BASE_URL = "https://brickset.com/api/v3.asmx"
log = logging.getLogger(__name__)


async def lookup_by_barcode(barcode: str) -> dict | None:
    """Look up a LEGO set by EAN/UPC barcode via Brickset API."""
    if not settings.brickset_api_key:
        log.warning("BRICKSET_API_KEY not set — skipping barcode lookup")
        return None

    params = {
        "apiKey": settings.brickset_api_key,
        "userHash": "",
        "params": json.dumps({"EAN": barcode}),
    }

    log.info("Brickset lookup: EAN=%s", barcode)

    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/getSets", params=params, timeout=10)

    log.info("Brickset response: status=%s body=%s", resp.status_code, resp.text[:500])

    if resp.status_code != 200:
        log.error("Brickset HTTP error: %s", resp.status_code)
        return None

    data = resp.json()

    if data.get("status") == "error":
        log.error("Brickset API error: %s", data.get("message"))
        return None

    sets = data.get("sets", [])
    if not sets:
        log.info("Brickset returned 0 sets for EAN=%s", barcode)
        return None

    s = sets[0]
    image = s.get("image", {})
    result = {
        "set_num": f"{s['number']}-{s.get('numberVariant', 1)}",
        "name": s.get("name", "Unknown"),
        "year": s.get("year"),
        "num_parts": s.get("pieces"),
        "set_img_url": image.get("imageURL") or image.get("thumbnailURL"),
        "set_url": s.get("bricksetURL"),
    }
    log.info("Brickset found: %s", result)
    return result
