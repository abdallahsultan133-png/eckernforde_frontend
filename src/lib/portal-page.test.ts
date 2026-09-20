import { describe, expect, it } from "vitest";
import { portalPage } from "./portal-page";

describe("portal page context", () => {
  it("uses specific academic routes before their parent", () => {
    expect(portalPage("/grades/term-results/record").title).toBe("Record results");
    expect(portalPage("/grades/report-card/student-1").title).toBe("Report cards");
    expect(portalPage("/grades").title).toBe("Assignment Grade Book");
  });
  it("recognizes administrative and family pages outside Refine resources", () => {
    expect(portalPage("/admin/publish-results").title).toBe("Publish results");
    expect(portalPage("/parent").title).toBe("Family records");
  });
  it("distinguishes the student directory from an individual record", () => {
    expect(portalPage("/students").title).toBe("Students");
    expect(portalPage("/students/student-1").title).toBe("Student profile");
    expect(portalPage("/teachers").title).toBe("Teachers");
  });
  it("keeps portal history distinct from the dashboard", () => {
    expect(portalPage("/portal/history").title).toBe("Academic history");
    expect(portalPage("/portal/history/year-1").title).toBe("Academic history");
    expect(portalPage("/portal").title).toBe("Dashboard");
  });
  it("does not falsely identify unknown routes as a dashboard or prefix match", () => {
    expect(portalPage("/classes-unknown").title).toBe("School portal");
    expect(portalPage("/missing").title).toBe("School portal");
  });
});
