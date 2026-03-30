-- Normaliza el esquema de ventas para que coincida con el frontend actual.
-- Esta migración es segura sobre proyectos ya creados con 00001_initial_schema.sql.

ALTER TABLE public.ventas
ADD COLUMN IF NOT EXISTS fecha_clave TEXT,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS descuento_aplicado NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS metodo_pago TEXT,
ADD COLUMN IF NOT EXISTS en_cuenta_corriente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cliente_nombre TEXT,
ADD COLUMN IF NOT EXISTS cliente_telefono TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.venta_items
ADD COLUMN IF NOT EXISTS owner_user_id UUID,
ADD COLUMN IF NOT EXISTS local_venta_id BIGINT,
ADD COLUMN IF NOT EXISTS local_producto_id BIGINT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_ventas_fecha_clave ON public.ventas(fecha_clave);
CREATE INDEX IF NOT EXISTS idx_venta_items_owner ON public.venta_items(owner_user_id);

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios solo pueden ver sus propias ventas" ON public.ventas;
DROP POLICY IF EXISTS "Usuarios solo pueden insertar sus propias ventas" ON public.ventas;
DROP POLICY IF EXISTS "Usuarios solo pueden actualizar sus propias ventas" ON public.ventas;
DROP POLICY IF EXISTS "Usuarios solo pueden borrar sus propias ventas" ON public.ventas;
DROP POLICY IF EXISTS "Dueño de venta puede insertar items" ON public.venta_items;
DROP POLICY IF EXISTS "Dueño de venta puede leer items" ON public.venta_items;
DROP POLICY IF EXISTS "Dueño de venta puede actualizar items" ON public.venta_items;
DROP POLICY IF EXISTS "Dueño de venta puede borrar items" ON public.venta_items;

CREATE POLICY "Users can manage their own ventas"
ON public.ventas FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can manage their own venta items"
ON public.venta_items FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);
