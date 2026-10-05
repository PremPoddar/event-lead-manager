import json
import os

import httpx

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class AIError(Exception):
    pass


def _generate(prompt: str, json_output: bool = False) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise AIError("GEMINI_API_KEY is not set")

    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4},
    }
    if json_output:
        payload["generationConfig"]["responseMimeType"] = "application/json"

    try:
        res = httpx.post(
            GEMINI_URL.format(model=model),
            headers={"x-goog-api-key": api_key},
            json=payload,
            timeout=30,
        )
        res.raise_for_status()
        return res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (httpx.HTTPError, KeyError, IndexError) as e:
        raise AIError(f"Gemini request failed: {e}") from e


def summarize_notes(lead) -> str:
    prompt = f"""You help a sales team keep track of people they met at business events.
Summarize the notes below in 2-4 short bullet points (start each with "- ").
Focus on who they are, what they care about, and any next step that was mentioned.
Don't make up anything that isn't in the notes.

Name: {lead.name}
Company: {lead.company or "unknown"}
Event: {lead.event}
Notes:
{lead.notes}"""
    return _generate(prompt)


def draft_followup(lead, tone: str = "friendly") -> dict:
    prompt = f"""Write a short follow-up email to someone we met at a business event.
Tone: {tone}. Keep it under 150 words, mention the event, and refer to specifics from the notes
if there are any. End with a clear but low-pressure next step. Don't use placeholders like [Your Name],
just sign off with "Best,".

Return JSON like {{"subject": "...", "body": "..."}}.

Name: {lead.name}
Company: {lead.company or "unknown"}
Event: {lead.event}
Notes:
{lead.notes or "(no notes)"}"""
    raw = _generate(prompt, json_output=True)
    try:
        data = json.loads(raw)
        return {"subject": data["subject"], "body": data["body"]}
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        raise AIError("Couldn't parse the model response") from e
