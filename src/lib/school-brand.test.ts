import { describe, expect, it } from "vitest";
import { portalSchoolName, portalSchoolTagline, schoolBandFromResults } from "./school-brand";

describe("portal school branding", () => {
  it("names the secondary school", () => {
    expect(portalSchoolName("secondary")).toBe("Eckernforde Cambridge Secondary School");
    expect(portalSchoolTagline("secondary")).toBe("Cambridge Secondary School");
  });

  it("names the primary school", () => {
    expect(portalSchoolName("primary")).toBe("Eckernforde English Medium Primary School");
    expect(portalSchoolTagline("primary")).toBe("English Medium Primary School");
  });

  it("falls back to the public brand without a stage", () => {
    expect(portalSchoolName(null)).toBe("Eckernforde Schools");
  });

  it("recognizes secondary forms when result metadata lacks schoolLevel", () => {
    expect(portalSchoolName(schoolBandFromResults([{ class: { name: "Form I" } }]))).toBe("Eckernforde Cambridge Secondary School");
  });
});
