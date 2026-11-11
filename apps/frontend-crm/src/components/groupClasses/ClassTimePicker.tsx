import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CLASS_SLOTS, addDays, formatDay, formatSlot, isNightSlot, jordanToday, slotMinute,
  type ClassTime,
} from './classTime';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** A day calendar and a 12-hour slot grid that open in place under the field. */
export function ClassTimePicker({ value, onChange }: {
  value:    ClassTime | null;
  onChange: (value: ClassTime) => void;
}) {
  const today = jordanToday();
  const [open, setOpen]   = useState(false);
  const [day, setDay]     = useState(value?.day ?? today.day);
  const [month, setMonth] = useState((value?.day ?? today.day).slice(0, 7));

  const [y, m] = month.split('-').map(Number);
  const first  = `${month}-01`;
  const lead   = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells  = [...Array(lead).fill(null), ...Array.from({ length }, (_, i) => addDays(first, i))];

  const shiftMonth = (n: number) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    setMonth(d.toISOString().slice(0, 7));
  };

  const slotOpen = (slot: string) => day > today.day || (day === today.day && slotMinute(slot) > today.minute);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'h-10 w-full rounded-md border border-input bg-background px-3 text-sm flex items-center gap-2 text-left',
          !value && 'text-muted-foreground',
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0" />
        {value
          ? `${formatDay(value.day)} · ${formatSlot(value.slot)}${isNightSlot(value.slot) ? ' (after midnight)' : ''}`
          : 'Pick a date and time'}
      </button>

      {open && (
        <>
          <div className="mt-2 max-w-[380px] rounded-lg border bg-background p-3 space-y-3">
            <div className="flex items-center justify-between">
              <button type="button" className="p-1 rounded hover:bg-muted disabled:opacity-30"
                disabled={month <= today.day.slice(0, 7)} onClick={() => shiftMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold">
                {new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
              </span>
              <button type="button" className="p-1 rounded hover:bg-muted" onClick={() => shiftMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w) => <span key={w} className="text-[11px] text-muted-foreground">{w}</span>)}
              {cells.map((cell, i) => cell ? (
                <button
                  key={cell}
                  type="button"
                  disabled={cell < today.day}
                  onClick={() => setDay(cell)}
                  className={cn(
                    'h-8 rounded text-sm hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent',
                    cell === day && 'bg-primary text-primary-foreground hover:bg-primary',
                    cell === today.day && cell !== day && 'font-bold text-primary',
                  )}
                >
                  {Number(cell.slice(8))}
                </button>
              ) : <span key={`blank-${i}`} />)}
            </div>

            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground mb-2">Time on {formatDay(day)} (Jordan)</p>
              <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto">
                {CLASS_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    disabled={!slotOpen(slot)}
                    onClick={() => { onChange({ day, slot }); setOpen(false); }}
                    className={cn(
                      'h-8 rounded border text-xs hover:bg-muted disabled:opacity-30',
                      value?.day === day && value.slot === slot && 'bg-primary text-primary-foreground border-primary',
                    )}
                  >
                    {formatSlot(slot)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">12:00 AM – 1:00 AM fall after midnight of the selected day.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
