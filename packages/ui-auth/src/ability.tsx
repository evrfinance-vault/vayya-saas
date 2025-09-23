import React from "react";
import { Ability, AbilityBuilder, AbilityClass } from "@casl/ability";
import { createContextualCan } from "@casl/react";

export type Actions = "manage" | "read" | "create" | "update" | "delete";
export type Subjects = "all" | "application" | "customer" | "paymentPlan" | "report";
export type AppAbility = Ability<[Actions, Subjects]>;

export function abilityForRole(role: string) {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    Ability as AbilityClass<AppAbility>
  );

  if (role === "admin") {
    can("manage", "all");
  } else if (role === "owner") {
    can("read", "report");
    can("manage", "customer");
  } else if (role === "borrower") {
    can("read", "application");
  } else {
    cannot("manage", "all");
  }

  return build({
    detectSubjectType: (o) => o as any,
  });
}

export const AbilityContext = React.createContext<AppAbility>(abilityForRole("guest"));

export const AbilityProvider: React.FC<
  { ability: AppAbility; children: React.ReactNode }
> = ({ ability, children }) => (
  <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>
);

export const Can = createContextualCan<AppAbility>(AbilityContext.Consumer);
