"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "cn";

// Password field with a show/hide toggle. Spreads onto Input so it drops
// into React Hook Form via {...register()} unchanged.
export function PasswordInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);

  return (
    <span className={cn("relative block w-full", className)}>
      <Input
        type={visible ? "text" : "password"}
        {...props}
        className="pr-9"
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
      >
        {visible ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
      </button>
    </span>
  );
}
