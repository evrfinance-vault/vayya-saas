import React, { useEffect, useRef, useState } from "react";
import "./UserMenu.css";
import { useAuth0 } from "@auth0/auth0-react";
import { useRole } from "./useRole";
import Gravatar from "react-gravatar";
import { NavLink } from "react-router-dom";

export function UserMenu(): React.ReactElement {
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
        <Gravatar className="gravatar" email={user?.email as string} />
      </button>

      {open && (
        <div className="vu-menu" role="menu">
          <div className="vu-menu-header">
            <div className="vu-menu-name">{name}</div>
            {role && <div className="vu-menu-role">{role}</div>}
          </div>
          <div className="vu-sep" />
          <NavLink
            key="discovery"
            to="/settings?tab=discovery"
            end={false}
            className="vu-item-link"
            onClick={() => setOpen(false)}
          >
            Discovery Profile
          </NavLink>
          <NavLink
            key="settings"
            to="/settings?tab=settings"
            end={false}
            className="vu-item-link"
            onClick={() => setOpen(false)}
          >
            Settings
          </NavLink>
          <div className="vu-sep" />
          <button
            type="button"
            className="vu-item-button"
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
