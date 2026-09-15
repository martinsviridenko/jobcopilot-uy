-- ============================================================================
-- JOBCOPILOT AI URUGUAY — ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- ============================================================================

-- 1. Crear tabla principal de empleos
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash_dedup TEXT UNIQUE NOT NULL, -- Clave única para evitar duplicados: SHA-256(company + title + hours)
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    hours TEXT NOT NULL CHECK (hours IN ('4h', '6h', '8h')),
    hours_label TEXT NOT NULL,
    modality TEXT NOT NULL,
    modality_key TEXT NOT NULL CHECK (modality_key IN ('hybrid', 'remote', 'presential')),
    sector TEXT NOT NULL,
    sector_label TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Montevideo',
    description TEXT NOT NULL,
    career_fit TEXT[] DEFAULT '{}',
    requirements JSONB DEFAULT '{"mandatory":[], "desirable":[], "bonus":[]}',
    salary_guide TEXT,
    apply_url TEXT NOT NULL,
    is_linkedin BOOLEAN DEFAULT FALSE,
    is_talent_pool BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    source_platform TEXT NOT NULL DEFAULT 'web',
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para acelerar búsquedas y filtros
CREATE INDEX IF NOT EXISTS idx_jobs_active ON public.jobs (is_active, hours);
CREATE INDEX IF NOT EXISTS idx_jobs_sector ON public.jobs (sector);
CREATE INDEX IF NOT EXISTS idx_jobs_hash ON public.jobs (hash_dedup);

-- 3. Configurar Row Level Security (RLS)
-- Cualquier visitante puede LEER las vacantes activas de forma segura
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de vacantes activas" ON public.jobs;
CREATE POLICY "Lectura pública de vacantes activas"
ON public.jobs
FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);

