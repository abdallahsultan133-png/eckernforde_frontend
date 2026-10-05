import { useMemo, useState } from "react";
import { Check, ChevronDown, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";

type TimeOption = {
  value: string;
  label: string;
  note?: string;
  keywords?: string;
};

const formatTime = (hour: number, minute: number) => {
  const displayHour = hour % 12 || 12;
  const period = hour >= 12 ? "PM" : "AM";
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

const COMMON_TIMES: TimeOption[] = [
  { value: "12:00", label: "12:00 PM", note: "Midday", keywords: "noon lunch" },
  { value: "16:00", label: "4:00 PM", note: "After school", keywords: "afternoon school close" },
  { value: "17:00", label: "5:00 PM", note: "End of workday", keywords: "afternoon evening" },
  { value: "23:59", label: "11:59 PM", note: "End of day", keywords: "midnight tonight" },
];

const ALL_TIMES: TimeOption[] = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  return {
    value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    label: formatTime(hour, minute),
  };
});

const TIME_LABELS = new Map(
  [...ALL_TIMES, ...COMMON_TIMES].map((option) => [option.value, option.label]),
);

interface TimeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/** Searchable assignment-time picker inspired by common LMS due-date controls. */
export function TimeSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select time",
  className,
}: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = useMemo(() => TIME_LABELS.get(value), [value]);
  const regularTimes = useMemo(
    () => ALL_TIMES.filter((option) => !COMMON_TIMES.some((common) => common.value === option.value)),
    [],
  );

  const choose = (nextValue: string) => {
    onValueChange(nextValue);
    setOpen(false);
  };

  const option = (item: TimeOption) => (
    <CommandItem
      key={item.value}
      value={`${item.label} ${item.note ?? ""} ${item.keywords ?? ""}`}
      onSelect={() => choose(item.value)}
      className="min-h-9"
    >
      <Check className={cn("h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} aria-hidden="true" />
      <span className="font-medium tabular-nums">{item.label}</span>
      {item.note && <span className="ml-auto text-xs text-muted-foreground">{item.note}</span>}
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select homework deadline time"
          disabled={disabled}
          className={cn("w-full justify-between px-3 font-normal", !selectedLabel && "text-muted-foreground", className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate tabular-nums">{selectedLabel ?? placeholder}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0">
        <Command>
          <CommandInput placeholder="Search a time…" aria-label="Search deadline times" />
          <CommandList>
            <CommandEmpty>No matching time.</CommandEmpty>
            <CommandGroup heading="Common deadlines">
              {COMMON_TIMES.map(option)}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Every 15 minutes">
              {regularTimes.map(option)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

TimeSelect.displayName = "TimeSelect";
