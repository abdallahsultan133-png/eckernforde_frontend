import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGetIdentity } from "@refinedev/core";
import { Breadcrumb, PortalBreadcrumbProvider } from "@/components/layout/breadcrumb.tsx";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { UserRole } from "@/types";
import UsersList, { UsersFound } from "./list.tsx";

vi.mock("@refinedev/core", () => ({ useGetIdentity: vi.fn() }));
vi.mock("@/hooks/use-api-query.ts", () => ({ useApiQuery: vi.fn() }));
vi.mock("@/hooks/use-download.ts", () => ({ useDownload: () => ({ download: vi.fn() }) }));

const yearsResponse = {
  data: { data: [{ id: 7, name: "2026", active: true }] },
  isLoading: false,
  isFetching: false,
  isError: false,
  refetch: vi.fn(),
};

function renderDirectory(path: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <UsersList />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderFoundDirectory(path: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <PortalBreadcrumbProvider>
          <Breadcrumb global />
          <UsersFound />
        </PortalBreadcrumbProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("super-admin user directories", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGetIdentity).mockReturnValue({
      data: { id: "admin-1", name: "Admin", email: "admin@school.test", role: UserRole.SUPER_ADMIN },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetIdentity>);
    vi.mocked(useApiQuery).mockImplementation((path) => {
      if (path === "/grades/academic-years") return yearsResponse as never;
      if (path?.startsWith("/users/students?")) return {
        data: { data: [{ id: "student-1", name: "Sam Student", email: "sam@school.test", image: null, role: UserRole.STUDENT }] },
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch: vi.fn(),
      } as never;
      return {
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch: vi.fn(),
      } as never;
    });
  });

  it.each([
    ["/students", "Students"],
    ["/teachers", "Teachers"],
    ["/guardians", "Parents & guardians"],
  ])("uses the school, class/form, and year selection flow for %s", (path, title) => {
    renderDirectory(path);

    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    expect(screen.getByText("1. Choose a school")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "3. Academic year" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Eckernforde English Medium Primary School/ }));
    expect(screen.getByText("2. Choose a class")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Class I" }));
    expect(screen.getByRole("combobox", { name: "3. Academic year" })).toBeTruthy();
  });

  it("shows scoped students in the same results view as teachers and parents", () => {
    renderFoundDirectory("/students/found?schoolLevel=primary&stage=standard_i&academicYearId=7");

    expect(screen.getByRole("heading", { name: "Students found" })).toBeTruthy();
    expect(screen.getByText("Sam Student")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Change selection" })).toBeTruthy();
    expect(screen.getByText("Role")).toBeTruthy();
    expect(screen.getByRole("combobox")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Students" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Back to Students" })).toBeNull();
    expect(screen.getByText("Class I Students")).toBeTruthy();
  });
});
