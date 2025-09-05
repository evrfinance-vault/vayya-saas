import { AbilityBuilder, Ability } from "@casl/ability";
import { createContextualCan } from "@casl/react";

export type AppActions = "manage" | "create" | "read" | "update" | "delete";
export type AppSubjects = "all" | "Loan" | "Payment" | "User";

export type AppAbility = Ability<[AppActions, AppSubjects]>;

export function buildAbilityForRole(
  _role: "owner" | "borrower" | "admin",
): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(Ability as any);
  can("manage", "all");
  return build({ detectSubjectType: (obj) => (obj as any).__type });
}

export const Can = createContextualCan<AppAbility>();