-- Solo el script del backend/GitHub Actions (usando la Service Role Key) puede insertar o modificar
DROP POLICY IF EXISTS "Permiso de escritura solo para el servicio de ingesta" ON public.jobs;
CREATE POLICY "Permiso de escritura solo para el servicio de ingesta"
ON public.jobs
FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- ============================================================================
-- 4. SEED DATA: Carga inicial de las 18 vacantes verificadas
-- ============================================================================
INSERT INTO public.jobs (
    hash_dedup, company, title, hours, hours_label, modality, modality_key,
    sector, sector_label, location, description, career_fit, requirements,
    salary_guide, apply_url, is_linkedin, is_talent_pool, is_active, source_platform
) VALUES
(
    'grant_thornton_pasante_ciberseguridad_4h',
    'Grant Thornton Uruguay',
    'Pasante en Ciberseguridad & Auditoría de Sistemas',
    '4h',
    '4 horas diarias (Lunes a Viernes)',
    'Híbrido / Presencial',
    'hybrid',
    'consulting',
    'Consultoría & Auditoría IT',
    'Montevideo',
    'Pasantía de 3 meses en la firma internacional Grant Thornton. Carga horaria de 4 horas diarias de lunes a viernes. Relevamiento de procesos tecnológicos, controles de seguridad y soporte analítico.',
    ARRAY['Negocios Digitales', 'Sistemas', 'Ingeniería', 'Administración'],
    '{"mandatory":["Segundo año universitario aprobado", "Disponibilidad 4 horas diarias"], "desirable":["Interés en ciberseguridad y auditoría", "Manejo de herramientas analíticas"], "bonus":["Conocimientos de bases de datos", "Inglés intermedio"]}',
    '$22.000 - $28.000 UYU (Pasantía 4h)',
    'https://uy.linkedin.com/jobs/view/pasante-en-ciberseguridad-at-grant-thornton-uruguay-4464220434',
    TRUE, FALSE, TRUE, 'linkedin'
),
(
    'prota_administrativa_parttime_4h',
    'Prota (Consultora RRHH)',
    'Administrativa Jr Part-Time (4 a 6 horas)',
    '4h',
    '4 a 6 horas (A convenir de 9 a 18 hs)',
    'Presencial (Centro)',
    'presential',
    'consulting',
    'Administración & Soporte',
    'Montevideo Centro',
    'Puesto Part-Time de 4 a 6 horas diarias de lunes a viernes coordinables. Contrato a término por 1 año con opción a renovación. Tareas: facturación, planillas de cálculo y archivo.',
    ARRAY['Administración', 'Ciencias Económicas', 'Negocios Digitales'],
    '{"mandatory":["Estudiante universitario de Administración o carreras afines", "Manejo de Excel"], "desirable":["Inglés intermedio", "Experiencia previa administrativa"], "bonus":["Manejo de ERP o herramientas contables"]}',
    '$24.000 - $32.000 UYU (según horas acordadas)',
    'https://uy.linkedin.com/jobs/view/administrativa-part-time-at-prota-4465221749',
    TRUE, FALSE, TRUE, 'linkedin'
),
(
    'bestseller_student_worker_4h',
    'BESTSELLER (Multinacional Retail)',
    'Student Worker (Comercial & Base de Datos)',
    '4h',
    'Part-Time / Horario Estudiante',
    'Híbrido',
    'hybrid',
    'retail',
    'Retail & Moda Global',
    'Montevideo',
    'Vacante Part-Time en BESTSELLER (Jack & Jones, Only, Vero Moda). Soporte al área comercial en actualización de bases de datos, generación de reportes y carga de órdenes.',
    ARRAY['Negocios Digitales', 'Administración', 'Economía', 'Ingeniería'],
    '{"mandatory":["Estudiante de 1er o 2do año universitario", "Dominio de Excel"], "desirable":["Inglés intermedio (compañía internacional)", "Habilidades de reporte"], "bonus":["Conocimiento de retail o e-commerce"]}',
    '$26.000 - $32.000 UYU (Régimen estudiante)',
    'https://uy.linkedin.com/jobs/view/student-worker-contrato-a-t%C3%A9rmino-at-bestseller-4462451747',
    TRUE, FALSE, TRUE, 'linkedin'
),
(
    'ort_portal_empleo_pasantias_4h',
    'Universidad ORT Uruguay',
    'Bolsa de Empleo & Pasantías Exclusivas para Alumnos ORT',
    '4h',
    '4 a 6 horas (Convenios Académicos)',
    'Presencial / Híbrido',
    'presential',
    'univ',
    'Bolsa Universitaria',
    'Montevideo',
    'Portal oficial de convenios de pasantía académica de ORT Uruguay. Acceso exclusivo a ofertas part-time de empresas socias que coordinan horarios con la facultad.',
    ARRAY['Negocios Digitales', 'Sistemas', 'Administración', 'Analítica'],
    '{"mandatory":["Ser estudiante activo o graduado de Universidad ORT Uruguay"], "desirable":["Escolaridad destacada"], "bonus":["Nivel B2 de inglés"]}',
    'Regulado por convenios universitarios de pasantía',
    'https://empleo.ort.edu.uy/',
    FALSE, TRUE, TRUE, 'ort'
),
(
    'pento_ai_developer_trainee_6h',
    'Pento (AI & Software)',
    'AI Developer Trainee — 6 horas diarias',
    '6h',
    '6 horas diarias (Modalidad Híbrida)',
    'Híbrido',
    'hybrid',
    'tech',
    'Tecnología & IA',
    'Montevideo',
    'Programa formativo Trainee de 6 horas diarias en empresa enfocada en soluciones de inteligencia artificial. Aprendizaje práctico en modelos, desarrollo y analítica de datos.',
    ARRAY['Negocios Digitales', 'Sistemas', 'Ciencia de Datos', 'Ingeniería'],
    '{"mandatory":["Estudiante universitario activo", "Fundamentos de programación o datos", "Inglés intermedio/avanzado"], "desirable":["Nociones de Python", "Curiosidad por IA generativa"], "bonus":["Proyectos personales o GitHub"]}',
    '$30.000 - $38.000 UYU (Trainee 6h)',
    'https://uy.linkedin.com/jobs/view/ai-developer-trainee-at-pento-4465228447',
    TRUE, FALSE, TRUE, 'linkedin'
),
(
    'quantik_pasante_ti_6h',
    'Quantik Group',
    'Pasante de TI & Soporte de Plataformas — 6 horas',
    '6h',
    '6 horas diarias (Lunes a Viernes)',
    'Híbrido',
    'hybrid',
    'tech',
    'Telecomunicaciones & Software',
    'Montevideo',
    'Pasantía de 6 horas diarias de lunes a viernes en Quantik Group. Atención a usuarios, soporte sobre plataformas digitales y resolución de incidentes operativos.',
    ARRAY['Sistemas', 'Negocios Digitales', 'Tecnología'],
    '{"mandatory":["Estudiante de carreras tecnológicas o afines", "Disponibilidad 6 horas"], "desirable":["Sistemas operativos Windows", "Vocación de servicio"], "bonus":["Redes básicas o scripting"]}',
    '$28.000 - $35.000 UYU',
    'https://uy.linkedin.com/jobs/view/pasante-de-ti-at-quantik-group-4461373330',
    TRUE, FALSE, TRUE, 'linkedin'
),
(
    'pwc_junior_auditoria_externa_6h',
    'PwC Uruguay',
    'Junior — Auditoría Externa (Régimen Part-Time)',
    '6h',
    '6 horas / Part-time formal',
    'Híbrido',
    'hybrid',
    'consulting',
    'Consultoría & Auditoría',
    'Montevideo',
    'Puesto Part-Time formal en PwC Uruguay para estudiantes universitarios con licencias de estudio. Revisión analítica de operaciones, análisis de procesos y control interno.',
    ARRAY['Contabilidad', 'Administración', 'Economía', 'Negocios'],
    '{"mandatory":["Estudiante universitario con al menos 50% de avance académico", "No requiere experiencia previa"], "desirable":["Inglés intermedio", "Manejo fluido de Excel"], "bonus":["Capacidad analítica y trabajo en equipo"]}',
    '$32.000 - $42.000 UYU + Beneficios Big Four',
    'https://uy.linkedin.com/jobs/view/junior-auditor%C3%ADa-externa-contable-at-pwc-uruguay-4465656096',
    TRUE, FALSE, TRUE, 'linkedin'
),
(
    'meli_customer_experience_6h',
    'Mercado Libre Uruguay',
    'Representante de Customer Experience — 6 horas',
    '6h',
    '6 horas diarias (Turno fijo)',
    'Híbrido',
    'hybrid',
    'tech',
    'E-commerce & Fintech',
    'WTC Montevideo',
    'Atención y soporte a usuarios de Mercado Libre y Mercado Pago en WTC Free Zone. Resolución de consultas sobre pagos digitales, cobros y envíos.',
    ARRAY['Negocios Digitales', 'Administración', 'Comunicación'],
    '{"mandatory":["Secundario completo / estudiante universitario", "Disponibilidad 6 horas"], "desirable":["Excelente redacción y empatía", "Manejo de herramientas digitales"], "bonus":["Experiencia en plataformas de e-commerce o atención"]}',
    '$35.000 - $45.000 UYU + Almuerzo y prepaga',
    'https://uy.linkedin.com/jobs/view/representante-de-customer-experience-at-mercado-libre-4454696054',
    TRUE, FALSE, TRUE, 'linkedin'
),
(
    'rua_operador_servicios_6h',
    'RUA Asistencia',
    'Operador de Servicios & Asistencia — 6 horas',
    '6h',
    '6 horas diarias (Horario fijo)',
    'Presencial',
    'presential',
    'retail',
    'Servicios Corporativos',
    'Montevideo',
    'Jornada fija de 6 horas diarias para atención y coordinación de servicios solicitados por socios. Seguimiento de casos en plataformas informáticas.',
    ARRAY['Administración', 'General'],
    '{"mandatory":["Disponibilidad 6 horas diarias", "Manejo básico de Office"], "desirable":["Experiencia en atención telefónica"], "bonus":["Resolución rápida de incidentes"]}',
    '$25.000 - $30.000 UYU',
    'https://uy.linkedin.com/jobs/view/operador-telef%C3%B3nico-call-center-at-rua-asistencia-4466738461',
    TRUE, FALSE, TRUE, 'linkedin'
),
(
    'itau_base_talentos_estudiantes_6h',
    'Banco Itaú Uruguay',
    'Base de Talentos: Postulación Espontánea (Jornada 6h)',
    '6h',
    '6 horas (Jornada bancaria estándar)',
    'Híbrido',
    'hybrid',
    'bank',
    'Banca & Finanzas',
    'Montevideo',
    'Canal oficial para ingresar CV al sistema de Recursos Humanos de Itaú para futuras vacantes de 6 horas en áreas comerciales y operativas.',
    ARRAY['Ciencias Económicas', 'Negocios Digitales', 'Administración'],
    '{"mandatory":["Estudiante universitario activo"], "desirable":["Manejo de Excel y orientación analítica"], "bonus":["Inglés profesional"]}',
    'Escalafón bancario AEBU (6 horas)',
    'https://www.itau.com.uy/inst/trabajaConNosotros.html',
    FALSE, TRUE, TRUE, 'itau'
),
(
    'dlocal_careers_fintech_6h',
    'dLocal (Fintech Global)',
    'Portal de Carreras & Pasantías Fintech Montevideo',
    '6h',
    'Flexible / Estudiantes (6h - 8h)',
    'Híbrido',
    'hybrid',
    'tech',
    'Fintech & Pagos Digitales',
    'Montevideo',
    'Portal oficial del unicornio fintech uruguayo. Oportunidades en operaciones cross-border, conciliaciones bancarias y analítica de datos.',
    ARRAY['Negocios Digitales', 'Economía', 'Sistemas', 'Ingeniería'],
    '{"mandatory":["Inglés avanzado (ambiente multinacional)", "Afinidad cuantitativa"], "desirable":["Manejo de SQL o Power BI"], "bonus":["Conocimiento de medios de pago"]}',
    'Competitivo mercado fintech global',
    'https://www.dlocal.com/careers/',
    FALSE, TRUE, TRUE, 'dlocal'
),
(
    'cash_analista_inteligencia_comercial_8h',
    'CASH (Sector Financiero)',
    'Analista de Inteligencia Comercial — SQL, Power BI, Excel',
    '8h',
    '8 horas (Tiempo Completo)',
    'Presencial (Ciudad Vieja)',
    'presential',
    'bank',
    'Finanzas & Analítica',
    'Montevideo, Ciudad Vieja',
    'Extracción, análisis y modelado de datos para generar insights comerciales y tableros en Power BI/Tableau. Soporte al área de negocios.',
    ARRAY['Ciencia de Datos', 'Negocios Digitales', 'Economía', 'Administración'],
    '{"mandatory":["Estudiantes avanzados de carreras cuantitativas", "Dominio de Excel", "Manejo de SQL"], "desirable":["Power BI, Tableau o Looker", "Uso frecuente de herramientas de IA"], "bonus":["Experiencia en sector financiero"]}',
    '$50.000 - $65.000 UYU (Full-time)',
    'https://uy.linkedin.com/jobs/view/analista-de-inteligencia-comercial-at-cash-4466412215',
    TRUE, FALSE, TRUE, 'linkedin'
),
(
    'farmashop_asistente_people_analytics_8h',
    'Farmashop',
    'Asistente de People Analytics — Dashboards & KPIs',
    '8h',
    '8 horas (Tiempo Completo)',
    'Presencial',
    'presential',
    'retail',
    'Retail & People Analytics',
    'Montevideo',
    'Reportes directivos de gestión humana (rotación, ausentismo, productividad), tableros y automatización en el equipo de RRHH.',
    ARRAY['Ingeniería', 'Análisis de Datos', 'Negocios Digitales'],
    '{"mandatory":["Estudiante de Ingeniería o Análisis de Datos", "Excel avanzado (excluyente)"], "desirable":["Power BI o Tableau", "Python básico para automatizaciones"], "bonus":["Conocimiento de métricas de personal"]}',
    '$45.000 - $55.000 UYU (Full-time)',
    'https://uy.linkedin.com/jobs/view/asistente-de-people-analytics-at-farmashop-4464229669',
    TRUE, FALSE, TRUE, 'linkedin'
),
(
    'cpa_ferrere_procesos_negocios_8h',
    'CPA Ferrere',
    'Analista de Proceso y Negocios (Banca y Tecnología)',
    '8h',
    '8 horas (Tiempo Completo - 9 a 18 hs)',
    'Híbrido',
    'hybrid',
    'consulting',
    'Consultoría & Procesos',
    'Montevideo',
    'Relevamiento y rediseño de procesos operativos para clientes del sistema bancario nacional e internacional en CPA Ferrere (ID 662164).',
    ARRAY['Administración', 'Economía', 'Negocios Digitales', 'Ingeniería'],
    '{"mandatory":["Estudiante avanzado o graduado universitario", "Disponibilidad 9 a 18 hs"], "desirable":["Metodologías de procesos (BPM)", "Excel avanzado"], "bonus":["Experiencia bancaria previa"]}',
    '$50.000 - $65.000 UYU (Full-time)',
    'https://talento.cpaferrere.com/jobs/662164-analista-de-proceso-y-negocios-banca-y-tecnologia',
    FALSE, FALSE, TRUE, 'cpa_teamtailor'
),
(
    'cpa_ferrere_analista_jr_banca_tech_8h',
    'CPA Ferrere',
    'Analista Junior en Banca y Tecnología',
    '8h',
    '8 horas (Tiempo Completo)',
    'Híbrido',
    'hybrid',
    'consulting',
    'Consultoría & Banca',
    'Montevideo',
    'Relevamiento de requerimientos con clientes bancarios, testing funcional y apoyo en transformación tecnológica en CPA Ferrere (ID 696910).',
    ARRAY['Administración', 'Contabilidad', 'Negocios Digitales'],
    '{"mandatory":["Estudiante avanzado de Ciencias Económicas", "Inglés intermedio/avanzado"], "desirable":["Testing funcional o software bancario"], "bonus":["Excel avanzado"]}',
    '$45.000 - $60.000 UYU (Full-time)',
    'https://talento.cpaferrere.com/jobs/696910-analista-junior-en-banca-y-tecnologia',
    FALSE, FALSE, TRUE, 'cpa_teamtailor'
),
(
    'nexit_analista_funcional_jr_8h',
    'Nexit (vía BuscoJobs)',
    'Analista Funcional Jr (ERP & Consultoría)',
    '8h',
    '8 horas (Tiempo Completo: 9 a 18 hs)',
    'Presencial / Híbrido',
    'presential',
    'consulting',
    'Consultoría & ERP',
    'Montevideo',
    'Relevamiento de necesidades del cliente corporativo, parametrización y soporte sobre módulos de software de gestión ERP (ID 274020).',
    ARRAY['Administración', 'Negocios Digitales', 'Contabilidad'],
    '{"mandatory":["Disponibilidad 9 a 18 hs", "Formación en administración o negocios"], "desirable":["Nociones de sistemas ERP", "Excel analítico"], "bonus":["Capacidad pedagógica con usuarios"]}',
    '$40.000 - $52.000 UYU (Full-time)',
    'https://www.buscojobs.com.uy/analista-funcional-jr-contador-lic-en-administracion-en-montevideo-ID-274020',
    FALSE, FALSE, TRUE, 'buscojobs'
),
(
    'urudata_ejecutivo_comercial_jr_8h',
    'Urudata (vía BuscoJobs)',
    'Ejecutivo Comercial Junior / Business Tech',
    '8h',
    '8 horas (Tiempo Completo: 9 a 18 hs)',
    'Presencial / Híbrido',
    'presential',
    'tech',
    'Tecnología Corporativa',
    'Montevideo',
    'Gestión de cartera de clientes corporativos B2B y elaboración de propuestas de servicios de infraestructura IT (ID 276252).',
    ARRAY['Negocios Digitales', 'Administración', 'Marketing'],
    '{"mandatory":["Perfil comercial B2B", "Disponibilidad 9 a 18 hs"], "desirable":["Conocimiento de servicios cloud e IT"], "bonus":["Habilidades de negociación"]}',
    '$42.000 - $55.000 UYU + Comisiones comerciales',
    'https://www.buscojobs.com.uy/ejecutivo-comercial-junior-en-montevideo-ID-276252',
    FALSE, FALSE, TRUE, 'buscojobs'
),
(
    'advice_digital_media_finance_8h',
    'Advice Recursos Humanos',
    'Digital Media Finance Analyst',
    '8h',
    '8 horas (Tiempo Completo)',
    'Híbrido',
    'hybrid',
    'consulting',
    'Consultora & Selección',
    'Montevideo',
    'Conciliaciones financieras de plataformas de medios digitales (Meta Ads, Google), reportes analíticos de inversión y control de gestión.',
    ARRAY['Negocios Digitales', 'Economía', 'Administración'],
    '{"mandatory":["Excel avanzado", "Inglés profesional fluido (excluyente)"], "desirable":["Manejo de Meta Ads o Google Ads", "Experiencia en finanzas"], "bonus":["Power BI o Tableau"]}',
    '$55.000 - $70.000 UYU (Full-time)',
    'https://advice.zohorecruit.com/jobs/Careers/731279000017056074',
    FALSE, FALSE, TRUE, 'advice'
)
ON CONFLICT (hash_dedup) DO UPDATE SET
    last_seen_at = NOW(),
    is_active = TRUE;
