import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Cliente } from '../../modules/clientes/models/cliente.model';
import { Proyecto } from '../../modules/proyectos/models/proyecto.model';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  // ==================== EXPORTACIÓN DE CLIENTES ====================

  /**
   * Exportar clientes a PDF
   */
  exportarPDF(clientes: Cliente[], titulo: string = 'Listado de Clientes'): void {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.setTextColor(255, 87, 34);
    doc.text(titulo, 14, 15);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    const fecha = new Date().toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generado: ${fecha}`, 14, 22);
    doc.text(`Total de clientes: ${clientes.length}`, 14, 27);

    const headers = [[
      '#',
      'Nombre',
      'Tipo',
      'Documento',
      'Email',
      'Teléfono',
      'Ubicación',
      'Estado',
      'Fecha Alta'
    ]];

    const data = clientes.map((cliente, index) => [
      (index + 1).toString(),
      this.obtenerNombreCompleto(cliente),
      this.getTipoClienteCorto(cliente.tipoCliente),
      this.obtenerDocumento(cliente),
      cliente.email || '-',
      cliente.telefono || '-',
      this.obtenerUbicacion(cliente),
      this.getEstadoTexto(cliente.idEstadoCliente),
      this.formatearFecha(cliente.fechaAlta)
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 32,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [255, 87, 34],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { halign: 'center', cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 45 },
        5: { cellWidth: 25 },
        6: { cellWidth: 40 },
        7: { halign: 'center', cellWidth: 20 },
        8: { halign: 'center', cellWidth: 22 }
      }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const nombreArchivo = `clientes_${this.getFechaParaArchivo()}.pdf`;
    doc.save(nombreArchivo);
  }

  /**
   * Exportar clientes a Excel
   */
  exportarExcel(clientes: Cliente[], nombreHoja: string = 'Clientes'): void {
    const datosExcel = clientes.map((cliente, index) => ({
      '#': index + 1,
      'Nombre Completo': this.obtenerNombreCompleto(cliente),
      'Tipo Cliente': cliente.tipoCliente || '-',
      'Tipo Documento': cliente.tipoDocumento || '-',
      'Nro. Documento': this.obtenerDocumento(cliente),
      'Email': cliente.email || '-',
      'Teléfono': cliente.telefono || '-',
      'Dirección': cliente.direccion || '-',
      'Ciudad': cliente.nombreCiudad || '-',
      'Provincia': cliente.nombreProvincia || '-',
      'Código Postal': cliente.codigoPostal || '-',
      'Estado': this.getEstadoTexto(cliente.idEstadoCliente),
      'Fecha Alta': this.formatearFecha(cliente.fechaAlta),
      'Observaciones': cliente.observaciones || '-'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook: XLSX.WorkBook = {
      Sheets: { [nombreHoja]: worksheet },
      SheetNames: [nombreHoja]
    };

    const columnWidths = [
      { wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 30 }, { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 20 },
      { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 40 }
    ];
    worksheet['!cols'] = columnWidths;

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const data: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const nombreArchivo = `clientes_${this.getFechaParaArchivo()}.xlsx`;
    saveAs(data, nombreArchivo);
  }

  /**
   * Exportar clientes a CSV
   */
  exportarCSV(clientes: Cliente[]): void {
    const headers = [
      'Nombre Completo', 'Tipo Cliente', 'Documento', 'Email', 'Teléfono',
      'Dirección', 'Ciudad', 'Provincia', 'Estado', 'Fecha Alta'
    ];
    
    const rows = clientes.map(cliente => [
      this.obtenerNombreCompleto(cliente),
      cliente.tipoCliente || '-',
      this.obtenerDocumento(cliente),
      cliente.email || '-',
      cliente.telefono || '-',
      cliente.direccion || '-',
      cliente.nombreCiudad || '-',
      cliente.nombreProvincia || '-',
      this.getEstadoTexto(cliente.idEstadoCliente),
      this.formatearFecha(cliente.fechaAlta)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const nombreArchivo = `clientes_${this.getFechaParaArchivo()}.csv`;
    saveAs(blob, nombreArchivo);
  }

  // ==================== EXPORTACIÓN DE PROYECTOS ====================

  /**
   * Exportar proyectos a PDF
   */
  exportarProyectosPDF(proyectos: Proyecto[], titulo: string = 'Listado de Proyectos'): void {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.setTextColor(255, 87, 34);
    doc.text(titulo, 14, 15);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    const fecha = new Date().toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generado: ${fecha}`, 14, 22);
    doc.text(`Total de proyectos: ${proyectos.length}`, 14, 27);

    const headers = [[
      '#',
      'Código',
      'Nombre',
      'Cliente',
      'Tipo Prenda',
      'Estado',
      'Prioridad',
      'Cantidad',
      'Fecha Inicio',
      'Fecha Fin'
    ]];

    const data = proyectos.map((proyecto, index) => [
      (index + 1).toString(),
      proyecto.codigoProyecto || '-',
      proyecto.nombreProyecto || '-',
      proyecto.clienteNombre || '-',
      proyecto.tipoPrenda || '-',
      proyecto.estado || '-',
      this.formatearPrioridad(proyecto.prioridad),
      proyecto.cantidadTotal?.toString() || '-',
      this.formatearFecha(proyecto.fechaInicio),
      this.formatearFecha(proyecto.fechaFin)
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 32,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [255, 87, 34],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },  // #
        1: { cellWidth: 25 },                     // Código
        2: { cellWidth: 40 },                     // Nombre
        3: { cellWidth: 35 },                     // Cliente
        4: { cellWidth: 25 },                     // Tipo Prenda
        5: { halign: 'center', cellWidth: 25 },   // Estado
        6: { halign: 'center', cellWidth: 20 },   // Prioridad
        7: { halign: 'center', cellWidth: 20 },   // Cantidad
        8: { halign: 'center', cellWidth: 25 },   // Fecha Inicio
        9: { halign: 'center', cellWidth: 25 }    // Fecha Fin
      }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const nombreArchivo = `proyectos_${this.getFechaParaArchivo()}.pdf`;
    doc.save(nombreArchivo);
  }

  /**
   * Exportar proyectos a Excel
   */
  exportarProyectosExcel(proyectos: Proyecto[], nombreHoja: string = 'Proyectos'): void {
    const datosExcel = proyectos.map((proyecto, index) => ({
      '#': index + 1,
      'Código': proyecto.codigoProyecto || '-',
      'Nombre Proyecto': proyecto.nombreProyecto || '-',
      'Cliente': proyecto.clienteNombre || '-',
      'Tipo Prenda': proyecto.tipoPrenda || '-',
      'Estado': proyecto.estado || '-',
      'Prioridad': this.formatearPrioridad(proyecto.prioridad),
      'Cantidad Total': proyecto.cantidadTotal || 0,
      'Cantidad Producida': proyecto.cantidadProducida || 0,
      'Fecha Inicio': this.formatearFecha(proyecto.fechaInicio),
      'Fecha Fin': this.formatearFecha(proyecto.fechaFin),
      'Estación': proyecto.tipoEstacion || '-',
      'Encargado': proyecto.nombreEncargado || '-',
      'Área Actual': proyecto.areaActual || '-',
      'Progreso Gerencia': proyecto.avanceDiseno ? `${proyecto.avanceDiseno}%` : '-',
      'Progreso Diseño': proyecto.avanceCorte ? `${proyecto.avanceCorte}%` : '-',
      'Progreso Calidad': proyecto.avanceConfeccion ? `${proyecto.avanceConfeccion}%` : '-',
      'Progreso Etiquetado': proyecto.avanceCalidadPrenda ? `${proyecto.avanceCalidadPrenda}%` : '-',
      'Progreso Depósito': proyecto.avanceEtiquetadoEmpaquetado ? `${proyecto.avanceEtiquetadoEmpaquetado}%` : '-',
      'Costo Material': proyecto.costoMaterialEstimado || 0,
      'Scrap Total': proyecto.scrapTotal || 0,
      'Scrap %': proyecto.scrapPorcentaje ? `${proyecto.scrapPorcentaje}%` : '-',
      'Descripción': proyecto.descripcion || '-'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook: XLSX.WorkBook = {
      Sheets: { [nombreHoja]: worksheet },
      SheetNames: [nombreHoja]
    };

    const columnWidths = [
      { wch: 5 },   // #
      { wch: 15 },  // Código
      { wch: 30 },  // Nombre Proyecto
      { wch: 25 },  // Cliente
      { wch: 15 },  // Tipo Prenda
      { wch: 15 },  // Estado
      { wch: 12 },  // Prioridad
      { wch: 12 },  // Cantidad Total
      { wch: 15 },  // Cantidad Producida
      { wch: 12 },  // Fecha Inicio
      { wch: 12 },  // Fecha Fin
      { wch: 15 },  // Estación
      { wch: 25 },  // Encargado
      { wch: 20 },  // Área Actual
      { wch: 15 },  // Progreso Gerencia
      { wch: 15 },  // Progreso Diseño
      { wch: 15 },  // Progreso Calidad
      { wch: 15 },  // Progreso Etiquetado
      { wch: 15 },  // Progreso Depósito
      { wch: 15 },  // Costo Material
      { wch: 12 },  // Scrap Total
      { wch: 10 },  // Scrap %
      { wch: 40 }   // Descripción
    ];
    worksheet['!cols'] = columnWidths;

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const data: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const nombreArchivo = `proyectos_${this.getFechaParaArchivo()}.xlsx`;
    saveAs(data, nombreArchivo);
  }

  /**
   * Exportar proyectos a CSV
   */
  exportarProyectosCSV(proyectos: Proyecto[]): void {
    const headers = [
      'Código',
      'Nombre',
      'Cliente',
      'Tipo Prenda',
      'Estado',
      'Prioridad',
      'Cantidad',
      'Fecha Inicio',
      'Fecha Fin',
      'Encargado'
    ];
    
    const rows = proyectos.map(proyecto => [
      proyecto.codigoProyecto || '-',
      proyecto.nombreProyecto || '-',
      proyecto.clienteNombre || '-',
      proyecto.tipoPrenda || '-',
      proyecto.estado || '-',
      this.formatearPrioridad(proyecto.prioridad),
      proyecto.cantidadTotal?.toString() || '-',
      this.formatearFecha(proyecto.fechaInicio),
      this.formatearFecha(proyecto.fechaFin),
      proyecto.nombreEncargado || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const nombreArchivo = `proyectos_${this.getFechaParaArchivo()}.csv`;
    saveAs(blob, nombreArchivo);
  }

  // ==================== MÉTODOS AUXILIARES - CLIENTES ====================

  private obtenerNombreCompleto(cliente: Cliente): string {
    return cliente.nombreCompleto || 
           `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || 
           cliente.razonSocial || 
           'Sin nombre';
  }

  private obtenerDocumento(cliente: Cliente): string {
    if (cliente.numeroDocumento) {
      return cliente.numeroDocumento;
    }
    return cliente.cuitCuil || '-';
  }

  private obtenerUbicacion(cliente: Cliente): string {
    const ciudad = cliente.nombreCiudad;
    const provincia = cliente.nombreProvincia;
    
    if (!ciudad && !provincia) return '-';
    
    const partes: string[] = [];
    if (ciudad) partes.push(ciudad);
    if (provincia) partes.push(provincia);
    
    return partes.join(', ');
  }

  private getTipoClienteCorto(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'Persona Física': 'P.F.',
      'Persona Jurídica': 'P.J.',
      'Mayorista': 'May.',
      'Minorista': 'Min.'
    };
    return tipos[tipo] || tipo;
  }

  private getEstadoTexto(estadoId?: number): string {
    const estados: { [key: number]: string } = {
      1: 'Activo',
      2: 'Inactivo',
      3: 'Suspendido',
      4: 'En revisión'
    };
    return estados[estadoId || 1] || 'Desconocido';
  }

  // ==================== MÉTODOS AUXILIARES - PROYECTOS ====================

  private formatearPrioridad(prioridad?: string | null): string {
    if (!prioridad) return '-';
    const prioridades: { [key: string]: string } = {
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja'
    };
    return prioridades[prioridad.toLowerCase()] || prioridad;
  }

  // ==================== MÉTODOS AUXILIARES - COMUNES ====================

  private formatearFecha(fecha: Date | string | undefined | null): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private getFechaParaArchivo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}`;
  }
}