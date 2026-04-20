import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Cliente } from '../../modules/clientes/models/cliente.model';
import { Proyecto } from '../../modules/proyectos/models/proyecto.model';
import { Proveedor } from '../../modules/proveedores/models/proveedor.model';

export interface PlanillaConfeccionExport {
  titulo?: string;
  fechaGeneracion?: Date;
  proyecto: {
    codigo?: string;
    nombre?: string;
    cliente?: string;
    pedidoTotal?: number;
    prendas?: string[];
    colores?: string[];
    telas?: string[];
  };
  taller: {
    nombre?: string;
    responsable?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
  };
  fechas: {
    inicio?: string;
    limite?: string;
  };
  corteDistribucion: { talle: string; cantidad: number }[];
  diseno: {
    nombrePrenda: string;
    materialBase: string;
    cantidadTotal: number;
    descripcionDiseno?: string;
    tieneBordado: boolean;
    tieneEstampado: boolean;
    imagenMockup?: string;
    descripcionMockup?: string;
    imagenBordado?: string;
    descripcionBordado?: string;
    imagenEstampado?: string;
    descripcionEstampado?: string;
  }[];
  instrucciones?: string;
  observaciones?: string;
}

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

  // ==================== EXPORTACION DE PROVEEDORES ====================

  /**
   * Exportar proveedores a PDF
   */
  exportarProveedoresPDF(proveedores: Proveedor[], titulo: string = 'Listado de Proveedores'): void {
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
    doc.text(`Total de proveedores: ${proveedores.length}`, 14, 27);

    const headers = [[
      '#',
      'Razon Social',
      'CUIT',
      'Telefono',
      'Email',
      'Direccion',
      'Ubicacion',
      'Fecha Alta'
    ]];

    const data = proveedores.map((proveedor, index) => [
      (index + 1).toString(),
      proveedor.nombreProveedor || '-',
      proveedor.cuit || '-',
      proveedor.telefono || '-',
      proveedor.email || '-',
      proveedor.direccion || '-',
      this.obtenerUbicacionProveedor(proveedor),
      this.formatearFecha(proveedor.fechaAlta)
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
        1: { cellWidth: 45 },
        2: { cellWidth: 28 },
        3: { cellWidth: 25 },
        4: { cellWidth: 45 },
        5: { cellWidth: 45 },
        6: { cellWidth: 40 },
        7: { halign: 'center', cellWidth: 22 }
      }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Pagina ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const nombreArchivo = `proveedores_${this.getFechaParaArchivo()}.pdf`;
    doc.save(nombreArchivo);
  }

  /**
   * Exportar proveedores a Excel
   */
  exportarProveedoresExcel(proveedores: Proveedor[], nombreHoja: string = 'Proveedores'): void {
    const datosExcel = proveedores.map((proveedor, index) => ({
      '#': index + 1,
      'Razon Social': proveedor.nombreProveedor || '-',
      'CUIT': proveedor.cuit || '-',
      'Telefono': proveedor.telefono || '-',
      'Email': proveedor.email || '-',
      'Direccion': proveedor.direccion || '-',
      'Ciudad': proveedor.nombreCiudad || '-',
      'Provincia': proveedor.nombreProvincia || '-',
      'Fecha Alta': this.formatearFecha(proveedor.fechaAlta),
      'Observaciones': proveedor.observaciones || '-'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook: XLSX.WorkBook = {
      Sheets: { [nombreHoja]: worksheet },
      SheetNames: [nombreHoja]
    };

    const columnWidths = [
      { wch: 5 }, { wch: 35 }, { wch: 18 }, { wch: 20 }, { wch: 30 },
      { wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 45 }
    ];
    worksheet['!cols'] = columnWidths;

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const data: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const nombreArchivo = `proveedores_${this.getFechaParaArchivo()}.xlsx`;
    saveAs(data, nombreArchivo);
  }

  /**
   * Exportar proveedores a CSV
   */
  exportarProveedoresCSV(proveedores: Proveedor[]): void {
    const headers = [
      'Razon Social',
      'CUIT',
      'Telefono',
      'Email',
      'Direccion',
      'Ciudad',
      'Provincia',
      'Fecha Alta'
    ];

    const rows = proveedores.map(proveedor => [
      proveedor.nombreProveedor || '-',
      proveedor.cuit || '-',
      proveedor.telefono || '-',
      proveedor.email || '-',
      proveedor.direccion || '-',
      proveedor.nombreCiudad || '-',
      proveedor.nombreProvincia || '-',
      this.formatearFecha(proveedor.fechaAlta)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const nombreArchivo = `proveedores_${this.getFechaParaArchivo()}.csv`;
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

  
  // ==================== PLANILLA DE CONFECCION ====================

  exportarPlanillaConfeccionPDF(data: PlanillaConfeccionExport): void {
    const doc = new jsPDF('p');
    const marginX = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - marginX * 2;
    let y = 12;

    const titulo = data.titulo || 'Planilla Confeccion';
    const proyecto = data.proyecto ?? {};
    const taller = data.taller ?? {};
    const fechas = data.fechas ?? {};

    const fechaGeneracion = (data.fechaGeneracion ?? new Date()).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.setFillColor(255, 87, 34);
    doc.rect(marginX, y, contentWidth, 12, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(titulo, marginX + 3, y + 8);
    doc.setFontSize(9);
    doc.text(`Proyecto: ${proyecto.codigo || '-'}`, marginX + contentWidth - 3, y + 8, { align: 'right' });

    y += 16;
    doc.setTextColor(80);
    doc.setFontSize(9);
    doc.text(`Generado: ${fechaGeneracion}`, marginX, y);
    doc.text(`Cliente: ${proyecto.cliente || '-'}`, marginX + contentWidth / 2, y);
    y += 6;

    const addSectionTitle = (tituloSeccion: string) => {
      doc.setFontSize(10);
      doc.setTextColor(60);
      doc.text(tituloSeccion.toUpperCase(), marginX, y);
      doc.setDrawColor(220);
      doc.line(marginX, y + 1.5, marginX + contentWidth, y + 1.5);
      y += 4;
    };

    const addTableAt = (head: string[][], body: string[][], x: number, startY: number, width: number) => {
      autoTable(doc, {
        head,
        body,
        startY,
        margin: { left: x, right: marginX },
        tableWidth: width,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: [40, 40, 40],
          fontStyle: 'bold',
          halign: 'left'
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        }
      });
      const finalY = (doc as any).lastAutoTable?.finalY;
      return (finalY ?? startY);
    };

    addSectionTitle('Datos del proyecto y del taller');
    const colWidth = (contentWidth - 6) / 2;
    const leftX = marginX;
    const rightX = marginX + colWidth + 6;

    const yLeft = addTableAt(
      [['Dato', 'Valor']],
      [
        ['Proyecto', proyecto.nombre || '-'],
        ['Codigo', proyecto.codigo || '-'],
        ['Pedido total', (proyecto.pedidoTotal ?? 0) > 0 ? String(proyecto.pedidoTotal) : '-'],
        ['Prendas', (proyecto.prendas && proyecto.prendas.length) ? proyecto.prendas.join(', ') : '-'],
        ['Colores', (proyecto.colores && proyecto.colores.length) ? proyecto.colores.join(', ') : '-'],
        ['Telas asignadas', (proyecto.telas && proyecto.telas.length) ? proyecto.telas.join(', ') : '-'],
        ['Fecha inicio', fechas.inicio || '-'],
        ['Fecha limite', fechas.limite || '-']
      ],
      leftX,
      y,
      colWidth
    );

    const yRight = addTableAt(
      [['Dato', 'Valor']],
      [
        ['Taller', taller.nombre || '-'],
        ['Responsable', taller.responsable || '-'],
        ['Telefono', taller.telefono || '-'],
        ['Email', taller.email || '-'],
        ['Direccion', taller.direccion || '-'],
        ['Ciudad', taller.ciudad || '-'],
        ['Provincia', taller.provincia || '-']
      ],
      rightX,
      y,
      colWidth
    );

    y = Math.max(yLeft, yRight) + 6;

    addSectionTitle('Diseno');
    if (data.diseno && data.diseno.length > 0) {
      for (const prenda of data.diseno) {
        // Fila de info de la prenda
        const tags: string[] = [];
        if (prenda.tieneBordado) tags.push('Bordado');
        if (prenda.tieneEstampado) tags.push('Estampado');
        const tagStr = tags.length ? ` [${tags.join(', ')}]` : '';

        y = addTableAt(
          [['Prenda', 'Material', 'Cantidad', 'Tipo']],
          [[
            prenda.nombrePrenda || '-',
            prenda.materialBase || '-',
            String(prenda.cantidadTotal ?? 0),
            tagStr || '-'
          ]],
          marginX, y, contentWidth
        ) + 2;

        if (prenda.descripcionDiseno) {
          const lines = doc.splitTextToSize(`Descripción: ${prenda.descripcionDiseno}`, contentWidth - 4);
          doc.setFontSize(8);
          doc.setTextColor(80);
          doc.text(lines, marginX + 2, y + 2);
          y += 4 + lines.length * 3.5;
        }

        // Imágenes en fila (mockup, bordado, estampado)
        const imgs: { label: string; src: string; desc?: string }[] = [];
        if (prenda.imagenMockup) imgs.push({ label: 'Mockup', src: prenda.imagenMockup, desc: prenda.descripcionMockup });
        if (prenda.imagenBordado) imgs.push({ label: 'Bordado', src: prenda.imagenBordado, desc: prenda.descripcionBordado });
        if (prenda.imagenEstampado) imgs.push({ label: 'Estampado', src: prenda.imagenEstampado, desc: prenda.descripcionEstampado });

        if (imgs.length > 0) {
          const imgW = 45;
          const imgH = 45;
          const gap = 6;
          const totalW = imgs.length * imgW + (imgs.length - 1) * gap;
          let imgX = marginX + (contentWidth - totalW) / 2;

          // Verificar espacio en página
          if (y + imgH + 14 > doc.internal.pageSize.getHeight() - 15) {
            doc.addPage();
            y = 14;
          }

          for (const img of imgs) {
            try {
              doc.addImage(img.src, 'JPEG', imgX, y, imgW, imgH);
            } catch {
              try { doc.addImage(img.src, 'PNG', imgX, y, imgW, imgH); } catch { /* skip */ }
            }
            doc.setFontSize(7);
            doc.setTextColor(60);
            doc.text(img.label, imgX + imgW / 2, y + imgH + 3, { align: 'center' });
            if (img.desc) {
              const descLines = doc.splitTextToSize(img.desc, imgW + 4);
              doc.setFontSize(6.5);
              doc.setTextColor(100);
              doc.text(descLines, imgX + imgW / 2, y + imgH + 6, { align: 'center' });
            }
            imgX += imgW + gap;
          }
          y += imgH + 14;
        }
        y += 3;
      }
    } else {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('Sin datos de diseño cargados.', marginX + 2, y + 2);
      y += 8;
    }

    addSectionTitle('Corte - Distribucion por talles');
    const corteBody = data.corteDistribucion && data.corteDistribucion.length
      ? data.corteDistribucion.map(item => [item.talle || '-', String(item.cantidad ?? 0)])
      : [['Sin datos', '-']];
    y = addTableAt([['Talle', 'Cantidad']], corteBody, marginX, y, contentWidth / 2) + 6;

    addSectionTitle('Instrucciones al taller');
    const instrucciones = data.instrucciones?.trim() || '-';
    const instruccionesLines = doc.splitTextToSize(instrucciones, contentWidth - 4);
    doc.setFontSize(9);
    doc.setTextColor(70);
    doc.text(instruccionesLines, marginX + 2, y + 2);
    y += 6 + instruccionesLines.length * 4;

    addSectionTitle('Observaciones');
    const observaciones = data.observaciones?.trim() || '-';
    const observacionesLines = doc.splitTextToSize(observaciones, contentWidth - 4);
    doc.setFontSize(9);
    doc.setTextColor(70);
    doc.text(observacionesLines, marginX + 2, y + 2);
    y += 8 + observacionesLines.length * 4;

    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text('Firma responsable taller: __________________________', marginX, y);
    doc.text('Firma responsable planta: __________________________', marginX + contentWidth / 2, y);
    y += 6;
    doc.text('Fecha de recepcion: ____ / ____ / ______', marginX, y);

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Pagina ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const nombreArchivo = `planilla_confeccion_${this.getFechaParaArchivo()}.pdf`;
    doc.save(nombreArchivo);
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

  private obtenerUbicacionProveedor(proveedor: Proveedor): string {
    const ciudad = proveedor.nombreCiudad;
    const provincia = proveedor.nombreProvincia;

    if (!ciudad && !provincia) return '-';

    const partes: string[] = [];
    if (ciudad) partes.push(ciudad);
    if (provincia) partes.push(provincia);

    return partes.join(', ');
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





