"""
JobCopilot Agent — Supabase Database Client & Stale Job Lifecycle Manager
"""
import ssl
import json
import urllib.request
from datetime import datetime, timezone
from typing import List, Dict, Any
from agent.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from agent.scrapers.base_scraper import JobPost

class SupabaseClient:
    def __init__(self):
        self.url = SUPABASE_URL
        self.key = SUPABASE_SERVICE_ROLE_KEY
        self.is_configured = bool(self.url and self.key)
        self.ctx = ssl.create_default_context()
        self.ctx.check_hostname = False
        self.ctx.verify_mode = ssl.CERT_NONE

    def upsert_jobs(self, jobs: List[JobPost]) -> Dict[str, int]:
        """
        Upserts jobs into public.jobs using Supabase REST API with merge-duplicates.
        """
        stats = {"total": len(jobs), "upserted": 0, "failed": 0}
        if not self.is_configured:
            print("[!] Supabase no configurado (SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY ausente). Modo Simulación / Dry-Run.")
            return stats

        endpoint = f"{self.url}/rest/v1/jobs"
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }

        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Batch into chunks of 25 to ensure fast, reliable network requests
        chunk_size = 25
        for i in range(0, len(jobs), chunk_size):
            chunk = jobs[i:i + chunk_size]
            payload = []
            for j in chunk:
                d = j.to_dict()
                d["last_seen_at"] = now_iso
                d["is_active"] = True
                payload.append(d)

            try:
                body = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(endpoint, data=body, headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=20, context=self.ctx) as resp:
                    if resp.status in [200, 201]:
                        stats["upserted"] += len(chunk)
                        print(f"  [✓] Lote {i//chunk_size + 1}: {len(chunk)} vacantes sincronizadas con éxito.")
                    else:
                        stats["failed"] += len(chunk)
                        print(f"  [!] Lote {i//chunk_size + 1}: Respuesta HTTP {resp.status}")
            except Exception as e:
                stats["failed"] += len(chunk)
                print(f"  [x] Error enviando lote {i//chunk_size + 1}: {e}")

        return stats

    def deactivate_stale_jobs(self, days_threshold: int = 3) -> int:
        """
        Marks jobs not seen in the last N days as is_active = FALSE and sets closed_at = now().
        """
        if not self.is_configured:
            return 0

        # Query and update via REST API
        endpoint = f"{self.url}/rest/v1/jobs?last_seen_at=lt.now()+-+{days_threshold}+days&is_active=eq.true"
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        now_iso = datetime.now(timezone.utc).isoformat()
        patch_payload = json.dumps({"is_active": False, "closed_at": now_iso}).encode('utf-8')

        try:
            req = urllib.request.Request(endpoint, data=patch_payload, headers=headers, method="PATCH")
            with urllib.request.urlopen(req, timeout=15, context=self.ctx) as resp:
                if resp.status in [200, 204]:
                    print(f"[*] Limpieza de ciclo de vida completada (ofertas inactivas marcadas como cerradas).")
                    return 1
        except Exception as e:
            print(f"[-] Aviso en desactivación de ofertas inactivas: {e}")

        return 0
