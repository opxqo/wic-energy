import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { lazy, Suspense, useState } from "react";
import { Button } from "./ui/button";
import { TrailingDots } from "./TrailingDots";
const Calendar = lazy(() => import("./ui/calendar").then((m) => ({ default: m.Calendar })));
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

export function DatePicker({
  id,
  name,
  disabled = false,
}: {
  id: string;
  name: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const selected = value ? parseISO(value) : undefined;
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className="date-picker-trigger w-[170px] justify-start font-normal"
          >
            <CalendarIcon aria-hidden="true" />
            {selected ? format(selected, "yyyy年MM月dd日") : "选择日期"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Suspense fallback={<div role="status" aria-label="正在加载日历" className="p-4"><TrailingDots /></div>}>
          <Calendar
            mode="single"
            captionLayout="dropdown"
            className="rounded-lg border"
            selected={selected}
            onSelect={(date) => {
              if (!date) return;
              setValue(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
            locale={zhCN}
          />
          </Suspense>
        </PopoverContent>
      </Popover>
    </>
  );
}
