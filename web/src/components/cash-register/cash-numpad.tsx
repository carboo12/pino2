import React from 'react';
import { Delete, RotateCcw, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CashNumpadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit?: () => void;
  submitText?: string;
  submitDisabled?: boolean;
}

export const CashNumpad: React.FC<CashNumpadProps> = ({
  onDigit,
  onBackspace,
  onClear,
  onSubmit,
  submitText = 'Aceptar',
  submitDisabled = false,
}) => {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'];

  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl flex flex-col gap-3 max-w-sm w-full select-none">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
        <span>Teclado Numérico Táctil</span>
        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">POS Touch</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            onClick={() => onDigit(key)}
            className="h-14 text-xl font-bold bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white active:scale-95 transition-all shadow"
          >
            {key}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onBackspace}
          className="h-12 bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/60 font-semibold gap-2"
        >
          <Delete className="w-5 h-5" />
          Borrar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          className="h-12 bg-red-950/40 border-red-800/60 text-red-300 hover:bg-red-900/60 font-semibold gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Limpiar
        </Button>
      </div>

      {onSubmit && (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className="h-14 text-lg font-bold bg-[#8BC34A] hover:bg-[#7CB34A] text-slate-950 mt-1 gap-2 shadow-lg shadow-lime-900/30"
        >
          <CornerDownLeft className="w-5 h-5" />
          {submitText}
        </Button>
      )}
    </div>
  );
};
