
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import apiClient from '@/services/api-client';

interface Department {
    id: string;
    name: string;
}

interface ProductGridNavigationProps {
    storeId: string;
    onProductSelect: (product: Product) => void;
    className?: string;
}

export function ProductGridNavigation({ storeId, onProductSelect, className }: ProductGridNavigationProps) {
    const [currentDept, setCurrentDept] = useState<Department | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // --- 1. Fetch Root Departments ---
    useEffect(() => {
        if (!storeId) return;
        
        async function fetchDepartments() {
            setLoading(true);
            try {
                const response = await apiClient.get('/departments', {
                    params: {
                        storeId,
                        type: 'main',
                    },
                });
                setDepartments(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Error fetching departments:", error);
            } finally {
                setLoading(false);
            }
        }
        
        if (!currentDept) {
            fetchDepartments();
        }
    }, [storeId, currentDept]);

    // --- 2. Fetch Products when Department is selected ---
    useEffect(() => {
        if (!currentDept || !storeId) return;

        async function fetchProducts() {
            setLoading(true);
            try {
                const response = await apiClient.get(`/products?storeId=${storeId}&departmentId=${currentDept!.id}`);
                setProducts(response.data);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [storeId, currentDept]);

    const handleBack = () => {
        setCurrentDept(null);
        setProducts([]);
    };

    const getTitle = () => {
        if (currentDept) return currentDept.name;
        return 'MENÚ PRINCIPAL';
    };

    return (
        <div className={cn("h-full flex flex-col bg-slate-100", className)}>
            <div className="bg-slate-800 text-white p-3 flex items-center gap-3 shadow-sm shrink-0">
                {currentDept && (
                    <Button variant="ghost" size="icon" onClick={handleBack} className="text-white hover:bg-white/20">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <Box className="h-5 w-5 text-orange-400" />
                <h2 className="font-bold text-lg tracking-wide uppercase truncate flex-1">
                    {getTitle()}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg shadow-sm" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2">
                        {!currentDept ? (
                            departments.map(dept => (
                                <button
                                    key={dept.id}
                                    onClick={() => setCurrentDept(dept)}
                                    className="aspect-square bg-purple-800 hover:bg-purple-900 text-white p-2 rounded-lg shadow-md flex flex-col items-center justify-center transition-all active:scale-95 border-b-4 border-purple-900"
                                >
                                    <span className="font-bold text-center text-sm lg:text-base uppercase leading-tight line-clamp-2">{dept.name}</span>
                                </button>
                            ))
                        ) : (
                            <>
                                <button
                                    onClick={handleBack}
                                    className="aspect-square bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg shadow-md flex flex-col items-center justify-center transition-all active:scale-95 border-b-4 border-orange-700"
                                >
                                    <ArrowLeft className="h-8 w-8 mb-1" />
                                    <span className="font-bold text-sm lg:text-base">VOLVER</span>
                                </button>

                                {products.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => onProductSelect(product)}
                                        className="aspect-square bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-lg shadow-md flex flex-col justify-between transition-all active:scale-95 group border-b-4 border-blue-800"
                                    >
                                        <span className="font-semibold text-center text-xs lg:text-sm uppercase line-clamp-3 leading-tight w-full break-words group-hover:underline">
                                            {product.description}
                                        </span>
                                        <div className="text-center w-full">
                                            <span className="block text-lg lg:text-xl font-black mb-0.5 leading-none">C$ {product.salePrice.toFixed(0)}</span>
                                            {product.barcode && <span className="text-[9px] opacity-70 truncate block font-mono">{product.barcode}</span>}
                                        </div>
                                    </button>
                                ))}
                            </>
                        )}
                        
                        {!loading && !currentDept && departments.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                                <Box className="h-16 w-16 mb-4 opacity-50" />
                                <p className="text-lg font-medium">No hay departamentos.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
