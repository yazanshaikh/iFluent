import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

const inputClass =
  'flex h-9 w-full rounded-md border bg-background px-2 py-1 text-sm ring-offset-background ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Labelled "From" / "To" date pair (English), used by the lead/booking lists. */
export function DateRangeFilter({
  from, to, onFrom, onTo, onClear, label,
}: {
  from:     string;
  to:       string;
  onFrom:   (v: string) => void;
  onTo:     (v: string) => void;
  onClear?: () => void;
  label?:   string;
}) {
  return (
    <div className="space-y-1" dir="ltr">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <div className="flex items-end gap-2">
        <div className="space-y-0.5">
          <span className="block text-[11px] font-medium text-muted-foreground">From</span>
          <input
            type="date" lang="en"
            value={from}
            max={to || undefined}
            onChange={(e) => onFrom(e.target.value)}
            className={`${inputClass} w-36 ${from ? 'border-primary ring-1 ring-primary/20' : 'border-input'}`}
          />
        </div>
        <div className="space-y-0.5">
          <span className="block text-[11px] font-medium text-muted-foreground">To</span>
          <input
            type="date" lang="en"
            value={to}
            min={from || undefined}
            onChange={(e) => onTo(e.target.value)}
            className={`${inputClass} w-36 ${to ? 'border-primary ring-1 ring-primary/20' : 'border-input'}`}
          />
        </div>
        {(from || to) && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="h-9 px-1 text-muted-foreground hover:text-foreground"
            title="Clear dates"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
