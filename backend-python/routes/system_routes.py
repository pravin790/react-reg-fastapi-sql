from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from models.database import ROOT, UPLOADS

router = APIRouter()

@router.get("/")
def health():
    return {"message": "Backend server is running"}

@router.get("/uploads/{filename:path}")
def uploaded_file(filename: str):
    for directory in (UPLOADS, ROOT.parent / "backend" / "uploads"):
        candidate = (directory / filename).resolve()
        if candidate.is_relative_to(directory.resolve()) and candidate.is_file():
            return FileResponse(candidate)
    raise HTTPException(404, "File not found")
