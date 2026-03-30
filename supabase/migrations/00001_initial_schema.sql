-- ==========================================
-- EXTENSIONES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLA: productos
-- ==========================================
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_id BIGINT,
    owner_user_id UUID NOT NULL,
    codigo TEXT,
    nombre TEXT NOT NULL,
    precio NUMERIC NOT NULL,
    categoria TEXT,
    talles TEXT,
    foto TEXT,
    detalles TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_user_id, codigo) -- Para upserts 
);

CREATE INDEX IF NOT EXISTS idx_productos_codigo ON public.productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_owner ON public.productos(owner_user_id);

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own products"
ON public.productos FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);


-- ==========================================
-- TABLA: clientes
-- ==========================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_id BIGINT,
    owner_user_id UUID NOT NULL,
    nombre TEXT NOT NULL,
    telefono TEXT,
    dni TEXT,
    deuda NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON public.clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_owner ON public.clientes(owner_user_id);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own clients"
ON public.clientes FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);


-- ==========================================
-- TABLA: cajas 
-- ==========================================
CREATE TABLE IF NOT EXISTS public.cajas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_id BIGINT,
    owner_user_id UUID NOT NULL,
    fecha_clave TEXT NOT NULL,
    abierta BOOLEAN DEFAULT TRUE,
    cerrada BOOLEAN DEFAULT FALSE,
    fecha_apertura TIMESTAMP WITH TIME ZONE,
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    monto_apertura NUMERIC,
    monto_cierre_real NUMERIC,
    diferencia_cierre NUMERIC,
    efectivo_esperado NUMERIC,
    ventas_efectivo NUMERIC,
    ventas_otros_medios NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_user_id, fecha_clave)
);

CREATE INDEX IF NOT EXISTS idx_cajas_fecha_clave ON public.cajas(fecha_clave);
CREATE INDEX IF NOT EXISTS idx_cajas_owner ON public.cajas(owner_user_id);

ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cajas"
ON public.cajas FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);


-- ==========================================
-- TABLA: ventas
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_id BIGINT,
    owner_user_id UUID NOT NULL,
    caja_id UUID REFERENCES public.cajas(id) ON DELETE SET NULL,
    local_caja_id BIGINT,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    local_cliente_id BIGINT,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_clave TEXT,
    subtotal NUMERIC NOT NULL,
    descuento_aplicado NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    metodo_pago TEXT,
    en_cuenta_corriente BOOLEAN DEFAULT FALSE,
    cliente_nombre TEXT,
    cliente_telefono TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_owner ON public.ventas(owner_user_id);

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ventas"
ON public.ventas FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);


-- ==========================================
-- TABLA: venta_items
-- ==========================================
CREATE TABLE IF NOT EXISTS public.venta_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL,
    venta_id UUID REFERENCES public.ventas(id) ON DELETE CASCADE,
    local_venta_id BIGINT,
    producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    local_producto_id BIGINT,
    codigo TEXT,
    nombre TEXT,
    categoria TEXT,
    precio NUMERIC NOT NULL,
    cantidad NUMERIC DEFAULT 1,
    talle TEXT,
    foto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venta_items_owner ON public.venta_items(owner_user_id);

ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own venta items"
ON public.venta_items FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);
