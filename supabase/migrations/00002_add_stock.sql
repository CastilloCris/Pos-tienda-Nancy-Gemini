-- ==========================================
-- MIGRACION: Añadir validación de Stock
-- Ejecutar en SQL Editor de Supabase
-- ==========================================

-- Agregar columnas `stock` y `stock_minimo` a la tabla `productos`
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS stock NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_minimo NUMERIC DEFAULT 3;

-- Asegurar que el stock no pueda ser nulo (ya tiene default, pero forzamos el constraint)
ALTER TABLE public.productos 
ALTER COLUMN stock SET NOT NULL;

ALTER TABLE public.productos 
ALTER COLUMN stock_minimo SET NOT NULL;
