from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from openai import OpenAI
import os
import json
import fitz
from docx import Document
import traceback


load_dotenv()

app = FastAPI(title="LMS Smart AI Grader")

class GradeRequest(BaseModel):
    text: str
    rubric: str
    model: Optional[str] = "gpt-4.1-mini"

class GradeResponse(BaseModel):
    grade: str
    score: int
    max_score: int
    criteria_scores: List[Dict[str, Any]]
    feedback: str

@app.get("/")
def root():
    return {"message": "LMS Smart AI Grader running"}

@app.post("/grade", response_model=GradeResponse)
def grade_assignment(request: GradeRequest):
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY belum diisi")

    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Teks jawaban kosong")

    if not request.rubric.strip():
        raise HTTPException(status_code=400, detail="Rubrik kosong")

    client = OpenAI(api_key=api_key)

    prompt = f"""
Nilai jawaban mahasiswa berdasarkan rubrik berikut.

Kembalikan JSON valid saja dengan format:
{{
  "grade": "A/B/C/D/E",
  "score": 0,
  "max_score": 100,
  "criteria_scores": [
    {{
      "criterion": "nama kriteria",
      "weight": "persentase atau poin",
      "score": 0,
      "max_score": 0,
      "comment": "komentar singkat"
    }}
  ],
  "feedback": "feedback lengkap untuk mahasiswa"
}}

Rubrik:
{request.rubric}

Jawaban:
{request.text}
"""

    try:
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {
                    "role": "system",
                    "content": "Kamu adalah penilai tugas akademik. Jawab hanya JSON valid."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=2000
        )

        content = response.choices[0].message.content.strip()

        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        elif content.startswith("```"):
            content = content.replace("```", "").strip()

        result = json.loads(content)

        return GradeResponse(
            grade=str(result.get("grade", "N/A")),
            score=int(result.get("score", 0)),
            max_score=int(result.get("max_score", 100)),
            criteria_scores=result.get("criteria_scores", []),
            feedback=str(result.get("feedback", "Feedback tidak tersedia"))
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))