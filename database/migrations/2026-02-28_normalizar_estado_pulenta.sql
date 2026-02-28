-- Normaliza estados legacy cargados como "pulenta" al estado valido "Disponible".
UPDATE Insumo
SET estado = 'Disponible'
WHERE LOWER(LTRIM(RTRIM(estado))) = 'pulenta';
