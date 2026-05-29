import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { globalSearch } from "@/lib/search";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const hits = globalSearch(q);
  const grouped = hits.reduce<Record<string, typeof hits>>((acc, h) => {
    (acc[h.module] ??= []).push(h); return acc;
  }, {});
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 w-full md:w-72 justify-start gap-2 text-muted-foreground font-normal"
      >
        <Search className="w-4 h-4" /> ค้นหาทุกเมนู…
        <kbd className="ml-auto hidden md:inline text-[10px] bg-muted px-1.5 py-0.5 rounded">/</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="ค้นหาลูกค้า ดีล งาน ใบแจ้งหนี้…" value={q} onValueChange={setQ} />
        <CommandList>
          <CommandEmpty>ไม่พบผลลัพธ์</CommandEmpty>
          {Object.entries(grouped).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((h) => (
                <CommandItem
                  key={`${group}-${h.id}`}
                  onSelect={() => { setOpen(false); nav(h.link); }}
                >
                  <span className="font-medium">{h.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{h.sub}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
