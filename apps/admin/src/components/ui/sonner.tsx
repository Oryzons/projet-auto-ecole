"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleAlert,
  CircleCheck,
  Info,
  Loader2,
  TriangleAlert,
} from "lucide-react";

const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      gap={10}
      offset={{ top: 76, right: 20 }}
      mobileOffset={{ top: 12, left: 12, right: 12 }}
      visibleToasts={4}
      icons={{
        success: <CircleCheck className="size-[18px] text-success" />,
        info: <Info className="size-[18px] text-primary" />,
        warning: <TriangleAlert className="size-[18px] text-warning" />,
        error: <CircleAlert className="size-[18px] text-danger" />,
        loading: <Loader2 className="size-[18px] animate-spin text-primary" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border !border-border !bg-card !text-foreground !shadow-float !gap-3 !px-4 !py-3.5 font-sans",
          title: "!text-[13.5px] !font-semibold !text-foreground",
          description: "!text-[12.5px] !leading-relaxed !text-muted-foreground",
          actionButton:
            "!h-7 !rounded-lg !bg-primary-soft !px-2.5 !text-xs !font-semibold !text-primary-strong",
          closeButton: "!border-border !bg-card",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
