import os

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from . import ai
from .database import Base, engine, get_db
from .models import Lead
from .schemas import DraftOut, DraftRequest, LeadCreate, LeadOut, LeadUpdate, Status

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Event Lead Manager API")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_lead_or_404(lead_id: int, db: Session) -> Lead:
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/leads", response_model=list[LeadOut])
def list_leads(
    search: str | None = None,
    status: Status | None = None,
    event: str | None = None,
    sort: str = Query("newest", pattern="^(newest|oldest|name)$"),
    db: Session = Depends(get_db),
):
    stmt = select(Lead)
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Lead.name.ilike(term),
                Lead.company.ilike(term),
                Lead.email.ilike(term),
                Lead.notes.ilike(term),
            )
        )
    if status:
        stmt = stmt.where(Lead.status == status.value)
    if event:
        stmt = stmt.where(Lead.event == event)

    if sort == "oldest":
        stmt = stmt.order_by(Lead.created_at.asc(), Lead.id.asc())
    elif sort == "name":
        stmt = stmt.order_by(Lead.name.asc())
    else:
        stmt = stmt.order_by(Lead.created_at.desc(), Lead.id.desc())

    return db.scalars(stmt).all()


@app.get("/events", response_model=list[str])
def list_events(db: Session = Depends(get_db)):
    return db.scalars(select(Lead.event).distinct().order_by(Lead.event)).all()


@app.post("/leads", response_model=LeadOut, status_code=201)
def create_lead(data: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**data.model_dump(mode="json"))
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@app.get("/leads/{lead_id}", response_model=LeadOut)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    return get_lead_or_404(lead_id, db)


@app.patch("/leads/{lead_id}", response_model=LeadOut)
def update_lead(lead_id: int, data: LeadUpdate, db: Session = Depends(get_db)):
    lead = get_lead_or_404(lead_id, db)
    changes = data.model_dump(exclude_unset=True, mode="json")
    # old summary is stale once the notes change
    if "notes" in changes and changes["notes"] != lead.notes:
        lead.summary = None
    for key, value in changes.items():
        setattr(lead, key, value)
    db.commit()
    db.refresh(lead)
    return lead


@app.delete("/leads/{lead_id}", status_code=204)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = get_lead_or_404(lead_id, db)
    db.delete(lead)
    db.commit()
    return Response(status_code=204)


@app.post("/leads/{lead_id}/summary", response_model=LeadOut)
def summarize_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = get_lead_or_404(lead_id, db)
    if not lead.notes.strip():
        raise HTTPException(status_code=400, detail="This lead has no notes to summarize")
    try:
        lead.summary = ai.summarize_notes(lead)
    except ai.AIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    db.commit()
    db.refresh(lead)
    return lead


@app.post("/leads/{lead_id}/draft", response_model=DraftOut)
def draft_email(lead_id: int, req: DraftRequest | None = None, db: Session = Depends(get_db)):
    lead = get_lead_or_404(lead_id, db)
    tone = req.tone if req else "friendly"
    try:
        return ai.draft_followup(lead, tone)
    except ai.AIError as e:
        raise HTTPException(status_code=502, detail=str(e))
