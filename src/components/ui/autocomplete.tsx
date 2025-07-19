import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type AutocompleteInputType<T> = Omit<
  React.ComponentProps<"input">,
  "onChange"
> & {
  value: T;
  onChange: (value: T) => void;
  suggestions?: T[];
};

export default function AutocompleteInput<T extends string>({
  value,
  onKeyDown,
  onChange,
  suggestions = [],
  ...rest
}: AutocompleteInputType<T>) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputWidth, setInputWidth] = useState<number | undefined>();
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ref = itemRefs.current[highlightedIndex];
    if (ref) {
      ref.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  useEffect(() => {
    function matchPopoverWidth() {
      if (inputRef.current) {
        setInputWidth(inputRef.current.offsetWidth);
      }
    }
    matchPopoverWidth();
    const abortCtrl = new AbortController();
    window.addEventListener("resize", matchPopoverWidth, {
      signal: abortCtrl.signal,
    });
    return () => {
      abortCtrl.abort();
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && suggestions.length > 0) {
      setOpen(true);
      setHighlightedIndex(0);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[highlightedIndex]) {
        onChange(suggestions[highlightedIndex]);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }

    // HACK: to get full value of number inside keydown handler
    setTimeout(() => {
      onKeyDown?.(e);
    }, 0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          type="text"
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value as T);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          {...rest}
        />
      </PopoverTrigger>
      {open && suggestions.length > 0 && (
        <PopoverContent
          className="p-0 max-h-60 overflow-y-auto"
          style={{ minWidth: inputWidth }}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandGroup className="bg-gray-950 p-1">
              {suggestions.map((item, index) => (
                <CommandItem
                  key={`command-item-${index}`}
                  ref={(ref) => {
                    itemRefs.current[index] = ref;
                  }}
                  onSelect={() => {
                    onChange(item);
                    setOpen(false);
                    rest.onBlur?.({ target: { value: item } } as any);
                  }}
                  className={cn(
                    "[&:not(:last-child)]:mb-1",
                    highlightedIndex === index &&
                      "bg-gray-800 text-accent-foreground"
                  )}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === item ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {item}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}
