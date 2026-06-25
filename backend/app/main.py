from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes import sets

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LEt's GO", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sets.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
