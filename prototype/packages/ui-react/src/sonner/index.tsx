import { CheckIcon, InfoIcon, Loader2Icon, OctagonAlertIcon, TriangleAlertIcon } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps, toast } from 'sonner';

const Toaster = (props: ToasterProps) => (
  <Sonner
    position="bottom-right"
    visibleToasts={3}
    closeButton
    icons={{
      success: <CheckIcon strokeWidth={2.5} />,
      info: <InfoIcon strokeWidth={2} />,
      warning: <TriangleAlertIcon strokeWidth={2} />,
      error: <OctagonAlertIcon strokeWidth={2.5} />,
      loading: <Loader2Icon className="animate-spin" strokeWidth={2} />,
    }}
    toastOptions={{ classNames: { toast: 'toast-glass' } }}
    {...props}
  />
);

export { Toaster, toast };
