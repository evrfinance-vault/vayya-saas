import React from "react";
import "./Header.css";
import { HeaderActions } from "./HeaderActions";
import { UserMenu } from "./UserMenu";
import { NotificationItem } from "./NotificationsPopover";
import { NavLink } from "react-router-dom";

type Link = { label: string; href: string; key?: string; active?: boolean };
type Props = {
  title?: string;
  navLinks?: Link[];
  renderLink?: (link: Link) => React.ReactElement;
  notifications?: NotificationItem[];
  onSearch?: () => void;
  onNotifications?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
};

export function Header(props: Props): React.ReactElement {
  const { title = "Kayya", navLinks, renderLink, ...actions } = props;

  return (
    <header className="header-bar">
      <div className="header-bar-left">
        {
          <h2 className="site-title">
            {title}
          </h2>
        }
      </div>

      <div className="header-bar-center">
        {navLinks && navLinks.length > 0 && (
          <nav className="header-nav">
            {navLinks.map(
              (l) =>
                renderLink?.(l) ?? (
                  <NavLink
                    key={l.key}
                    to={l.href}
                    end={l.href === "/"}
                    className="header-link"
                  >
                    <small>{l.label}</small>
                  </NavLink>
                ),
            )}
          </nav>
        )}
      </div>

      <div className="header-bar-right">
        <HeaderActions {...actions} />
        <UserMenu />
      </div>
    </header>
  );
}
