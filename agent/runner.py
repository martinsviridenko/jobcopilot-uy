"""
JobCopilot Autonomous Job Hunting Agent — CLI Runner & Orchestrator
Usage:
    python3 -m agent.runner --country UY
    python3 -m agent.runner --sources teamtailor,greenhouse --dry-run
"""
import sys
import argparse
from datetime import datetime, timezone
from agent.config import DEFAULT_COUNTRY
from agent.scrapers import get_scrapers, AVAILABLE_SCRAPERS
from agent.pipeline.normalizer import normalize_job_post
from agent.pipeline.deduplicator import deduplicate_job_posts
from agent.pipeline.database import SupabaseClient

def main():
    parser = argparse.ArgumentParser(description="JobCopilot Autonomous Job Hunting Agent")
    parser.add_argument("--country", default=DEFAULT_COUNTRY, help="Country code (default: UY)")
    parser.add_argument("--sources", default="all", help="Comma-separated scrapers or 'all'")
    parser.add_argument("--dry-run", action="store_true", help="Run without persisting to Supabase")
    parser.add_argument("--clean-stale", action="store_true", default=True, help="Clean stale jobs older than 3 days")
    args = parser.parse_args()

    start_time = datetime.now(timezone.utc)
    print("=" * 65)
    print(f"  🚀 JOBCOPILOT AGENT — RASTREO AUTÓNOMO DE VACANTES [{args.country}]")
    print(f"  Fecha y hora: {start_time.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    print("=" * 65)

    # 1. Determine active scrapers
    enabled = None
    if args.sources != "all":
        enabled = [s.strip() for s in args.sources.split(",") if s.strip() in AVAILABLE_SCRAPERS]
    scrapers = get_scrapers(country=args.country, enabled_names=enabled)
    print(f"[*] Adaptadores de fuente activados ({len(scrapers)}): {[s.name for s in scrapers]}")

    # 2. Scrape all sources
    raw_posts = []
    source_stats = {}
    for s in scrapers:
        try:
            posts = s.fetch_jobs()
            raw_posts.extend(posts)
            source_stats[s.name] = len(posts)
        except Exception as e:
            print(f"[!] Error inesperado en scraper '{s.name}': {e}")
            source_stats[s.name] = 0

    print("-" * 65)
    print(f"[*] Total de publicaciones brutas recolectadas: {len(raw_posts)}")
    for s_name, count in source_stats.items():
        print(f"    • {s_name}: {count} publicaciones")

    # 3. Normalization, intelligent hours estimation, domain tagging
    print("[*] Ejecutando normalización semántica, detección de horas y clasificación de dominios...")
    normalized_posts = []
    for p in raw_posts:
        norm = normalize_job_post(p)
        normalized_posts.append(norm)

    # 4. Cross-source deduplication with authority hierarchy
    print("[*] Aplicando deduplicación cross-source y jerarquía de fuentes...")
    unique_posts = deduplicate_job_posts(normalized_posts)
    print(f"[+] Vacantes únicas consolidadas tras deduplicación: {len(unique_posts)}")

    # Breakdown statistics
    hours_breakdown = {"4h": 0, "6h": 0, "8h": 0}
    domain_breakdown = {}
    estimated_hours_count = 0

    for u in unique_posts:
        hours_breakdown[u.hours] = hours_breakdown.get(u.hours, 0) + 1
        domain_breakdown[u.domain] = domain_breakdown.get(u.domain, 0) + 1
        if u.is_hours_estimated:
            estimated_hours_count += 1

    print("\n📊 Métricas de la Ingesta:")
    print(f"   • Carga horaria: 4 horas ({hours_breakdown.get('4h', 0)}), 6 horas ({hours_breakdown.get('6h', 0)}), 8 horas ({hours_breakdown.get('8h', 0)})")
    print(f"   • Horas estimadas por contexto/IA: {estimated_hours_count}")
    print("   • Distribución por área profesional:")
    for dom, cnt in sorted(domain_breakdown.items(), key=lambda x: -x[1]):
        print(f"     - {dom}: {cnt}")

    # 5. Persist to Supabase
    db = SupabaseClient()
    if args.dry_run:
        print("\n[!] Modo --dry-run activado: No se modificó la base de datos Supabase.")
    else:
        print(f"\n[*] Sincronizando con Supabase PostgreSQL...")
        db_stats = db.upsert_jobs(unique_posts)
        print(f"[+] Sincronización completada: {db_stats['upserted']} vacantes actualizadas/creadas.")

        if args.clean_stale:
            db.deactivate_stale_jobs(days_threshold=3)

    elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()
    print("=" * 65)
    print(f"  🏁 RASTREO COMPLETADO EN {elapsed:.2f} SEGUNDOS")
    print("=" * 65)

if __name__ == "__main__":
    main()
