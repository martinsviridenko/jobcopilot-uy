-- ============================================================================
-- JOBCOPILOT AI — ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL v2)
-- Arquitectura Multi-Fuente, Detección de Dominio y Soporte Multi-País
-- ============================================================================

-- 1. Crear tabla principal de empleos con atributos semánticos
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash_dedup TEXT UNIQUE NOT NULL, -- Fingerprint único: SHA-256(company + title + country)
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'UY',
    hours TEXT NOT NULL CHECK (hours IN ('4h', '6h', '8h')),
    hours_label TEXT NOT NULL,
    is_hours_estimated BOOLEAN DEFAULT FALSE,
    modality TEXT NOT NULL,
    modality_key TEXT NOT NULL CHECK (modality_key IN ('hybrid', 'remote', 'presential')),
    sector TEXT NOT NULL,
    sector_label TEXT NOT NULL,
    domain TEXT DEFAULT 'BUSINESS_ADMIN',
    domain_label TEXT DEFAULT 'Negocios & Administración',
    seniority TEXT DEFAULT 'Junior',
    contract_type TEXT DEFAULT 'indefinido',
    location TEXT NOT NULL DEFAULT 'Montevideo',
    description TEXT NOT NULL,
    career_fit TEXT[] DEFAULT '{}',
    critical_skills TEXT[] DEFAULT '{}',
    requirements JSONB DEFAULT '{"mandatory":[], "desirable":[], "bonus":[]}',
    salary_guide TEXT,
    apply_url TEXT NOT NULL,
    canonical_source TEXT DEFAULT 'web',
    alternative_urls JSONB DEFAULT '[]',
    raw_source_data JSONB DEFAULT '{}',
    is_linkedin BOOLEAN DEFAULT FALSE,
    is_talent_pool BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    source_platform TEXT NOT NULL DEFAULT 'web',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Migración idempotente para tablas existentes (si ya fue creada antes)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='country') THEN
        ALTER TABLE public.jobs ADD COLUMN country TEXT NOT NULL DEFAULT 'UY';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='domain') THEN
        ALTER TABLE public.jobs ADD COLUMN domain TEXT DEFAULT 'BUSINESS_ADMIN';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='domain_label') THEN
        ALTER TABLE public.jobs ADD COLUMN domain_label TEXT DEFAULT 'Negocios & Administración';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='critical_skills') THEN
        ALTER TABLE public.jobs ADD COLUMN critical_skills TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='seniority') THEN
        ALTER TABLE public.jobs ADD COLUMN seniority TEXT DEFAULT 'Junior';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='contract_type') THEN
        ALTER TABLE public.jobs ADD COLUMN contract_type TEXT DEFAULT 'indefinido';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='is_hours_estimated') THEN
        ALTER TABLE public.jobs ADD COLUMN is_hours_estimated BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='closed_at') THEN
        ALTER TABLE public.jobs ADD COLUMN closed_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='alternative_urls') THEN
        ALTER TABLE public.jobs ADD COLUMN alternative_urls JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='raw_source_data') THEN
        ALTER TABLE public.jobs ADD COLUMN raw_source_data JSONB DEFAULT '{}';
    END IF;
END $$;

-- 3. Índices para acelerar búsquedas y filtros
CREATE INDEX IF NOT EXISTS idx_jobs_active_country ON public.jobs (country, is_active, hours);
CREATE INDEX IF NOT EXISTS idx_jobs_domain ON public.jobs (domain);
CREATE INDEX IF NOT EXISTS idx_jobs_hash ON public.jobs (hash_dedup);
CREATE INDEX IF NOT EXISTS idx_jobs_last_seen ON public.jobs (last_seen_at);

-- 4. Configurar Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de vacantes activas" ON public.jobs;
CREATE POLICY "Lectura pública de vacantes activas"
ON public.jobs
FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Permiso de escritura solo para el servicio de ingesta" ON public.jobs;
CREATE POLICY "Permiso de escritura solo para el servicio de ingesta"
ON public.jobs
FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);
