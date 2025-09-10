import React, { useEffect, useRef } from "react";
import "./NotificationsPopover.css";

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  href?: string;
  unread?: boolean;
  createdAt?: string | Date;
};

type Props = {
  open: boolean;
  items: NotificationItem[];
  onClose: () => void;
  onViewAll?: () => void;
  anchorRef?: React.RefObject<HTMLElement>; // 👈 NEW
};

export function NotificationsPopover(props: Props): React.ReactElement | null {
  const { open, items, onClose, onViewAll, anchorRef } = props;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent): void {
      const target = e.target as Node;
      const insidePanel = !!ref.current && ref.current.contains(target);
      const insideAnchor = !!anchorRef?.current && anchorRef.current.contains(target);
      if (!insidePanel && !insideAnchor) onClose();
    }
    function onEsc(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div className="vu-popover" role="dialog" aria-label="Notifications" ref={ref}>
      <div className="vu-popover-head">
        <div className="vu-popover-title">Notifications</div>
        {onViewAll && (
          <button type="button" className="vu-link-btn" onClick={onViewAll}>
            View all
          </button>
        )}
      </div>

      <div className="vu-popover-list">
        {items.length === 0 ? (
          <div className="vu-empty">You’re all caught up.</div>
        ) : (
          items.map((n) => (
            <div key={n.id} className={`vu-note${n.unread ? " unread" : ""}`}>
              <div className="vu-dot" aria-hidden="true" />
              <div className="vu-note-content">
                <div className="vu-note-title">{n.title}</div>
                {n.body && <div className="vu-note-body">{n.body}</div>}
                {n.createdAt && (
                  <div className="vu-note-meta">
                    {typeof n.createdAt === "string"
                      ? n.createdAt
                      : new Date(n.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
              {n.href && (
                <a className="vu-note-cover" href={n.href} aria-label="Open notification" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
