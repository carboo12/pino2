
import { useCallback, RefObject } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from './use-toast';

export function usePrintableTicket(ticketRef: RefObject<HTMLDivElement>) {
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const handlePrint = useCallback(async () => {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const element = ticketRef.current;
    if (!element) {
      toast({
        variant: 'destructive',
        title: 'Error de Impresión',
        description: 'No se encontró el contenido del ticket para imprimir.',
      });
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Aumenta la resolución para mejor calidad
      });
      const imageData = canvas.toDataURL('image/png');

      if (isMobile) {
        // En móvil, usar la API de Compartir
        if (navigator.share) {
          const blob = await (await fetch(imageData)).blob();
          const file = new File([blob], 'ticket.png', { type: 'image/png' });
          await navigator.share({
            files: [file],
            title: 'Ticket de Venta',
            text: 'Aquí está tu ticket de venta.',
          });
        } else {
          // Fallback para móviles sin API de compartir: descargar la imagen
          const link = document.createElement('a');
          link.href = imageData;
          link.download = 'ticket.png';
          link.click();
        }
      } else {
        // En escritorio, crear un PDF y abrirlo en una ventana emergente
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height);
        
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Abrir el PDF en una ventana emergente centrada
        const popupWidth = 400;
        const popupHeight = 700;
        const left = window.screen.width / 2 - popupWidth / 2;
        const top = window.screen.height / 2 - popupHeight / 2;
        const popup = window.open(
          pdfUrl,
          'Ticket',
          `width=${popupWidth},height=${popupHeight},top=${top},left=${left},resizable=yes,scrollbars=yes`
        );
        // Enfocar la ventana emergente si no fue bloqueada
        if (popup) {
          popup.focus();
        } else {
            toast({
                variant: 'destructive',
                title: 'Ventana emergente bloqueada',
                description: 'Por favor, permite las ventanas emergentes para este sitio.'
            });
        }
      }
    } catch (error) {
      console.error('Error al generar el ticket:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo generar el ticket para imprimir/compartir.',
      });
    }
  }, [ticketRef, isMobile, toast]);

  return { handlePrint };
}
