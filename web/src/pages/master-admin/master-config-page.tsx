import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import apiClient from '@/services/api-client';

interface SystemConfig {
    financialMap: { defaultCreditDays: number; currencyExchangeRate: number; };
    catalogRules: { defaultPackagingType: 'BULTO' | 'UNIDAD'; defaultUnitsPerBulto: number; };
}

const DEFAULT_CONFIG: SystemConfig = { 
    financialMap: { defaultCreditDays: 15, currencyExchangeRate: 36.5 }, 
    catalogRules: { defaultPackagingType: 'UNIDAD', defaultUnitsPerBulto: 12 } 
};

export default function MasterConfigPage() {
    const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await apiClient.get('/config/general');
                // IMPORTANTE: El backend puede devolver { value: {...} } o el objeto directo
                const dataValue = res.data?.value || res.data;
                
                if (dataValue && typeof dataValue === 'object' && !Array.isArray(dataValue)) {
                    setConfig({
                        ...DEFAULT_CONFIG,
                        ...dataValue,
                        financialMap: { 
                            ...DEFAULT_CONFIG.financialMap, 
                            ...(dataValue.financialMap || {}) 
                        },
                        catalogRules: { 
                            ...DEFAULT_CONFIG.catalogRules, 
                            ...(dataValue.catalogRules || {}) 
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching config:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        try {
            await apiClient.put('/config/general', { value: config });
            toast({ title: 'Configuración guardada correctamente' });
        } catch (error) {
            console.error('Error saving config:', error);
            toast({ title: 'Error al guardar', variant: 'destructive' });
        }
    };

    if (loading) return (
        <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Configuración Global</h1>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Reglas Financieras</CardTitle>
                        <CardDescription>Configuración de créditos y moneda.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Días de Crédito (Default)</Label>
                            <Input
                                type="number"
                                value={config?.financialMap?.defaultCreditDays ?? DEFAULT_CONFIG.financialMap.defaultCreditDays}
                                onChange={(e) => setConfig({
                                    ...config,
                                    financialMap: { ...config.financialMap, defaultCreditDays: parseInt(e.target.value) || 0 }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tasa de Cambio (USD/Local)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={config?.financialMap?.currencyExchangeRate ?? DEFAULT_CONFIG.financialMap.currencyExchangeRate}
                                onChange={(e) => setConfig({
                                    ...config,
                                    financialMap: { ...config.financialMap, currencyExchangeRate: parseFloat(e.target.value) || 0 }
                                })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Catálogo Inteligente</CardTitle>
                        <CardDescription>Definiciones por defecto para productos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipo de Empaque (Default)</Label>
                            <Select
                                value={config?.catalogRules?.defaultPackagingType ?? DEFAULT_CONFIG.catalogRules.defaultPackagingType}
                                onValueChange={(val: 'BULTO' | 'UNIDAD') => setConfig({
                                    ...config,
                                    catalogRules: { ...config.catalogRules, defaultPackagingType: val }
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BULTO">BULTO</SelectItem>
                                    <SelectItem value="UNIDAD">UNIDAD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Unidades por Bulto (Default)</Label>
                            <Input
                                type="number"
                                value={config?.catalogRules?.defaultUnitsPerBulto ?? DEFAULT_CONFIG.catalogRules.defaultUnitsPerBulto}
                                onChange={(e) => setConfig({
                                    ...config,
                                    catalogRules: { ...config.catalogRules, defaultUnitsPerBulto: parseInt(e.target.value) || 0 }
                                })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Button size="lg" onClick={handleSave} className="w-full md:w-auto">Guardar Cambios</Button>
        </div>
    );
}
