import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      offset={20}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group !rounded-2xl !border !backdrop-blur-xl !text-white !text-xs !font-medium !shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]",
          title: "!text-white !font-semibold !tracking-tight",
          description: "!text-white/60 !text-[11px]",
          icon: "!text-[var(--cat-lime)]",
          success: "!border-[rgba(216,255,61,0.3)] !bg-[linear-gradient(180deg,#161922,#11141C)]",
          error: "!border-[rgba(239,68,68,0.35)] !bg-[linear-gradient(180deg,#1a1419,#11141C)]",
          info: "!border-[rgba(229,178,66,0.3)] !bg-[linear-gradient(180deg,#1a1814,#11141C)]",
          warning: "!border-[rgba(229,178,66,0.35)] !bg-[linear-gradient(180deg,#1a1814,#11141C)]",
          actionButton:
            "!bg-[var(--cat-lime)] !text-black !font-bold !rounded-lg !px-3 !py-1.5 !text-[11px]",
          cancelButton:
            "!bg-white/5 !text-white/70 !rounded-lg !px-3 !py-1.5 !text-[11px] !border !border-white/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
