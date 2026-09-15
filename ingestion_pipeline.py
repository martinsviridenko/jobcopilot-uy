#!/usr/bin/env python3
"""
JobCopilot AI Uruguay — Pipeline de Ingesta y Deduplicación Automática
Corre de forma desatendida en GitHub Actions todos los días para rastrear
nuevas vacantes y actualizar Supabase PostgreSQL.
"""

import os
import sys
import json
import hashlib
import re
import urllib.request
import urllib.parse
from datetime import datetime

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

def make_dedup_hash(company, title, hours):
    raw = f"{slugify(company)}_{slugify(title)}_{slugify(hours)}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def detect_hours(title, desc):
    combined = f"{title} {desc}".lower()
    if any(k in combined for k in ["4 horas", "4h", "part-time 20", "20 horas", "pasantía 4", "pasantia 4"]):
        return "4h", "4 horas diarias (Part-time)"
    if any(k in combined for k in ["6 horas", "6h", "30 horas", "bancaria", "medio turno", "media jornada"]):
        return "6h", "6 horas diarias (Medio turno)"
    return "8h", "8 horas (Tiempo Completo)"

def detect_modality(desc):
    combined = desc.lower()
    if "remoto" in combined or "remote" in combined:
        return "Remoto", "remote"
    if "híbrido" in combined or "hibrido" in combined or "hybrid" in combined:
        return "Híbrido", "hybrid"
    return "Presencial", "presential"

def detect_sector(company, title):
    combined = f"{company} {title}".lower()
    if any(k in combined for k in ["banco", "itau", "santander", "cash", "financ", "banca"]):
        return "bank", "Banca, Finanzas & Crédito"
    if any(k in combined for k in ["cpa", "pwc", "ey", "deloitte", "kpmg", "advice", "consult", "auditor"]):
        return "consulting", "Consultoría, Auditoría & Procesos"
    if any(k in combined for k in ["tech", "software", "dlocal", "mercado libre", "meli", "pento", "quantik", "sistemas"]):
        return "tech", "Tecnología, Software & E-commerce"
    if any(k in combined for k in ["farmashop", "bestseller", "retail", "supermercado", "consumo"]):
        return "retail", "Retail, Salud & Consumo Masivo"
    return "univ", "Pasantías & Bolsas de Empleo"

# ----------------------------------------------------------------------
# FUENTE 1: Teamtailor JSON Público de CPA Ferrere
# ----------------------------------------------------------------------
def fetch_cpa_ferrere_jobs():
    jobs = []
    url = "https://talento.cpaferrere.com/jobs.json"
    print(f"[*] Consultando endpoint público de CPA Ferrere: {url}...")
    try:
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(url, headers={"User-Agent": "JobCopilot-Bot/1.0"})
        with urllib.request.urlopen(req, timeout=15, context=ctx) as res:
            if res.status == 200:
                data = json.loads(res.read().decode('utf-8'))
                # Teamtailor expone lista de jobs
                raw_jobs = data.get("items", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
                for rj in raw_jobs:
                    title = rj.get("title", "")
                    apply_url = rj.get("url") or rj.get("apply_url") or f"https://talento.cpaferrere.com/jobs/{rj.get('id')}"
                    body = rj.get("content_text") or rj.get("content_html") or ""
                    # Limpiar etiquetas HTML
                    clean_desc = re.sub(r'<[^>]+>', ' ', body).strip()
                    hours, hours_label = detect_hours(title, clean_desc)
                    mod, mod_key = detect_modality(clean_desc)
                    
                    jobs.append({
                        "hash_dedup": make_dedup_hash("CPA Ferrere", title, hours),
                        "company": "CPA Ferrere",
                        "title": title,
                        "hours": hours,
                        "hours_label": hours_label,
                        "modality": mod,
                        "modality_key": mod_key,
                        "sector": "consulting",
                        "sector_label": "Consultoría & Procesos",
                        "location": "Montevideo",
                        "description": clean_desc[:400] + "...",
                        "career_fit": ["Administración", "Economía", "Negocios Digitales", "Contabilidad"],
                        "requirements": {
                            "mandatory": ["Estudiante universitario avanzado o graduado", f"Disponibilidad {hours}"],
                            "desirable": ["Capacidad analítica", "Manejo de Excel"],
                            "bonus": ["Inglés intermedio"]
                        },
                        "salary_guide": "$45.000 - $65.000 UYU (según régimen)",
                        "apply_url": apply_url,
                        "is_linkedin": False,
                        "is_talent_pool": False,
                        "source_platform": "cpa_teamtailor",
                        "is_active": True
                    })
                print(f"[+] CPA Ferrere: {len(jobs)} vacantes procesadas con éxito.")
    except Exception as e:
        print(f"[-] Error consultando CPA Ferrere: {e}")
    return jobs

# ----------------------------------------------------------------------
# ENVÍO A SUPABASE MEDIANTE REST API
# ----------------------------------------------------------------------
def upsert_to_supabase(job_list):
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[!] SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas. Ejecución en modo simulado (Dry Run).")
        print(f"[*] Total de empleos listos para persistir: {len(job_list)}")
        return

    endpoint = f"{SUPABASE_URL}/rest/v1/jobs"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    print(f"[*] Enviando {len(job_list)} empleos a Supabase...")
    for job in job_list:
        try:
            payload = json.dumps(job).encode('utf-8')
            req = urllib.request.Request(endpoint, data=payload, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
                if resp.status in [200, 201]:
                    print(f"  [✓] Upsert OK: {job['company']} — {job['title']}")
                else:
                    print(f"  [!] Respuesta {resp.status} para {job['title']}")
        except Exception as err:
            print(f"  [x] Error insertando {job['title']}: {err}")

def main():
    print("=" * 60)
    print("  JOBCOPILOT AI — PIPELINE DE INGESTA AUTOMÁTICA")
    print(f"  Hora de ejecución: {datetime.utcnow().isoformat()} UTC")
    print("=" * 60)

    all_scraped = []
    
    # 1. Ingesta de ATS oficiales
    all_scraped.extend(fetch_cpa_ferrere_jobs())

    # 2. Deduplicación interna en memoria
    unique_jobs = {}
    for j in all_scraped:
        h = j["hash_dedup"]
        if h not in unique_jobs:
            unique_jobs[h] = j

    print(f"[*] Vacantes únicas listas tras deduplicación: {len(unique_jobs)}")

    # 3. Persistencia en Supabase
    upsert_to_supabase(list(unique_jobs.values()))
    print("[*] Pipeline finalizado con éxito.")

if __name__ == "__main__":
    main()
