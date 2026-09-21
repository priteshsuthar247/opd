"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "cn";

// Password field with a show/hide toggle, composed from InputGroup
// primitives instead of hand-rolled absolute positioning. Spreads onto
// InputGroupInput so it drops into React Hook Form via {...register()}
// unchanged.
export function PasswordInput({
  className,
  ...props
}: React.ComponentProps<typeof InputGroupInput>) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup className={className}>
      <InputGroupInput
        type={visible ? "text" : "password"}
        {...props}
        className={cn("pr-1")}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeIcon /> : <EyeOffIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
