import { Toaster } from "sonner";
import { AuthProvider } from "@/store/AuthContext";

/** Wraps the whole app: who is signed in, and the pop-up messages ("toasts") in the corner. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="bottom-left"
        closeButton
        toastOptions={{
          classNames: {
            toast: "!rounded-lg !border !border-border !bg-surface !text-text !shadow-2 !font-sans !text-small",
            success: "[&_[data-icon]]:!text-success",
            error: "[&_[data-icon]]:!text-danger",
            closeButton: "!bg-surface !border-border !text-subtle",
          },
        }}
      />
    </AuthProvider>
  );
}
