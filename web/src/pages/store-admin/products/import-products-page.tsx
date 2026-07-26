import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImportPreviewTable } from '@/components/ui/import-preview-table';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

interface ImportRow {
  index: number;
  cells: string[];
  status?: 'valid' | 'warning' | 'error';
  errors?: string[];
}

export default function ImportProductsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const text = await f.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      toast.error('Archivo inválido', 'Debe tener al menos una fila de datos');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const dataLines = lines.slice(1).filter(l => l.trim());

    setColumns(headers);
    setRows(dataLines.map((line, i) => ({
      index: i,
      cells: line.split(',').map(c => c.trim()),
      status: 'valid' as const,
    })));

    setStep('preview');
  };

  const handlePreview = async () => {
    if (!storeId || rows.length === 0) return;
    setPreviewing(true);
    try {
      const products = rows.map(r => ({
        description: r.cells[0] || '',
        salePrice: parseFloat(r.cells[2]) || 0,
        barcode: r.cells[1] || undefined,
        storeId,
      }));

      const res = await apiClient.post('/products/import/preview', {
        storeId,
        products,
        cashierName: 'Importación manual',
        externalId: crypto.randomUUID(),
      });

      const result = res.data;
      if (result.valid !== undefined) {
        setRows(rows.map((r, i) => ({
          ...r,
          status: i < result.valid ? 'valid' : 'error',
          errors: i >= result.valid ? ['Error en validación'] : undefined,
        })));
      }

      toast.success('Previsualización lista', `Se analizaron ${rows.length} productos`);
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'Error al previsualizar');
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!storeId || rows.length === 0) return;
    setImporting(true);
    try {
      const products = rows
        .filter(r => r.status !== 'error')
        .map(r => ({
          description: r.cells[0] || '',
          salePrice: parseFloat(r.cells[2]) || 0,
          barcode: r.cells[1] || undefined,
          storeId,
        }));

      await apiClient.post('/products/import', {
        storeId,
        products,
        cashierName: 'Importación manual',
      });

      toast.success('Importación completada', `${products.length} productos importados`);
      setStep('done');
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'nombre,código de barras,precio\nProducto ejemplo,1234567890123,100\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_importacion.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/store/${storeId}/products`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Importar Productos</h1>
            <p className="text-sm text-muted-foreground">Importación masiva desde archivo CSV</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="mr-1 h-4 w-4" /> Plantilla CSV
        </Button>
      </div>

      {step === 'upload' && (
        <div className="flex flex-col items-center gap-6 rounded-lg border border-dashed p-12 text-center">
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-lg font-medium">Selecciona un archivo CSV</p>
            <p className="text-sm text-muted-foreground">Columnas: nombre, código de barras, precio</p>
          </div>
          <Label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              <Upload className="h-4 w-4" />
              Seleccionar archivo
            </div>
            <Input ref={fileRef} id="file-upload" type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </Label>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{rows.length} filas detectadas</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setStep('upload'); setRows([]); setFile(null); }}>
                Cambiar archivo
              </Button>
              <Button size="sm" onClick={handlePreview} disabled={previewing}>
                {previewing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                Validar
              </Button>
            </div>
          </div>

          <ImportPreviewTable columns={columns} rows={rows} maxPreview={20} />

          <div className="flex items-center justify-end gap-3 border-t pt-6">
            <Button variant="outline" onClick={() => navigate(`/store/${storeId}/products`)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={importing || rows.filter(r => r.status !== 'error').length === 0}>
              {importing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
              {importing ? 'Importando...' : `Importar ${rows.filter(r => r.status !== 'error').length} productos`}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <p className="text-lg font-medium text-green-700">Importación completada</p>
          <p className="text-sm text-green-600">Los productos se importaron correctamente</p>
          <Button onClick={() => navigate(`/store/${storeId}/products`)}>Ver productos</Button>
        </div>
      )}
    </div>
  );
}
