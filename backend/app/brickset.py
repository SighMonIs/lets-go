import logging
import re

import httpx

log = logging.getLogger(__name__)


async def lookup_by_barcode(barcode: str) -> dict | None:
    """
    Convert an EAN-13/UPC barcode to a LEGO set number using UPC Item DB,
    then return the set number so Rebrickable can fetch full details.
    Returns a minimal dict with just set_num so the scan route can hand off to Rebrickable.
    """
    log.info("UPC Item DB lookup: barcode=%s", barcode)

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.upcitemdb.com/prod/trial/lookup",
            params={"upc": barcode},
            headers={"Accept": "application/json"},
            timeout=10,
        )

    log.info("UPC Item DB response: status=%s body=%s", resp.status_code, resp.text[:500])

    if resp.status_code != 200:
        log.error("UPC Item DB HTTP error: %s", resp.status_code)
        return None

    data = resp.json()
    items = data.get("items", [])
    if not items:
        log.info("UPC Item DB: no items found for barcode=%s", barcode)
        return None

    title = items[0].get("title", "")
    log.info("UPC Item DB title: %s", title)

    # Extract LEGO set number from product title (4-6 digit standalone number)
    match = re.search(r'\b(\d{4,6})\b', title)
    if not match:
        log.info("Could not extract set number from title: %s", title)
        return None

    set_num = match.group(1)
    log.info("Extracted set number: %s", set_num)

    # Return minimal dict — scan route will look this up on Rebrickable
    return {"set_num": set_num, "_needs_rebrickable": True}
