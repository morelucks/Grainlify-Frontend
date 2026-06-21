"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "../../../app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../../app/components/ui/popover";
import { useTheme } from "../../contexts/ThemeContext";
import { cn } from "../../../app/components/ui/utils";

interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  error?: string | null;
}

/**
 * Helper to parse a YYYY-MM-DD string into a UTC Date object.
 * Returns undefined if the string is empty or invalid.
 *
 * @param value The date string in YYYY-MM-DD format
 */
export function parseUtcDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Helper to format a UTC Date object using date-fns format.
 * To avoid DST/timezone offset transitions shifting the day,
 * we map the UTC date digits to a local Date object at noon (12:00:00).
 *
 * @param date The Date object in UTC to format
 * @param formatStr The date-fns format template string
 */
export function formatUtcDate(date: Date, formatStr: string): string {
  const localNoonDate = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    12, // Noon avoids timezone offset DST shift boundaries
    0,
    0
  );
  return format(localNoonDate, formatStr);
}

/**
 * DatePicker component designed to prevent off-by-one day errors in non-UTC timezones.
 * 
 * ## Timezone Convention
 * Input parsing and display formatting use a consistent UTC basis.
 * - Value: Passed as a `YYYY-MM-DD` string, representing the date in UTC.
 * - Parse: Parsed using `Date.UTC` to construct a UTC Date object.
 * - Display: Formatted by mapping UTC date parts to a local Date object at noon, preventing
 *   local timezone offset calculations (like `date-fns` format) from shifting the date across
 *   day/DST boundaries.
 * - Calendar selection: Highlights the correct day by passing a local Date object mapped to the UTC
 *   digits at noon, and formats the selected local Date back to `YYYY-MM-DD` in local time.
 */
export function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  required = false,
  className = "",
  error
}: DatePickerProps) {
  const { theme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const isError = !!error;

  // Parse the YYYY-MM-DD value into a UTC Date object
  const date = React.useMemo(() => parseUtcDate(value), [value]);

  // Construct local date at noon for the calendar select highlight
  const calendarSelected = React.useMemo(() => {
    if (!date) return undefined;
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      12 // Noon prevents shifting to previous/next day during DST changes
    );
  }, [date]);

  // Format the date for display
  const displayValue = date ? formatUtcDate(date, "MMM dd, yyyy") : "";

  // Handle date selection
  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // selectedDate is a local Date object from react-day-picker.
      // Format to YYYY-MM-DD locally to preserve calendar date digits.
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      onChange(formattedDate);
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  // Input styling matching ModalInput with error support
  const inputClasses = `w-full px-4 py-3 rounded-[14px] backdrop-blur-[30px] border focus:outline-none transition-all text-[14px] flex items-center justify-between ${
    isError
      ? theme === 'dark'
        ? 'bg-red-500/10 border-red-500/40 text-[#f5f5f5] placeholder-red-300/50 focus:border-red-500/60'
        : 'bg-red-500/5 border-red-500/40 text-[#2d2820] placeholder-red-700/50 focus:border-red-500/60'
      : theme === 'dark'
        ? 'bg-white/[0.08] border-white/15 text-[#f5f5f5] placeholder-[#d4d4d4] focus:bg-white/[0.12] focus:border-[#c9983a]/30'
        : 'bg-white/[0.15] border-white/25 text-[#2d2820] placeholder-[#7a6b5a] focus:bg-white/[0.2] focus:border-[#c9983a]/30'
  } ${className}`;

  // Popover content styling for theme
  const popoverContentClasses = theme === 'dark'
    ? 'bg-[#1a1512] border-[#b8a898]/30 backdrop-blur-[30px] text-[#f5f5f5]'
    : 'bg-white/[0.4] border-[#c9983a]/20 backdrop-blur-[30px] text-[#2d2820]';

  // Calendar styling for theme - using theme colors consistently
  const calendarClassNames = {
    months: "flex flex-col sm:flex-row gap-2",
    month: "flex flex-col gap-4",
    caption: "flex justify-center pt-1 relative items-center w-full",
    caption_label: `text-sm font-medium ${theme === 'dark' ? 'text-[#f5f5f5]' : 'text-[#2d2820]'}`,
    nav: "flex items-center gap-1",
    nav_button: cn(
      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md border transition-colors",
      theme === 'dark'
        ? 'border-[#b8a898]/40 text-[#f5f5f5] hover:bg-[#b8a898]/20 hover:border-[#c9983a]/50'
        : 'border-[#c9983a]/20 text-[#2d2820] hover:bg-[#c9983a]/10 hover:border-[#c9983a]/30'
    ),
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse space-x-1",
    head_row: "flex",
    head_cell: cn(
      "rounded-md w-8 font-normal text-[0.8rem]",
      theme === 'dark' ? 'text-[#d4d4d4]' : 'text-[#7a6b5a]'
    ),
    row: "flex w-full mt-2",
    cell: cn(
      "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
      "[&:has([aria-selected])]:rounded-md"
    ),
    day: cn(
      "h-8 w-8 p-0 font-normal rounded-md transition-colors",
      theme === 'dark'
        ? 'text-[#f5f5f5] hover:bg-[#b8a898]/15 hover:text-[#f5f5f5]'
        : 'text-[#2d2820] hover:bg-[#c9983a]/15 hover:text-[#2d2820]',
      "aria-selected:opacity-100"
    ),
    day_selected: cn(
      "bg-[#c9983a] text-white hover:bg-[#c9983a]/90 focus:bg-[#c9983a] focus:text-white",
      "hover:text-white focus:text-white"
    ),
    day_today: cn(
      theme === 'dark' 
        ? 'bg-[#b8a898]/15 text-[#f5f5f5] border border-[#c9983a]/40' 
        : 'bg-[#c9983a]/15 text-[#2d2820] border border-[#c9983a]/30'
    ),
    day_outside: cn(
      theme === 'dark' ? 'text-[#7a7a7a]' : 'text-[#b8a898]'
    ),
    day_disabled: cn(
      theme === 'dark' ? 'text-[#7a7a7a] opacity-50' : 'text-[#b8a898] opacity-50'
    ),
    day_hidden: "invisible",
  };

  return (
    <div>
      {label && (
        <label className={`block text-[13px] font-medium mb-2 transition-colors ${
          theme === 'dark' ? 'text-[#d4d4d4]' : 'text-[#7a6b5a]'
        }`}>
          {label}
          {required && <span className="text-[#c9983a] ml-1">*</span>}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            className={inputClasses}
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            <span className={displayValue ? "" : `text-[14px] ${theme === 'dark' ? 'text-[#d4d4d4]' : 'text-[#7a6b5a]'}`}>
              {displayValue || placeholder}
            </span>
            <CalendarIcon className={`h-4 w-4 ${theme === 'dark' ? 'text-[#d4d4d4]' : 'text-[#7a6b5a]'}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn("w-auto p-0 z-[10001]", popoverContentClasses)} 
          align="start"
          onEscapeKeyDown={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        >
          <Calendar
            mode="single"
            selected={calendarSelected}
            onSelect={handleSelect}
            initialFocus
            classNames={calendarClassNames}
          />
        </PopoverContent>
      </Popover>
      
      {isError && (
        <p className={`text-[12px] mt-1.5 transition-colors ${
          theme === 'dark' ? 'text-red-400' : 'text-red-600'
        }`}>
          {error}
        </p>
      )}
    </div>
  );
}
