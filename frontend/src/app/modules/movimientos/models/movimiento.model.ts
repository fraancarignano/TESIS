export interface Movimiento {
    idMovimiento: number;
    idInsumo?: number;
    nombreInsumo?: string;
    tipoMovimiento: string;
    cantidad: number;
    unidadesDetalle: string;
    fechaMovimiento: string;
    usuario?: string;
    origen: string;
    destino?: string;
    observacion?: string;
}

export interface MovimientoSearch {
    fechaDesde?: string;
    fechaHasta?: string;
    terminoBusqueda?: string;
}
