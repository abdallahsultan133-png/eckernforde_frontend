import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import SelectedStudentsPage from "./selected-students";

const requestedPaths = vi.hoisted(() => [] as Array<string | null>);
const studentsFixture = vi.hoisted(() => [{
  id: "student-1",
  name: "Amina",
  email: "amina@school.test",
  image: null,
  role: "student",
}]);

vi.mock("@/hooks/use-api-query.ts", () => ({
  useApiQuery: (path: string | null) => {
    requestedPaths.push(path);
    if (path === "/grades/academic-years") {
      return { data: { data: [{ id: 7, name: "2026" }] }, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() };
    }
    return { data: { data: studentsFixture, pagination: { page: 1, limit: 500, total: studentsFixture.length, totalPages: 1 } }, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() };
  },
}));

function renderStudents() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/students/selected?schoolLevel=primary&stage=standard_i&academicYearId=7"]}>
        <SelectedStudentsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  requestedPaths.length = 0;
  vi.unstubAllGlobals();
});

it("searches students by name or email within the selected class and year", async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/students/selected?schoolLevel=primary&stage=standard_i&academicYearId=7&page=2"]}>
        <SelectedStudentsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  fireEvent.change(screen.getByRole("textbox", { name: "Search students by name or email" }), { target: { value: "amina" } });

  await waitFor(() => {
    expect(requestedPaths.some((path) => path?.includes("search=amina") && path.includes("page=1"))).toBe(true);
  });
});

it("lets a super admin change a listed student's role", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { role: "teacher" } }) });
  vi.stubGlobal("fetch", fetchMock);
  renderStudents();

  fireEvent.click(screen.getByRole("combobox", { name: "Change role for Amina" }));
  fireEvent.click(screen.getByRole("option", { name: "Teacher" }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/users/student-1/role"),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ role: "teacher" }) }),
    );
  });
});
