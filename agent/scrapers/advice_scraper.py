"""
JobCopilot Agent — Advice Recursos Humanos Scraper (Zoho Recruit Embedded Engine)
"""
import re
import json
import html
from typing import List
from agent.scrapers.base_scraper import BaseScraper, JobPost

class AdviceScraper(BaseScraper):
    name = "advice"
    source_type = "hr_consultancy"
    priority = 2

    CAREERS_URL = "https://advice.zohorecruit.com/jobs/Careers"

    def fetch_jobs(self) -> List[JobPost]:
        jobs = []
        print(f"[*] [{self.name}] Consultando ofertas en tiempo real de Advice Recursos Humanos...")
        try:
            raw_html = self.fetch_url(self.CAREERS_URL)
            decoded = html.unescape(raw_html)

            # Extract job objects embedded in Zoho Recruit page
            matches = re.finditer(r'(\{[^{}]*\"Posting_Title\":\s*\"[^\"]+\"[^{}]*\})', decoded)
            seen_ids = set()

            for m in matches:
                try:
                    obj = json.loads(m.group(1))
                    job_id = obj.get("id")
                    title = obj.get("Posting_Title")
                    if not job_id or not title or job_id in seen_ids:
                        continue
                    seen_ids.add(job_id)

                    desc = obj.get("Job_Description") or f"Búsqueda gestionada por Advice Recursos Humanos: {title}."
                    city = obj.get("City") or "Montevideo"
                    is_remote = bool(obj.get("Remote_Job"))
                    job_type = (obj.get("Job_Type") or "").lower()

                    hours = "4h" if "part" in job_type else "8h"
                    hours_label = "4 a 6 horas (Part-time)" if "part" in job_type else "8 horas (Tiempo Completo)"
                    modality = "Remoto" if is_remote else "Presencial"
                    modality_key = "remote" if is_remote else "presential"

                    apply_url = f"https://advice.zohorecruit.com/jobs/Careers/{job_id}"

                    # Company extraction if title has prefix e.g. "EMPRESA: Cargo"
                    company = "Advice Recursos Humanos"
                    if ":" in title:
                        parts = title.split(":", 1)
                        company = f"{parts[0].strip()} (vía Advice)"
                        title = parts[1].strip()

                    jobs.append(JobPost(
                        company=company,
                        title=title,
                        apply_url=apply_url,
                        description=desc,
                        source_platform="advice_uy",
                        source_priority=self.priority,
                        country=self.country,
                        location=f"{city}, Uruguay",
                        hours=hours,
                        hours_label=hours_label,
                        modality=modality,
                        modality_key=modality_key,
                        salary_guide="$40.000 - $70.000 UYU (según posición)",
                        raw_source_data={"zoho_id": job_id, "industry": obj.get("Industry")}
                    ))
                except Exception:
                    continue

            print(f"[+] [{self.name}] Advice: {len(jobs)} vacantes oficiales obtenidas.")
        except Exception as e:
            print(f"[-] [{self.name}] Error consultando Advice: {e}")

        return jobs
