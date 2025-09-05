// packages/ui-auth/src/timeOfDay.ts
export type Greeting = "Good morning" | "Good afternoon" | "Good evening";

export function getGreeting(d: Date = new Date()): Greeting {
  const h = d.getHours(); // local time on the user's device
  if (h >= 2 && h < 12) return "Good morning"; // 02:00–11:59
  if (h >= 12 && h < 17) return "Good afternoon"; // 12:00–16:59
  return "Good evening"; // 17:00–01:59
}

/**
 * React hook that updates right when the greeting should change.
 */
import { useEffect, useState } from "react";
export function useGreeting(): Greeting {
  const [greeting, setGreeting] = useState<Greeting>(() => getGreeting());

  useEffect(() => {
    function msUntilNextBoundary(now: Date) {
      const h = now.getHours();
      const boundaries = [2, 12, 17]; // hours (local)
      // find the next boundary today or tomorrow
      let next = new Date(now);
      next.setMinutes(0, 0, 0);
      let targetHour = boundaries.find((b) => h < b) ?? 2; // if past 17, next is 02:00 next day
      next.setHours(targetHour);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next.getTime() - now.getTime();
    }

    const now = new Date();
    const initialDelay = msUntilNextBoundary(now);
    const t1 = setTimeout(() => {
      setGreeting(getGreeting());
      // after we flip once at the boundary, update hourly just in case
      const t2 = setInterval(() => setGreeting(getGreeting()), 60 * 60 * 1000);
      return () => clearInterval(t2);
    }, initialDelay);

    return () => clearTimeout(t1);
  }, []);

  return greeting;
}

// returns "dd.MM.yyyy" like "05.09.2025"
export function formatDate(d: Date = new Date()): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/**
 * React hook that returns today's date string and updates itself at local midnight.
 */
export function useDateStamp(): string {
  const [stamp, setStamp] = useState<string>(() => formatDate());

  useEffect(() => {
    function scheduleNextFlip() {
      const now = new Date();
      const next = new Date(now);
      // midnight tonight (local time)
      next.setHours(24, 0, 0, 0);
      const delay = next.getTime() - now.getTime();
      const t = setTimeout(() => {
        setStamp(formatDate());
        scheduleNextFlip(); // re-schedule for the following midnight
      }, delay);
      return t;
    }
    const timer = scheduleNextFlip();
    return () => clearTimeout(timer);
  }, []);

  return stamp;
}
