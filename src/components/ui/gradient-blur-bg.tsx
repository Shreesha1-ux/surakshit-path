import { cn } from "@/lib/utils";
import React from "react";

interface GradientBlurBgProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const GradientBlurBackground = ({ children, className, ...props }: GradientBlurBgProps) => {
  return (
    <div className={cn("min-h-screen w-full bg-black text-[#F7F9F9] relative overflow-hidden", className)} {...props}>
      {/* Grid + Left & Right Twitter Glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(47, 51, 54, 0.45) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(47, 51, 54, 0.45) 1px, transparent 1px),
            radial-gradient(circle 600px at 0% 200px, rgba(29, 155, 240, 0.12), transparent),
            radial-gradient(circle 600px at 100% 200px, rgba(29, 155, 240, 0.12), transparent)
          `,
          backgroundSize: `
            96px 64px,  
            96px 64px,  
            100% 100%,  
            100% 100%  
          `,
        }}
      />
      {/* Content Wrapper */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
