import { createContext, useContext, useReducer, ReactNode, useMemo, useCallback } from 'react';
import { Product, Client } from '../types';
import { toast } from '@/lib/swalert';

export interface CartItem extends Product {
    uniqueId: string;
    quantity: number;
    bulkCount: number;
    looseUnitCount: number;
}

interface PosState {
    cart: CartItem[];
    mode: 'products' | 'payment';
    isHeldBillsOpen: boolean;
    showQuickSwitch: boolean;
    client: Client | null;
    isLoading: boolean;
    saleCompleted: boolean;
}

type PosAction =
    | { type: 'ADD_ITEM'; product: Product }
    | { type: 'SET_QUANTITY'; uniqueId: string; quantity: number }
    | { type: 'SET_BULK_QUANTITY'; uniqueId: string; bulkCount: number; looseUnitCount: number }
    | { type: 'REMOVE_ITEM'; uniqueId: string }
    | { type: 'SET_CLIENT'; client: Client | null }
    | { type: 'SET_MODE'; mode: 'products' | 'payment' }
    | { type: 'CLEAR_AFTER_SUCCESS' }
    | { type: 'TOGGLE_HELD_BILLS' }
    | { type: 'TOGGLE_QUICK_SWITCH' }
    | { type: 'SET_LOADING'; isLoading: boolean };

const initialState: PosState = {
    cart: [],
    mode: 'products',
    isHeldBillsOpen: false,
    showQuickSwitch: false,
    client: null,
    isLoading: false,
    saleCompleted: false,
};

function posReducer(state: PosState, action: PosAction): PosState {
    switch (action.type) {
        case 'ADD_ITEM': {
            const product = action.product;
            const existing = state.cart.find((item) => item.id === product.id);
            if (existing) {
                if (product.handlesBulk) {
                    return {
                        ...state,
                        cart: state.cart.map((item) =>
                            item.id === product.id
                                ? { ...item, bulkCount: item.bulkCount + 1 }
                                : item
                        ),
                    };
                }
                return {
                    ...state,
                    cart: state.cart.map((item) =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ),
                };
            }
            if (product.handlesBulk) {
                return {
                    ...state,
                    cart: [...state.cart, { ...product, quantity: 0, bulkCount: 1, looseUnitCount: 0, uniqueId: crypto.randomUUID() }],
                };
            }
            return {
                ...state,
                cart: [...state.cart, { ...product, quantity: 1, bulkCount: 0, looseUnitCount: 0, uniqueId: crypto.randomUUID() }],
            };
        }
        case 'SET_QUANTITY':
            return {
                ...state,
                cart: state.cart.map((item) =>
                    item.uniqueId === action.uniqueId
                        ? { ...item, quantity: Math.max(0, action.quantity) }
                        : item
                ).filter((item) => item.quantity > 0),
            };
        case 'SET_BULK_QUANTITY':
            return {
                ...state,
                cart: state.cart.map((item) =>
                    item.uniqueId === action.uniqueId
                        ? { ...item, bulkCount: Math.max(0, action.bulkCount), looseUnitCount: Math.max(0, action.looseUnitCount) }
                        : item
                ).filter((item) => item.bulkCount > 0 || item.looseUnitCount > 0 || item.quantity > 0),
            };
        case 'REMOVE_ITEM':
            return {
                ...state,
                cart: state.cart.filter((item) => item.uniqueId !== action.uniqueId),
            };
        case 'SET_CLIENT':
            return { ...state, client: action.client };
        case 'SET_MODE':
            return { ...state, mode: action.mode };
        case 'CLEAR_AFTER_SUCCESS':
            return { ...state, cart: [], client: null, mode: 'products', saleCompleted: true };
        case 'TOGGLE_HELD_BILLS':
            return { ...state, isHeldBillsOpen: !state.isHeldBillsOpen };
        case 'TOGGLE_QUICK_SWITCH':
            return { ...state, showQuickSwitch: !state.showQuickSwitch };
        case 'SET_LOADING':
            return { ...state, isLoading: action.isLoading };
        default:
            return state;
    }
}

