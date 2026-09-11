import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

import { RequireRole } from "@/components/layout/require-role";
import { UserRole } from "@/types";

// RequireRole's only external input is Refine's useGetIdentity — stub the module
// so each test decides directly who (if anyone) is signed in.
vi.mock("@refinedev/core", () => ({ useGetIdentity: vi.fn() }));
import { useGetIdentity } from "@refinedev/core";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function signedInAs(role: UserRole | null, opts: { loading?: boolean } = {}) {
  vi.mocked(useGetIdentity).mockReturnValue({
    data: role ? { role } : undefined,
    isLoading: opts.loading ?? false,
  } as unknown as ReturnType<typeof useGetIdentity>);
}

function renderGuardedRoute(roles: UserRole[]) {
  return render(
    <MemoryRouter initialEntries={["/restricted"]}>
      <Routes>
        <Route
          path="/restricted"
          element={
            <RequireRole roles={roles}>
              <div>secret content</div>
            </RequireRole>
          }
        />
        <Route path="/unauthorized" element={<div>unauthorized screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const seesSecret = () => screen.queryByText("secret content") !== null;
const redirected = () => screen.queryByText("unauthorized screen") !== null;

const ADMIN_ONLY = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
const STAFF = [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
const ALL_ROLES = [
  UserRole.STUDENT,
  UserRole.TEACHER,
  UserRole.PARENT,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

describe("RequireRole", () => {
  it("renders neither the content nor a redirect while identity is still loading", () => {
    signedInAs(null, { loading: true });
    renderGuardedRoute(ADMIN_ONLY);

    expect(seesSecret()).toBe(false);
    expect(redirected()).toBe(false);
  });

  it("renders children when the user's role is in the allowed list", () => {
    signedInAs(UserRole.ADMIN);
    renderGuardedRoute(ADMIN_ONLY);

    expect(seesSecret()).toBe(true);
    expect(redirected()).toBe(false);
  });

  it("redirects to /unauthorized for a signed-in user whose role is not allowed", () => {
    for (const role of [UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT]) {
      cleanup();
      signedInAs(role);
      renderGuardedRoute(ADMIN_ONLY);

      expect(redirected()).toBe(true);
      expect(seesSecret()).toBe(false);
    }
  });

  it("redirects when there is no identity at all", () => {
    signedInAs(null);
    renderGuardedRoute(ADMIN_ONLY);

    expect(redirected()).toBe(true);
    expect(seesSecret()).toBe(false);
  });

  it("treats roles as a flat allowlist — a super_admin is not implicitly an admin", () => {
    signedInAs(UserRole.SUPER_ADMIN);
    renderGuardedRoute([UserRole.ADMIN]);

    expect(seesSecret()).toBe(false);
    expect(redirected()).toBe(true);
  });

  it("admits every listed role on a multi-role (staff) route and rejects the rest", () => {
    for (const role of [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN]) {
      cleanup();
      signedInAs(role);
      renderGuardedRoute(STAFF);
      expect(seesSecret()).toBe(true);
    }

    for (const role of [UserRole.STUDENT, UserRole.PARENT]) {
      cleanup();
      signedInAs(role);
      renderGuardedRoute(STAFF);
      expect(redirected()).toBe(true);
    }
  });

  it("lets a parent through a parent-inclusive route", () => {
    signedInAs(UserRole.PARENT);
    renderGuardedRoute([UserRole.PARENT, ...ADMIN_ONLY]);

    expect(seesSecret()).toBe(true);
  });

  it("for an admin-only route, exactly one of the five roles is admitted", () => {
    const admitted: UserRole[] = [];
    for (const role of ALL_ROLES) {
      cleanup();
      signedInAs(role);
      renderGuardedRoute([UserRole.ADMIN]);
      if (seesSecret()) admitted.push(role);
    }

    expect(admitted).toEqual([UserRole.ADMIN]);
  });
});
