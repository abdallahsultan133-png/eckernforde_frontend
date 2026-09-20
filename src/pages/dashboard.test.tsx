import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { useGetIdentity } from "@refinedev/core";
import Dashboard from "./dashboard";
vi.mock("@refinedev/core",()=>({useGetIdentity:vi.fn()}));
vi.mock("./dashboard/school-workspace",()=>({default:({role}:{role:string})=><p>{role} workspace</p>}));
vi.mock("./dashboard/family-workspace",()=>({default:()=><p>parent workspace</p>}));
afterEach(cleanup);
it.each(["student","teacher","parent","admin","super_admin"])("selects the %s workspace",role=>{
  vi.mocked(useGetIdentity).mockReturnValue({data:{role},isLoading:false} as unknown as ReturnType<typeof useGetIdentity>);
  render(<Dashboard />);
  expect(screen.getByText(`${role} workspace`)).toBeTruthy();
});
it("does not show an administrator workspace without an identity",()=>{
  vi.mocked(useGetIdentity).mockReturnValue({data:undefined,isLoading:false} as unknown as ReturnType<typeof useGetIdentity>);
  render(<Dashboard />);
  expect(screen.queryByText("admin workspace")).toBeNull();
});
