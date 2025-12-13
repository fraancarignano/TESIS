import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Cliente } from '../../modules/clientes/models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Exportar a PDF con todos los datos del cliente
   */
  exportarPDF(clientes: Cliente[], titulo: string = 'Listado de Clientes'): void {
    const doc = new jsPDF('landscape'); // Landscape para más columnas
    
    // Configurar título
    doc.setFontSize(18);
    doc.setTextColor(255, 87, 34);
    doc.text(titulo, 14, 15);
    
    // Fecha de generación
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

    // Preparar headers
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

    // Preparar datos
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

    // Generar tabla
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
        1: { cellWidth: 40 },                     // Nombre
        2: { halign: 'center', cellWidth: 20 },   // Tipo
        3: { cellWidth: 25 },                     // Documento
        4: { cellWidth: 45 },                     // Email
        5: { cellWidth: 25 },                     // Teléfono
        6: { cellWidth: 40 },                     // Ubicación
        7: { halign: 'center', cellWidth: 20 },   // Estado
        8: { halign: 'center', cellWidth: 22 }    // Fecha Alta
      }
    });

    // Número de página
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

    // Descargar
    const nombreArchivo = `clientes_${this.getFechaParaArchivo()}.pdf`;
    doc.save(nombreArchivo);
  }

  /**
   * Exportar a Excel con formato completo
   */
  exportarExcel(clientes: Cliente[], nombreHoja: string = 'Clientes'): void {
    // Preparar datos completos
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

    // Crear worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook: XLSX.WorkBook = {
      Sheets: { [nombreHoja]: worksheet },
      SheetNames: [nombreHoja]
    };

    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 5 },   // #
      { wch: 30 },  // Nombre Completo
      { wch: 20 },  // Tipo Cliente
      { wch: 15 },  // Tipo Documento
      { wch: 15 },  // Nro. Documento
      { wch: 30 },  // Email
      { wch: 15 },  // Teléfono
      { wch: 35 },  // Dirección
      { wch: 20 },  // Ciudad
      { wch: 20 },  // Provincia
      { wch: 12 },  // Código Postal
      { wch: 15 },  // Estado
      { wch: 12 },  // Fecha Alta
      { wch: 40 }   // Observaciones
    ];
    worksheet['!cols'] = columnWidths;

    // Generar archivo
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
   * Exportar a CSV
   */
  exportarCSV(clientes: Cliente[]): void {
    const headers = [
      'Nombre Completo',
      'Tipo Cliente',
      'Documento',
      'Email',
      'Teléfono',
      'Dirección',
      'Ciudad',
      'Provincia',
      'Estado',
      'Fecha Alta'
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

  // === MÉTODOS AUXILIARES ===

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

  private formatearFecha(fecha: Date | string | undefined): string {
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