"use client";

import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "cn";

const MODES = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: LaptopIcon },
] as const;

// Appearance settings: Light / Dark / System segmented control with a
// live preview. next-themes persists the choice (localStorage) and
// resolves "system" from the OS preference.
export default function AppearancePage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = theme ?? "system";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Currently showing: {resolvedTheme ?? "…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div
            role="radiogroup"
            aria-label="Color theme"
            className="grid grid-cols-3 gap-1 border p-1"
          >
            {MODES.map((m) => {
              const active = current === m.value;
              const Icon = m.icon;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(m.value)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-2 text-sm",
                    active
                      ? "bg-foreground font-medium text-background"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon data-icon="inline-start" />
                  {m.label}
                </button>
              );
            })}
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Preview
            </p>
            <div className="flex flex-wrap items-center gap-2 border p-3">
              <Badge>Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Button size="sm">Button</Button>
              <Button size="sm" variant="outline">
                Outline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
