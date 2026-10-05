from app.database import Base, SessionLocal, engine
from app.models import Lead

LEADS = [
    ("Asha Rao", "Northwind", "asha@northwind.io", "SaaSBoomi 2026", "contacted",
     "Head of field marketing. They spend a lot on booths but can't tie it back to pipeline. "
     "Asked for a demo after Diwali, wants to loop in her RevOps lead."),
    ("Rahul Mehta", "Acme Logistics", "rahul.m@acmelogistics.com", "TechSparks Bangalore", "new",
     "Met at the coffee stand. Evaluating event tools for Q1, currently using spreadsheets. "
     "Budget approval sits with the CMO."),
    ("Priya Sharma", "Finlytics", "priya@finlytics.in", "TechSparks Bangalore", "follow_up",
     "Interested in AI summaries of sales conversations. Said to ping her in two weeks, "
     "prefers WhatsApp over email."),
    ("Daniel Okafor", "BrightPath", "daniel@brightpath.co", "SaaStr Europa", "closed",
     "Already signed with a competitor, but open to chatting next year when the contract ends."),
    ("Meera Iyer", "Cloudnest", "meera.iyer@cloudnest.dev", "SaaSBoomi 2026", "new", ""),
]

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        for name, company, email, event, status, notes in LEADS:
            db.add(Lead(name=name, company=company, email=email, event=event, status=status, notes=notes))
        db.commit()
    print(f"added {len(LEADS)} leads")
