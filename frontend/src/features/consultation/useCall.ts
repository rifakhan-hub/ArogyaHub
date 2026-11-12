import { useEffect, useState } from "react";
import { joinCall } from "@/api/appointments";
import { type ApiError, toApiError } from "@/api/client";
import type { CallInfo } from "@/api/types";

const WAIT_MS = 5000;

export function useCall(appointmentId: string, enabled: boolean) {
  const [call, setCall] = useState<CallInfo>();
  const [error, setError] = useState<ApiError>();

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      try {
        const info = await joinCall(appointmentId);
        if (stopped) return;
        setCall(info);
        setError(undefined);
        if (info.waiting) timer = setTimeout(check, WAIT_MS);
      } catch (err) {
        if (!stopped) setError(toApiError(err));
      }
    }

    check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [appointmentId, enabled]);

  return { call: enabled ? call : undefined, error: enabled ? error : undefined };
}
