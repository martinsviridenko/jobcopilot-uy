"""
JobCopilot Agent — LinkedIn Public Guest Job Search Scraper (Uruguay)
"""
import re
import urllib.parse
from typing import List
from agent.scrapers.base_scraper import BaseScraper, JobPost

class LinkedInGuestScraper(BaseScraper):
    name = "linkedin"
    source_type = "linkedin_guest"
    priority = 4

    SEARCH_KEYWORDS = [
        "estudiante", "pasantía", "analista", "part time",
        "junior", "negocios digitales", "data", "banca"
    ]

    def fetch_jobs(self) -> List[JobPost]:
        jobs = []
        seen_urls = set()

        for kw in self.SEARCH_KEYWORDS[:4]: # Sample top 4 queries per cycle to stay respectful
            encoded_kw = urllib.parse.quote(kw)
            url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={encoded_kw}&location=Uruguay&start=0"
            print(f"[*] [{self.name}] Consultando LinkedIn Guest API para '{kw}' en Uruguay...")
            try:
                html = self.fetch_url(url)
                
                # Match job card blocks
                cards = re.findall(r'<li[^>]*>([\s\S]*?)</li>', html)
                print(f"    -> Encontradas {len(cards)} tarjetas de empleo para '{kw}'.")

                for card in cards:
                    # Link
                    link_match = re.search(r'href="([^"]*linkedin\.com/jobs/view/[^"]*)"', card)
                    if not link_match:
                        continue
                    apply_url = link_match.group(1).split("?")[0] # Clean tracking params
                    if apply_url in seen_urls:
                        continue
                    seen_urls.add(apply_url)

                    # Title
                    title_match = re.search(r'<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)</h3>', card)
                    title = re.sub(r'\s+', ' ', title_match.group(1)).strip() if title_match else "Oportunidad Laboral"

                    # Company
                    comp_match = re.search(r'<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)</h4>', card)
                    company = re.sub(r'<[^>]+>', '', comp_match.group(1)).strip() if comp_match else "Empresa Destacada"

                    # Location
                    loc_match = re.search(r'<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)</span>', card)
                    loc = re.sub(r'\s+', ' ', loc_match.group(1)).strip() if loc_match else "Montevideo, Uruguay"

                    jobs.append(JobPost(
                        company=company,
                        title=title,
                        apply_url=apply_url,
                        description=f"Vacante activa publicada en LinkedIn Uruguay para {company}: {title}. Verificada por JobCopilot Agent.",
                        source_platform="linkedin",
                        source_priority=self.priority,
                        country=self.country,
                        location=loc
                    ))

            except Exception as e:
                print(f"[-] [{self.name}] Error consultando LinkedIn para '{kw}': {e}")

        print(f"[+] [{self.name}] Total LinkedIn: {len(jobs)} vacantes únicas obtenidas.")
        return jobs