interface PosContextType {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    setQuantity: (uniqueId: string, quantity: number) => void;
    setBulkQuantity: (uniqueId: string, bulkCount: number, looseUnitCount: number) => void;
    removeFromCart: (uniqueId: string) => void;
    clearCart: () => void;
    clearCartAfterSuccess: () => void;
    mode: 'products' | 'payment';
    setMode: (mode: 'products' | 'payment') => void;
    handleHoldBill: () => void;
    handleCreditNoteClick: () => void;
    isHeldBillsOpen: boolean;
    toggleHeldBills: () => void;
    showQuickSwitch: boolean;
    toggleQuickSwitch: () => void;
    handleOpenDrawer: () => void;
    handlePayment: () => void;
    client: Client | null;
    setClient: (client: Client | null) => void;
    isLoading: boolean;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(posReducer, initialState);

    const addToCart = useCallback((product: Product) => {
        dispatch({ type: 'ADD_ITEM', product });
    }, []);

    const setQuantity = useCallback((uniqueId: string, quantity: number) => {
        dispatch({ type: 'SET_QUANTITY', uniqueId, quantity });
    }, []);

    const setBulkQuantity = useCallback((uniqueId: string, bulkCount: number, looseUnitCount: number) => {
        dispatch({ type: 'SET_BULK_QUANTITY', uniqueId, bulkCount, looseUnitCount });
    }, []);

    const removeFromCart = useCallback((uniqueId: string) => {
        dispatch({ type: 'REMOVE_ITEM', uniqueId });
    }, []);

    const clearCart = useCallback(() => {
        if (state.cart.length === 0) return;
        if (confirm("¿Estás seguro de limpiar el carrito?")) {
            dispatch({ type: 'CLEAR_AFTER_SUCCESS' });
        }
    }, [state.cart.length]);

    const clearCartAfterSuccess = useCallback(() => {
        dispatch({ type: 'CLEAR_AFTER_SUCCESS' });
    }, []);

    const setMode = useCallback((mode: 'products' | 'payment') => {
        dispatch({ type: 'SET_MODE', mode });
    }, []);

    const handleHoldBill = useCallback(() => {
        dispatch({ type: 'CLEAR_AFTER_SUCCESS' });
    }, []);

    const handleCreditNoteClick = useCallback(() => {
        toast.info(
            'Nota de crédito',
            'El flujo formal de nota de crédito quedará en la siguiente fase operativa.'
        );
    }, []);

    const toggleHeldBills = useCallback(() => {
        dispatch({ type: 'TOGGLE_HELD_BILLS' });
    }, []);

    const toggleQuickSwitch = useCallback(() => {
        dispatch({ type: 'TOGGLE_QUICK_SWITCH' });
    }, []);

    const handleOpenDrawer = useCallback(() => {
        toast.info(
            'Abrir gaveta',
            'La integración directa con hardware de caja se habilitará en la fase de dispositivos.'
        );
    }, []);

    const handlePayment = useCallback(() => {
        dispatch({ type: 'SET_MODE', mode: 'payment' });
    }, []);

    const setClient = useCallback((client: Client | null) => {
        dispatch({ type: 'SET_CLIENT', client });
    }, []);

    const contextValue = useMemo(() => ({
        cart: state.cart,
        addToCart,
        setQuantity,
        setBulkQuantity,
        removeFromCart,
        clearCart,
        clearCartAfterSuccess,
        mode: state.mode,
        setMode,
        handleHoldBill,
        handleCreditNoteClick,
        isHeldBillsOpen: state.isHeldBillsOpen,
        toggleHeldBills,
        showQuickSwitch: state.showQuickSwitch,
        toggleQuickSwitch,
        handleOpenDrawer,
        handlePayment,
        client: state.client,
        setClient,
        isLoading: state.isLoading,
    }), [
        state.cart, state.mode, state.isHeldBillsOpen,
        state.showQuickSwitch, state.client, state.isLoading,
        addToCart, setQuantity, setBulkQuantity, removeFromCart, clearCart, clearCartAfterSuccess,
        setMode, handleHoldBill, handleCreditNoteClick,
        toggleHeldBills, toggleQuickSwitch, handleOpenDrawer,
        handlePayment, setClient,
    ]);

    return (
        <PosContext.Provider value={contextValue}>
            {children}
        </PosContext.Provider>
    );
}

export function usePos() {
    const context = useContext(PosContext);
    if (context === undefined) {
        throw new Error('usePos must be used within a PosProvider');
    }
    return context;
}
