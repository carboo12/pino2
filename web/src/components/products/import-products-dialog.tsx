import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileDown, Loader2, FileSpreadsheet } from 'lucide-react';

import apiClient from '@/services/api-client';
import { logError } from '@/lib/error-logger';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/export-excel';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ImportProductsDialogProps {
  storeId: string;
  departments: { id: string; name: string }[];
}

const HEADER_MAPPING: Record<string, string> = {
  'Código de Barras': 'barcode',
  'Descripción': 'description',
  'Precio de Costo': 'costPrice',
  'Precio de Venta': 'salePrice',
  'Precio Mayorista': 'wholesalePrice',
  'Precio 1': 'price1',
  'Precio 2': 'price2',
  'Precio 3': 'price3',
  'Precio 4': 'price4',
  'Precio 5': 'price5',
  'Departamento': 'department',
  'Subdepartamento': 'subDepartment',
  'Proveedor': 'supplierName',
  'Usa Inventario': 'usesInventory',
  'Stock Actual': 'currentStock',
  'Stock Mínimo': 'minStock',
  'Códigos Alternativos': 'alternateBarcodes',
  // Fuzzy variants for Excel/truncated headers
  'Precio de Co': 'costPrice',
  'Precio de Ve': 'salePrice',
  'Precio Mayo': 'wholesalePrice',
  'Departamen': 'department',
  'Subdeparta': 'subDepartment',
  'Usa Inventa': 'usesInventory',
  'Stock Actua': 'currentStock',
  'Stock Mínim': 'minStock'
};

const SPANISH_HEADERS = Object.keys(HEADER_MAPPING);

const TEMPLATE_ROWS = [
  {
    'Código de Barras': '7501001155925',
    'Descripción': 'Coca-Cola 600ml',
    'Precio de Costo': 10.5,
    'Precio de Venta': 15,
    'Precio Mayorista': 14,
    'Precio 1': 15,
    'Precio 2': 14.5,
    'Precio 3': 14,
    'Precio 4': 13.5,
    'Precio 5': 13,
    'Departamento': 'Bebidas',
    'Subdepartamento': 'Gaseosas',
    'Proveedor': 'Coca-Cola Company',
    'Usa Inventario': 'SI',
    'Stock Actual': 100,
    'Stock Mínimo': 10,
    'Códigos Alternativos': '101234, 101235',
  },
  {
    'Código de Barras': '',
    'Descripción': 'Sabritas Originales 45g',
    'Precio de Costo': 8,
    'Precio de Venta': 12,
    'Precio Mayorista': 11.5,
    'Precio 1': 12,
    'Precio 2': 11.75,
    'Precio 3': 11.5,
    'Precio 4': 11,
    'Precio 5': 10.5,
    'Departamento': 'Snacks',
    'Subdepartamento': '',
    'Proveedor': 'PepsiCo',
    'Usa Inventario': 'SI',
    'Stock Actual': 50,
    'Stock Mínimo': 5,
    'Códigos Alternativos': '',
  },
];

interface ProductDataRow {
  barcode?: string;
  brand?: string;
  description: string;
  costPrice: number;
  salePrice?: number;
  wholesalePrice?: number;
  price1?: number;
  price2?: number;
  price3?: number;
  price4?: number;
  price5?: number;
  department?: string;
  subDepartment?: string;
  supplierName?: string;
  usesInventory?: boolean;
  currentStock?: number;
  minStock?: number;
  alternateBarcodes?: string | string[];
}


