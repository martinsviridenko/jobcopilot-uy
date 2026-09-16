-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear la tabla de perfiles
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_text TEXT NOT NULL,
  profile_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Habilitar Seguridad de Nivel de Fila (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas para que los usuarios solo puedan ver/editar su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil" 
ON user_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar/actualizar su propio perfil" 
ON user_profiles FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
