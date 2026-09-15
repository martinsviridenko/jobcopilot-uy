"""
JobCopilot Agent — Smart Talent (Uruguay XXI) Scraper
"""
import re
from typing import List
from agent.scrapers.base_scraper import BaseScraper, JobPost

class SmartTalentScraper(BaseScraper):
    name = "smarttalent"
    source_type = "smarttalent"
    priority = 3

    SEARCH_URL = "https://www.smarttalent.uy/innovaportal/v/70548/15/innova.front/ofertas-laborales.html"

    def fetch_jobs(self) -> List[JobPost]:
        jobs = []
        print(f"[*] [{self.name}] Consultando portal oficial Smart Talent Uruguay XXI...")
        try:
            html = self.fetch_url(self.SEARCH_URL)
            # Smart Talent renders articles / job cards with class item-oferta or links containing /innova.front/
            matches = re.findall(r'<a\s+href="([^"]+)"[^>]*title="([^"]*)"[^>]*>([\s\S]*?)</a>', html)
            seen_urls = set()

            for href, title_attr, inner in matches:
                if "/innova.front/" in href and ("oferta" in href.lower() or "empleo" in href.lower() or "post" in href.lower()):
                    full_url = href if href.startswith("http") else f"https://www.smarttalent.uy{href}"
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    clean_title = re.sub(r'<[^>]+>', '', title_attr or inner).strip()
                    if len(clean_title) < 5 or clean_title.lower() in ["ver más", "postularse", "compartir"]:
                        continue

                    jobs.append(JobPost(
                        company="Empresa Socia Smart Talent",
                        title=clean_title,
                        apply_url=full_url,
                        description=f"Oportunidad laboral publicada en Smart Talent Uruguay XXI para profesionales y estudiantes: {clean_title}.",
                        source_platform="smarttalent_uy",
                        source_priority=self.priority,
                        country=self.country,
                        location="Montevideo / Zona Franca",
                        salary_guide="Regulado por mercado exportador IT/Servicios"
                    ))

            print(f"[+] [{self.name}] Smart Talent: {len(jobs)} vacantes procesadas con éxito.")
        except Exception as e:
            print(f"[-] [{self.name}] Error consultando Smart Talent: {e}")

        return jobs