export function ImportProductsDialog({ storeId }: ImportProductsDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ProductDataRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setErrors([]);
      setProgress(0);

      const reader = new FileReader();

      if (file.name.endsWith('.csv')) {
        reader.onload = (e) => {
          const text = e.target?.result as string;
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => HEADER_MAPPING[header.trim()] || header.trim(),
            complete: (results) => setParsedData(results.data as ProductDataRow[]),
            error: (error: any) => toast({ variant: 'destructive', title: 'Error al leer CSV', description: error.message }),
          });
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.onload = async (e) => {
          try {
            const XLSX = await import('xlsx');
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, any>[];
            
            const formattedData = json.map(row => {
               const mappedRow: Record<string, any> = {};
               for (const key of Object.keys(row)) {
                 const mappedKey = HEADER_MAPPING[key.trim()] || key.trim();
                 mappedRow[mappedKey] = row[key];
               }
               return mappedRow;
            });

            setParsedData(formattedData as ProductDataRow[]);
          } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error al leer Excel', description: error.message });
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        toast({ variant: 'destructive', title: 'Formato no soportado', description: 'Sube un archivo Excel (.xlsx) o CSV.' });
      }
    }
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(TEMPLATE_ROWS);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
    XLSX.writeFile(workbook, "plantilla_productos.xlsx");
  };

  const handleImport = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error de autenticación' });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Prepare products with price normalization
      const productsToSend = parsedData.map(productData => {
        const price1 = Number(productData.price1 || productData.salePrice || 0);
        const price3 = Number(productData.price3 || productData.wholesalePrice || 0);
        return {
          barcode: productData.barcode || '',
          alternateBarcodes: typeof productData.alternateBarcodes === 'string'
            ? productData.alternateBarcodes.split(/[;,]/).map(s => s.trim()).filter(Boolean)
            : [],
          description: productData.description,
          brand: productData.brand || '',
          costPrice: Number(productData.costPrice || 0),
          price1,
          price2: Number(productData.price2 || 0),
          price3,
          price4: Number(productData.price4 || 0),
          price5: Number(productData.price5 || 0),
          salePrice: price1,
          wholesalePrice: price3,
          department: productData.department || '',
          subDepartment: productData.subDepartment || '',
          supplierName: productData.supplierName || '',
          usesInventory: productData.usesInventory !== undefined
            ? ['true', '1', 'si', 'sí', 'verdadero'].includes(String(productData.usesInventory).toLowerCase().trim())
            : true,
          currentStock: Number(productData.currentStock || 0),
          minStock: Number(productData.minStock || 0),
        };
      });

      await apiClient.post('/products/import', {
        storeId,
        products: productsToSend,
        cashierName: user.name,
      });

      setProgress(100);
      toast({ title: 'Importación Completa', description: `${parsedData.length} productos han sido importados exitosamente.` });
      resetState();
      setIsOpen(false);
    } catch (error) {
      logError(error, { location: 'import-products-dialog-import' });
      toast({ variant: 'destructive', title: 'Error durante la importación', description: 'Ocurrió un error. Revisa la consola para más detalles.' });
    } finally {
      setIsProcessing(false);
    }
  };


  const resetState = () => {
    setFileName(null);
    setParsedData([]);
    setErrors([]);
    setProgress(0);
    setIsProcessing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetState(); setIsOpen(open); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importación Masiva de Productos</DialogTitle>
          <DialogDescription>
            Sigue estos pasos para agregar múltiples productos a tu inventario desde un archivo CSV.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Paso 1: Descarga la plantilla</h3>
            <p className="text-sm text-muted-foreground">
              Descarga la plantilla en Excel, llénala con tus productos y súbela en el paso 2.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <Button variant="outline" onClick={handleDownloadTemplate} className="border-green-600/30 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Descargar Plantilla Excel
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Paso 2: Sube tu archivo</h3>
            <p className="text-sm text-muted-foreground">
              Una vez que hayas llenado la plantilla, súbela aquí. Aceptamos Excel (.xlsx) y CSV.
            </p>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  {fileName ? (
                    <p className="font-semibold text-primary">{fileName}</p>
                  ) : (
                    <>
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                      <p className="text-xs text-muted-foreground">Archivo Excel (.xlsx) o CSV (máx. 5MB)</p>
                    </>
                  )}
                </div>
                <input id="dropzone-file" type="file" accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              <h4 className="font-bold mb-2">Errores de Validación:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {isProcessing && <Progress value={progress} className="w-full" />}

        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleImport} disabled={isProcessing || parsedData.length === 0}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isProcessing ? `Importando... ${progress}%` : `Importar ${parsedData.length} Productos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
