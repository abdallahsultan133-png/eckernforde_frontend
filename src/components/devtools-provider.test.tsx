import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

import Devtools from "./devtools-provider";

vi.mock("@refinedev/devtools", () => ({
  DevtoolsProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="devtools-provider">{children}</div>
  ),
  DevtoolsPanel: () => <div data-testid="devtools-panel" />,
}));

afterEach(cleanup);

describe("Devtools", () => {
  it("does not render the development panel on public pages", () => {
    render(
      <MemoryRouter initialEntries={["/academics/primary"]}>
        <Devtools>Public page</Devtools>
      </MemoryRouter>
    );

    expect(screen.getByText("Public page")).toBeTruthy();
    expect(screen.queryByTestId("devtools-panel")).toBeNull();
    expect(screen.queryByTestId("devtools-provider")).toBeNull();
  });

  it("keeps the development panel available in the portal", () => {
    render(
      <MemoryRouter initialEntries={["/portal"]}>
        <Devtools>Portal page</Devtools>
      </MemoryRouter>
    );

    expect(screen.getByText("Portal page")).toBeTruthy();
    expect(screen.getByTestId("devtools-panel")).toBeTruthy();
    expect(screen.getByTestId("devtools-provider")).toBeTruthy();
  });
});
