import httpx

from app.config import settings

BASE_URL = "https://rebrickable.com/api/v3/lego"
HEADERS = {"Authorization": f"key {settings.rebrickable_api_key}"}


async def lookup_set_by_number(set_num: str) -> dict | None:
    """Fetch set details from Rebrickable by set number (e.g. '75192-1')."""
    # Try with and without the -1 suffix
    candidates = [set_num]
    if "-" not in set_num:
        candidates.append(f"{set_num}-1")

    async with httpx.AsyncClient() as client:
        for candidate in candidates:
            resp = await client.get(
                f"{BASE_URL}/sets/{candidate}/",
                headers=HEADERS,
                timeout=10,
            )
            if resp.status_code == 200:
                return resp.json()

    return None


async def search_sets_by_query(query: str) -> list[dict]:
    """Search sets by name or partial set number."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BASE_URL}/sets/",
            headers=HEADERS,
            params={"search": query, "page_size": 10},
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json().get("results", [])
    return []
