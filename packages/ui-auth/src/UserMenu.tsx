import React, { useEffect, useRef, useState } from "react";
import "./UserMenu.css";
import { useAuth0 } from "@auth0/auth0-react";
import { useRole } from "./useRole";

function initialsFrom(nameOrEmail: string | undefined): string {
  if (!nameOrEmail) return "U";
  const s = nameOrEmail.trim();
  const at = s.indexOf("@");
  const base = at > 0 ? s.slice(0, at) : s;
  const parts = base.split(/[.\s_-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

export function UserMenu(): JSX.Element {
  const { user, logout } = useAuth0();
  const role = useRole();
  const name = (user?.name as string) || (user?.email as string) || "User";

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent): void {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="vu-user-menu" ref={ref}>
      <button
        type="button"
        className="vu-user-button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="vu-avatar">{initialsFrom(user?.name || user?.email)}</span>
        <span className="vu-user-label">
          <span className="vu-user-name">{name}</span>
          <span className="vu-user-role">{role || "—"}</span>
        </span>
        <svg
          className={`vu-caret${open ? " open" : ""}`}
          width="16"
          height="16"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M5.25 7.75L10 12.5l4.75-4.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <div className="vu-menu" role="menu">
          <div className="vu-menu-header">
            <div className="vu-menu-name">{name}</div>
            {role && <div className="vu-menu-role">{role}</div>}
          </div>
          <div className="vu-sep" />
          <button
            type="button"
            className="vu-item"
            role="menuitem"
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
