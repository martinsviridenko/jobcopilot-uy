"""
JobCopilot Agent — BuscoJobs Uruguay Scraper (Next.js Data Extraction)
"""
import re
import json
from typing import List
from agent.scrapers.base_scraper import BaseScraper, JobPost

class BuscoJobsScraper(BaseScraper):
    name = "buscojobs"
    source_type = "buscojobs"
    priority = 5

    FEED_URL = "https://www.buscojobs.com.uy/ofertas"

    def fetch_jobs(self) -> List[JobPost]:
        jobs = []
        print(f"[*] [{self.name}] Consultando ofertas en tiempo real de BuscoJobs Uruguay...")
        try:
            html = self.fetch_url(self.FEED_URL)
            
            # BuscoJobs embeds structured results inside __NEXT_DATA__
            m = re.search(r'<script\s+id="__NEXT_DATA__"\s+type="application/json">([\s\S]*?)</script>', html)
            if m:
                data = json.loads(m.group(1))
                ofertas = data.get("props", {}).get("pageProps", {}).get("resultadosIniciales", {}).get("ofertas", [])
                
                for o in ofertas:
                    job_id = o.get("IdOferta")
                    title = o.get("CargoVacante", "").strip()
                    if not title or not job_id:
                        continue

                    company = (o.get("NombreEmpresa") or o.get("Empresa") or "Empresa Destacada (vía BuscoJobs)").strip()
                    desc = (o.get("Descripcion") or f"Oportunidad laboral publicada en BuscoJobs Uruguay: {title}.").strip()
                    apply_url = f"https://www.buscojobs.com.uy/oferta/{job_id}"
                    city = o.get("Ciudad") or o.get("Departamento") or "Montevideo"
                    
                    is_pasantia = bool(o.get("EsPasantia"))
                    is_hibrido = bool(o.get("PermiteTrabajoHibrido"))
                    is_remoto = bool(o.get("PermiteTeletrabajo"))
                    
                    modality = "Remoto" if is_remoto else ("Híbrido" if is_hibrido else "Presencial")
                    modality_key = "remote" if is_remoto else ("hybrid" if is_hibrido else "presential")

                    hours = "4h" if is_pasantia else "8h"
                    hours_label = "4 a 6 horas (Pasantía)" if is_pasantia else "8 horas (Tiempo Completo)"

                    jobs.append(JobPost(
                        company=company,
                        title=title,
                        apply_url=apply_url,
                        description=desc,
                        source_platform="buscojobs_uy",
                        source_priority=self.priority,
                        country=self.country,
                        location=f"{city}, Uruguay",
                        hours=hours,
                        hours_label=hours_label,
                        modality=modality,
                        modality_key=modality_key,
                        raw_source_data={"id_oferta": job_id, "primer_empleo": o.get("PrimerEmpleo")}
                    ))

                print(f"[+] [{self.name}] BuscoJobs: {len(jobs)} vacantes estructuradas obtenidas.")
        except Exception as e:
            print(f"[-] [{self.name}] Error consultando BuscoJobs: {e}")

        return jobs
