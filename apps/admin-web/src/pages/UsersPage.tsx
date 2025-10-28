import React from "react";
import { useSearchParams } from "react-router-dom";
import PageTabs, { type TabDefinition } from "../components/PageTabs";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import "./AbstractPage.css";
import "./UsersPage.css";
import UsersPanel from "../components/panels/UsersPanel";

export type UsersTabKey = "users";

export default function UsersPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = (searchParams.get("tab") as UsersTabKey) || "users";
  const [tab, setTab] = React.useState<UsersTabKey>(defaultTab);

  const tabs: TabDefinition[] = [
    { key: "users" as any, icon: faUsers, label: "Manage Users" },
  ];

  React.useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        return next;
      },
      { replace: true },
    );
  }, [tab, setSearchParams]);

  React.useEffect(() => {
    const next = (searchParams.get("tab") as UsersTabKey) || "users";
    setTab(next);
  }, [setTab, searchParams]);

  return (
    <div className="page-content">
      <div className="hero-content">
        <div className="preheading">Manage</div>
        <h1 className="heading">Users</h1>
        <p className="hero-blurb">
          View, manage, and edit small business owners and borrower accounts.
        </p>
      </div>
      <div className="users-page">
        <PageTabs
          tabs={tabs}
          value={tab as any}
          onChange={(k) => setTab(k as UsersTabKey)}
        />
        <div
          key={tab}
          id={`panel-${tab}`}
          role="tabpanel"
          className="page-panels page-tab-change"
        >
          {tab === "users" && <UsersPanel />}
        </div>
      </div>
    </div>
  );
}
