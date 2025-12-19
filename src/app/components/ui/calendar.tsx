"use client";

import { ptBR } from "date-fns/locale";
import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "./utils";
import { Button, buttonVariants } from "@/app/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={ptBR}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:2.2rem]",
        className
      )}
      classNames={{
        ...defaultClassNames,
        root: cn("w-fit", defaultClassNames.root),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center",
          defaultClassNames.day
        ),
        today: cn(
          "bg-accent text-accent-foreground rounded-md",
          defaultClassNames.today
        ),
        ...classNames,
      }}
      components={{
        DayButton: CalendarDayButton,
        Chevron: ({ orientation, ...props }) => {
          if (orientation === "left")
            return <ChevronLeftIcon className="size-4" {...props} />;
          if (orientation === "right")
            return <ChevronRightIcon className="size-4" {...props} />;
          return <ChevronDownIcon className="size-4" {...props} />;
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      type="button"
      // data-focused é o que nosso CSS no globals.css vai usar
      data-focused={modifiers.focused}
      className={cn(
        "flex aspect-square h-9 w-9 items-center justify-center rounded-md text-sm transition-all cursor-pointer",
        "hover:bg-accent hover:text-accent-foreground",
        // Estilo quando SELECIONADO
        modifiers.selected && "bg-[#ff8f73] text-white hover:bg-[#ff8f73]/90",
        // Mata qualquer estilo de ring/outline aqui, o CSS global cuida do foco
        "outline-none ring-0 focus:outline-none focus:ring-0",
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
