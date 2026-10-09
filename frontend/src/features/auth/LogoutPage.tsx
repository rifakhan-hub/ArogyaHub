import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

export function LogoutPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    signOut().then(() => navigate("/", { replace: true }));
  }, [signOut, navigate]);

  return <Spinner fullScreen />;
}
