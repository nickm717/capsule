import { Toaster as Sonner, toast } from "sonner";
import { CircleCheck, CircleX, X } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      duration={3000}
      closeButton={false}
      offset={80}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-card !border !rounded-xl !shadow-lg !shadow-black/30 !py-3 !px-4 !flex !items-center !gap-3 !min-h-0",
          description: "!text-muted-foreground !text-sm",
          title: "!text-foreground !text-sm !font-medium",
          success:
            "!border-[hsl(176,41%,30%)]",
          error:
            "!border-[hsl(0,62%,40%)]",
        },
      }}
      icons={{
        success: <CircleCheck size={18} className="text-teal shrink-0" />,
        error: <CircleX size={18} className="text-destructive shrink-0" />,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
