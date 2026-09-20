import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import FamilyWorkspace from "./family-workspace";
vi.mock("@/components/dashboard/academic-progress",()=>({AcademicProgress:()=>null}));
vi.mock("@/components/dashboard/dashboard-greeting",()=>({DashboardGreeting:()=>null}));
vi.mock("@/components/dashboard/upcoming-events",()=>({UpcomingEvents:()=>null}));
vi.mock("@/components/dashboard/recent-activity",()=>({RecentActivity:()=>null}));
vi.mock("@/hooks/use-api-query",()=>({useApiQuery:()=>({data:{data:[
  {id:"one",name:"Amina",profile:null,enrolledClasses:[],grades:[],attendanceSummary:{rate:90,present:9,total:10}},
  {id:"two",name:"Juma",profile:null,enrolledClasses:[],grades:[],attendanceSummary:{rate:80,present:8,total:10}},
]},isLoading:false,isError:false})}));
afterEach(cleanup);
it("switches the displayed attendance when the parent selects another child",()=>{
  render(<MemoryRouter><FamilyWorkspace /></MemoryRouter>);
  expect(screen.getAllByText("90%").length).toBeGreaterThan(0);
  fireEvent.change(screen.getByLabelText("Viewing records for"),{target:{value:"two"}});
  expect(screen.getAllByText("80%").length).toBeGreaterThan(0);
  expect(screen.queryAllByText("90%")).toHaveLength(0);
  expect(screen.getByRole("heading",{name:"Juma"})).toBeTruthy();
});
