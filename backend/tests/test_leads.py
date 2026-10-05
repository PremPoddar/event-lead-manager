from app import ai

LEAD = {
    "name": "Asha Rao",
    "company": "Northwind",
    "email": "asha@northwind.io",
    "event": "SaaSBoomi 2026",
    "notes": "Runs field marketing, wants better ROI tracking for their booth spend.",
}


def make_lead(client, **overrides):
    res = client.post("/leads", json={**LEAD, **overrides})
    assert res.status_code == 201
    return res.json()


def test_create_and_get(client):
    lead = make_lead(client)
    assert lead["status"] == "new"
    assert lead["summary"] is None

    res = client.get(f"/leads/{lead['id']}")
    assert res.status_code == 200
    assert res.json()["email"] == "asha@northwind.io"


def test_create_validation(client):
    res = client.post("/leads", json={**LEAD, "email": "not-an-email"})
    assert res.status_code == 422
    res = client.post("/leads", json={**LEAD, "name": ""})
    assert res.status_code == 422


def test_update(client):
    lead = make_lead(client)
    res = client.patch(f"/leads/{lead['id']}", json={"status": "contacted"})
    assert res.status_code == 200
    assert res.json()["status"] == "contacted"
    assert res.json()["name"] == "Asha Rao"


def test_editing_notes_clears_summary(client, monkeypatch):
    lead = make_lead(client)
    monkeypatch.setattr(ai, "summarize_notes", lambda l: "- some summary")
    client.post(f"/leads/{lead['id']}/summary")

    res = client.patch(f"/leads/{lead['id']}", json={"notes": "new notes"})
    assert res.json()["summary"] is None


def test_delete(client):
    lead = make_lead(client)
    assert client.delete(f"/leads/{lead['id']}").status_code == 204
    assert client.get(f"/leads/{lead['id']}").status_code == 404
    assert client.delete(f"/leads/{lead['id']}").status_code == 404


def test_search_and_filter(client):
    make_lead(client)
    make_lead(client, name="Rahul Mehta", company="Acme", email="rahul@acme.com", event="TechSparks", notes="")
    b = make_lead(client, name="Priya S", company="Acme", email="priya@acme.com", event="TechSparks", notes="")
    client.patch(f"/leads/{b['id']}", json={"status": "follow_up"})

    assert len(client.get("/leads").json()) == 3
    assert len(client.get("/leads", params={"search": "acme"}).json()) == 2
    assert len(client.get("/leads", params={"search": "booth"}).json()) == 1
    assert len(client.get("/leads", params={"event": "TechSparks"}).json()) == 2

    res = client.get("/leads", params={"event": "TechSparks", "status": "follow_up"}).json()
    assert [l["name"] for l in res] == ["Priya S"]

    assert client.get("/events").json() == ["SaaSBoomi 2026", "TechSparks"]


def test_summary(client, monkeypatch):
    lead = make_lead(client)
    monkeypatch.setattr(ai, "summarize_notes", lambda l: "- wants ROI tracking")
    res = client.post(f"/leads/{lead['id']}/summary")
    assert res.status_code == 200
    assert res.json()["summary"] == "- wants ROI tracking"


def test_summary_needs_notes(client):
    lead = make_lead(client, notes="")
    assert client.post(f"/leads/{lead['id']}/summary").status_code == 400


def test_draft(client, monkeypatch):
    lead = make_lead(client)
    monkeypatch.setattr(ai, "draft_followup", lambda l, tone: {"subject": "Hi", "body": "Hello"})
    res = client.post(f"/leads/{lead['id']}/draft", json={"tone": "formal"})
    assert res.status_code == 200
    assert res.json() == {"subject": "Hi", "body": "Hello"}


def test_ai_error_returns_502(client, monkeypatch):
    lead = make_lead(client)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    res = client.post(f"/leads/{lead['id']}/summary")
    assert res.status_code == 502
