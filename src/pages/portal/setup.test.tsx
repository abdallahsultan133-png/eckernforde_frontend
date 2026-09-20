import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import PortalSetup from "./setup";

vi.mock("@refinedev/core", () => ({ useGetIdentity: () => ({ data: { id: "student-1", role: "student" } }) }));
vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: () => ({
    data: { data: {
      setupRequired: true,
      academicYear: { id: 8, name: "2026/2027", startsOn: "2026-01-01", endsOn: "2026-12-31" },
      stages: ["standard_i"],
    } },
    isLoading: false, isFetching: false, isError: false, refetch: vi.fn(),
  }),
}));
vi.mock("@/components/layout/page-header.tsx", () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));

afterEach(cleanup);

it("limits an enrolled student to the school stage assigned to them", () => {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={["/portal/setup"]}><PortalSetup /></MemoryRouter></QueryClientProvider>);
  fireEvent.click(screen.getByRole("button", { name: /Primary school/i }));

  for (const label of ["Nursery", "Kindergarten", "Standard I", "Standard II", "Standard III", "Standard IV", "Standard V", "Standard VI", "Standard VII"]) {
    expect(screen.getByText(label)).toBeTruthy();
  }
  expect(screen.getByText("Nursery").closest("button")?.hasAttribute("disabled")).toBe(true);
  expect(screen.getByText("Standard I").closest("button")?.hasAttribute("disabled")).toBe(false);
  expect(screen.getByText("Standard II").closest("button")?.hasAttribute("disabled")).toBe(true);
  expect(screen.queryByRole("combobox", { name: "Academic year" })).toBeNull();

  fireEvent.click(screen.getByText("Standard I"));
  expect(screen.getByRole("combobox", { name: "Academic year" })).toBeTruthy();
});

it("does not let an enrolled primary student select a secondary form", () => {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={["/portal/setup"]}><PortalSetup /></MemoryRouter></QueryClientProvider>);
  fireEvent.click(screen.getByRole("button", { name: /Secondary school/i }));
  expect(screen.getByRole("status").textContent).toContain("assigned to you");
  for (const label of ["Form I", "Form II", "Form III", "Form IV"]) {
    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText(label).closest("button")?.hasAttribute("disabled")).toBe(true);
  }
});
