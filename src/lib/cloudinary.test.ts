import { describe, expect, it } from "vitest";

import { applyAvatarCrop } from "./cloudinary";

const SECURE_URL =
    "https://res.cloudinary.com/demo/image/upload/v1699999999/uploads/avatars/abc123.jpg";

describe("applyAvatarCrop", () => {
    it("bakes the widget's crop rectangle into the delivery URL", () => {
        expect(applyAvatarCrop(SECURE_URL, [10, 20, 300, 300])).toBe(
            "https://res.cloudinary.com/demo/image/upload/" +
                "c_crop,x_10,y_20,w_300,h_300/c_fill,w_512,h_512/f_auto,q_auto/" +
                "v1699999999/uploads/avatars/abc123.jpg",
        );
    });

    it("rounds sub-pixel coordinates the widget can emit", () => {
        expect(applyAvatarCrop(SECURE_URL, [10.4, 20.6, 299.5, 299.5])).toContain(
            "c_crop,x_10,y_21,w_300,h_300/",
        );
    });

    it("falls back to an auto-gravity square when no crop was drawn", () => {
        expect(applyAvatarCrop(SECURE_URL)).toBe(
            "https://res.cloudinary.com/demo/image/upload/" +
                "c_fill,ar_1.0,g_auto/c_fill,w_512,h_512/f_auto,q_auto/" +
                "v1699999999/uploads/avatars/abc123.jpg",
        );
    });

    it("leaves a non-Cloudinary URL untouched", () => {
        expect(applyAvatarCrop("https://example.com/pic.jpg", [0, 0, 10, 10])).toBe(
            "https://example.com/pic.jpg",
        );
    });
});
