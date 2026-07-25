import { format } from 'date-fns';

interface TicketData {
  id: string;
  items: any[];
  total: number;
  subtotal: number;
  discount: number;
  clientName?: string;
  cashierName: string;
  storeName: string;
  paymentMethod: string;
  amountReceived: number;
  change: number;
  settings?: any;
}

export class TicketService {
  static async generateAndPrint(data: TicketData) {
    const { jsPDF } = await import('jspdf');
    const { settings = {} } = data;
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 200], // Ancho estándar térmica 80mm
    });

    const margin = 5;
    let y = 10;
    const pageWidth = doc.internal.pageSize.width;
    const centerX = pageWidth / 2;

    // Configuración de Fuente
    doc.setFont(settings.fontFamily || 'Courier', settings.useBoldFont ? 'bold' : 'normal');
    const fontSize = settings.fontSize || 10;
    doc.setFontSize(fontSize);

    // --- ENCABEZADO ---
    doc.text(settings.headerLine1 || data.storeName.toUpperCase(), centerX, y, { align: 'center' });
    y += 5;
    if (settings.headerLine2) {
      doc.setFontSize(fontSize - 2);
      doc.text(settings.headerLine2, centerX, y, { align: 'center' });
      y += 4;
    }
    y += 2;
    doc.text('--------------------------------', centerX, y, { align: 'center' });
    y += 5;

    // --- INFO VENTA ---
    doc.setFontSize(fontSize - 1);
    doc.text(`TICKET: #${data.id}`, margin, y);
    y += 4;
    doc.text(`FECHA: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, y);
    y += 4;
    doc.text(`CAJERO: ${data.cashierName.toUpperCase()}`, margin, y);
    y += 4;
    if (data.clientName) {
      doc.text(`CLIENTE: ${data.clientName.toUpperCase()}`, margin, y);
      y += 4;
    }
    y += 2;
    doc.text('--------------------------------', centerX, y, { align: 'center' });
    y += 5;

    // --- ITEMS ---
    doc.setFontSize(fontSize - 1);
    data.items.forEach((item) => {
      const desc = item.description.substring(0, 20);
      const qty = item.quantity.toString().padStart(3, ' ');
      const price = item.salePrice.toFixed(0).padStart(6, ' ');
      const sub = (item.quantity * item.salePrice).toFixed(0).padStart(7, ' ');
      
      doc.text(`${qty} ${desc}`, margin, y);
      doc.text(`${sub}`, pageWidth - margin, y, { align: 'right' });
      y += 4;
    });

    y += 2;
    doc.text('--------------------------------', centerX, y, { align: 'center' });
    y += 6;

    // --- TOTALES ---
    doc.setFontSize(fontSize + 2);
    doc.setFont(doc.getFont().fontName, 'bold');
    doc.text('TOTAL:', margin, y);
    doc.text(`C$ ${data.total.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
    
    y += 8;
    doc.setFontSize(fontSize - 2);
    doc.setFont(doc.getFont().fontName, 'normal');
    doc.text(`RECIBIDO: ${data.amountReceived.toFixed(2)}`, margin, y);
    y += 4;
    doc.text(`CAMBIO:   ${data.change.toFixed(2)}`, margin, y);
    y += 4;
    doc.text(`METODO:   ${data.paymentMethod.toUpperCase()}`, margin, y);

    // --- PIE DE PAGINA ---
    y += 10;
    doc.setFontSize(fontSize - 1);
    doc.text(settings.footerLine1 || '¡GRACIAS POR SU COMPRA!', centerX, y, { align: 'center' });
    
    // --- ACCION ---
    // En lugar de guardar, abrimos el diálogo de impresión
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
}
