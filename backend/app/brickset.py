import logging
import re

import httpx

log = logging.getLogger(__name__)


async def lookup_by_barcode(barcode: str) -> dict | None:
    """
    Look up a LEGO set number from an EAN/UPC barcode by scraping BrickOwl's
    catalog search. Extracts the set number from the result URL, then returns
    it so the scan route can fetch full details from Rebrickable.
    """
    url = f"https://www.brickowl.com/search/catalog?query={barcode}"
    log.info("BrickOwl search: %s", url)

    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})

    log.info("BrickOwl response: status=%s", resp.status_code)

    if resp.status_code != 200:
        log.error("BrickOwl HTTP error: %s", resp.status_code)
        return None

    # Find catalog URLs like /catalog/lego-some-name-set-75580
    matches = re.findall(r'/catalog/[a-z0-9-]+-set-(\d{4,6})(?:["\s])', resp.text)
    log.info("BrickOwl set numbers found: %s", matches)

    if not matches:
        return None

    set_num = matches[0]
    log.info("BrickOwl extracted set number: %s", set_num)

    return {"set_num": set_num, "_needs_rebrickable": True}
