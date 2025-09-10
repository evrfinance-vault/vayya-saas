import React, { useState } from "react";
import "./HeaderActions.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faBell } from "@fortawesome/free-solid-svg-icons";
import { NotificationsPopover, NotificationItem } from "./NotificationsPopover";

type Props = {
  onSearch?: () => void;
  onNotifications?: () => void;               // click handler (optional)
  notificationsCount?: number;                // if omitted, we’ll derive from items
  notifications?: NotificationItem[];         // items to show in popover
  onViewAllNotifications?: () => void;        // footer action (optional)
  showSearch?: boolean;
  showNotifications?: boolean;
};

export function HeaderActions(props: Props): React.ReactElement {
  const {
    onSearch,
    onNotifications,
    notifications = [],
    notificationsCount,
    onViewAllNotifications,
    showSearch = true,
    showNotifications = true
  } = props;

  const unread = notifications.filter((n) => n.unread).length;
  const badgeCount = typeof notificationsCount === "number" ? notificationsCount : unread;

  const [open, setOpen] = useState(false);

  function toggle(): void {
    setOpen((v) => !v);
  }

  return (
    <div className="vu-icon-group">
      {showSearch && (
        <button
          type="button"
          className="vu-icon-btn"
          aria-label="Search"
          onClick={onSearch}
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </button>
      )}

      {showNotifications && (
        <>
          <button
            type="button"
            className="vu-icon-btn"
            aria-label={
              badgeCount > 0 ? `${badgeCount} unread notifications` : "Notifications"
            }
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              if (onNotifications) onNotifications();
              toggle();
            }}
          >
            <FontAwesomeIcon icon={faBell} />
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
          />
        </>
      )}
    </div>
  );
}
