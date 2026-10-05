import { useEffect, useState } from "react";
import { api, ApiError, toApiError } from "@/api/client";

const DATA_CHANGED = "aarogyahub:data-changed";

export function refreshData() {
  window.dispatchEvent(new Event(DATA_CHANGED));
}

type Params = Record<string, string | number | undefined>;

export function useApi<T>(url: string | null, params?: Params) {
  const [result, setResult] = useState<{ key: string; data?: T; error?: ApiError }>();
  const [version, setVersion] = useState(0);
  const query = JSON.stringify(params ?? {});
  const key = `${url}?${query}#${version}`;

  useEffect(() => {
    if (!url) return;
    const requestKey = `${url}?${query}#${version}`;
    let ignore = false;
    const cleanParams = Object.fromEntries(Object.entries(JSON.parse(query)).filter(([, v]) => v !== "" && v != null));
    api
      .get<T>(url, { params: cleanParams })
      .then((res) => !ignore && setResult({ key: requestKey, data: res.data }))
      .catch((err) => !ignore && setResult({ key: requestKey, error: toApiError(err) }));
    return () => {
      ignore = true;
    };
  }, [url, query, version]);

  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    window.addEventListener(DATA_CHANGED, onChange);
    return () => window.removeEventListener(DATA_CHANGED, onChange);
  }, []);

  const loading = url !== null && result?.key !== key;
  return {
    data: result?.data,
    loading,
    error: loading ? undefined : result?.error,
    reload: () => setVersion((v) => v + 1),
  };
}
