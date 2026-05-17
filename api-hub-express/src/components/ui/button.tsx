import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group relative inline-flex max-w-full items-center justify-center gap-2 overflow-hidden whitespace-normal rounded-md text-center text-sm font-black leading-5 ring-offset-background transition-all duration-300 before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/3 before:skew-x-[-18deg] before:bg-white/25 before:opacity-0 before:blur-sm before:transition-all before:duration-500 hover:before:left-[115%] hover:before:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-primary/30 bg-gradient-primary text-primary-foreground shadow-glow-primary hover:-translate-y-0.5 hover:shadow-card-hover",
        cyber:
          "border border-primary/50 bg-primary/10 text-primary shadow-[0_0_24px_hsl(var(--primary)/0.22)] hover:-translate-y-0.5 hover:border-primary hover:bg-primary/20 hover:text-primary-foreground hover:shadow-glow-primary",
        destructive:
          "border border-destructive/30 bg-destructive text-destructive-foreground shadow-sm hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-md",
        outline:
          "border border-border bg-background/80 text-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.08)] hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10 hover:text-foreground",
        secondary:
          "border border-secondary/30 bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/90 hover:shadow-[0_0_22px_hsl(var(--secondary)/0.25)]",
        ghost: "text-muted-foreground hover:-translate-y-0.5 hover:bg-muted hover:text-foreground",
        link: "overflow-visible text-primary underline-offset-4 before:hidden hover:underline",
        social:
          "border border-border/80 bg-background/75 text-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.08)] hover:-translate-y-0.5 hover:bg-card hover:shadow-card-hover",
      },
      size: {
        default: "min-h-11 px-5 py-2",
        sm: "min-h-9 px-3.5 py-1.5",
        lg: "min-h-12 px-7 py-2.5 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
