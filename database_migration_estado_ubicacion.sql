-- =============================================
-- Migración: Agregar EstadoUbicacion a tabla Ubicacion
-- Estados válidos: 'Activa' | 'Ocupado' | 'BloqIN' | 'BloqOUT'
-- Fecha: 2026-05-13
-- =============================================

ALTER TABLE "Ubicacion"
ADD COLUMN IF NOT EXISTS "EstadoUbicacion" VARCHAR(10) NOT NULL DEFAULT 'Activa';

-- Verificar que todas las ubicaciones existentes queden en estado Activa
UPDATE "Ubicacion" SET "EstadoUbicacion" = 'Activa' WHERE "EstadoUbicacion" IS NULL OR "EstadoUbicacion" = '';
