import React, { useRef, useState } from "react";
import "./HeaderActions.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import { NotificationsPopover, NotificationItem } from "./NotificationsPopover";

export function HeaderActions(props: {
  onSearch?: () => void;
  onNotifications?: () => void;
  notificationsCount?: number;
  notifications?: NotificationItem[];
  onViewAllNotifications?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
}): React.ReactElement {
  const {
    onSearch,
    onNotifications,
    notifications = [],
    notificationsCount,
    onViewAllNotifications,
    showSearch = true,
    showNotifications = true,
  } = props;

  const unread = notifications.filter((n) => n.unread).length;
  const badgeCount =
    typeof notificationsCount === "number" ? notificationsCount : unread;

  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="vu-icon-group">
      {showSearch && (
        <button
          type="button"
          className="vu-icon-btn"
          aria-label="Search"
          onClick={onSearch}
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} size="2x" />
        </button>
      )}

      {showNotifications && (
        <div className="vu-note-anchor" ref={anchorRef}>
          <button
            type="button"
            className="vu-icon-btn"
            aria-label={
              badgeCount > 0
                ? `${badgeCount} unread notifications`
                : "Notifications"
            }
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              if (onNotifications) onNotifications();
              setOpen((v) => !v);
            }}
          >
            <FontAwesomeIcon icon={faBell} size="2x" />
            {badgeCount > 0 && (
              <span className="vu-badge" aria-hidden="true">
                {badgeCount}
              </span>
            )}
          </button>

          <NotificationsPopover
            open={open}
            items={notifications}
            onClose={() => setOpen(false)}
            onViewAll={onViewAllNotifications}
            anchorRef={anchorRef}
          />
        </div>
      )}
    </div>
  );
}
