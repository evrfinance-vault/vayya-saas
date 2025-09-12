import { useEffect, useRef } from "react";

export function useDocumentTitle(title: string): void {
  const prev = useRef<string>(typeof document !== "undefined" ? document.title : "");
  useEffect(() => {
    const old = prev.current;
    if (typeof document !== "undefined") document.title = title;
    return () => {
      if (typeof document !== "undefined") document.title = old;
    };
  }, [title]);
}
