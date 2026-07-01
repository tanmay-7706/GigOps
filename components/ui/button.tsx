import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-bold tracking-wide outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-clay-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-clay-canvas active:scale-[0.94] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "rounded-[20px] bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white shadow-clayButton hover:-translate-y-1 hover:shadow-clayButtonHover active:shadow-clayPressed",
        secondary:
          "rounded-[20px] bg-clay-card text-clay-fg shadow-clayButton backdrop-blur-xl hover:-translate-y-1 hover:shadow-clayButtonHover active:shadow-clayPressed",
        destructive:
          "rounded-[20px] bg-gradient-to-br from-[#F87171] to-[#EF4444] text-white shadow-clayButton hover:-translate-y-1 hover:shadow-clayButtonHover active:shadow-clayPressed",
        outline:
          "rounded-[20px] border-2 border-clay-accent/25 bg-transparent text-clay-accent hover:-translate-y-1 hover:border-clay-accent hover:bg-clay-accent/5",
        ghost:
          "rounded-[20px] text-clay-fg hover:bg-clay-accent/10 hover:text-clay-accent",
        link: "text-clay-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-11 gap-1.5 px-5 text-sm",
        default: "h-14 gap-2 px-7",
        lg: "h-16 gap-2.5 px-8 text-lg",
        icon: "size-14 rounded-[20px]",
        "icon-sm": "size-11 rounded-[18px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
