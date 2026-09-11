import { Cloudinary } from '@cloudinary/url-gen'
import {BACKEND_BASE_URL, CLOUDINARY_CLOUD_NAME} from "@/constants";
import {fill} from "@cloudinary/url-gen/actions/resize";
import {dpr, format, quality} from "@cloudinary/url-gen/actions/delivery";
import {source} from "@cloudinary/url-gen/actions/overlay";
import {text} from "@cloudinary/url-gen/qualifiers/source";
import { TextStyle } from '@cloudinary/url-gen/qualifiers/textStyle'
import {Position} from "@cloudinary/url-gen/qualifiers/position";
import {compass} from "@cloudinary/url-gen/qualifiers/gravity";

const cld = new Cloudinary({ cloud: { cloudName: CLOUDINARY_CLOUD_NAME }});

// Passed as the Cloudinary upload widget's `uploadSignature` option. The widget
// calls this with whatever params it's about to send (folder, timestamp, source,
// ...) and expects the signature for exactly those params back — the actual
// signing (which needs the Cloudinary API secret) happens server-side.
export const signUploadParams = (
    callback: (signature: string) => void,
    paramsToSign: Record<string, string | number>
) => {
    fetch(`${BACKEND_BASE_URL}/uploads/sign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paramsToSign }),
    })
        .then((res) => res.json())
        .then((data: { signature: string }) => callback(data.signature))
        .catch((e) => console.error("Cloudinary signing failed:", e));
};

/**
 * The Cloudinary upload widget's cropper (cropping: true, the default "custom"
 * coordinates mode) uploads the *full* image and hands back an untouched
 * secure_url — the square the user drew is only reported as custom coordinates
 * on the result. Bake that rectangle into the delivery URL so every
 * <AvatarImage src={user.image}> shows the crop, not the original frame.
 *
 * `cropBox` is `result.info.coordinates.custom[0]` — `[x, y, width, height]` in
 * source pixels. When it's missing (older widget, no selection) we fall back to
 * an auto-gravity square so the result is still a usable avatar.
 */
export const applyAvatarCrop = (
    secureUrl: string,
    cropBox?: [x: number, y: number, width: number, height: number],
) => {
    const marker = "/image/upload/";
    const at = secureUrl.indexOf(marker);
    if (at === -1) return secureUrl;

    const cropStep = cropBox
        ? `c_crop,x_${Math.round(cropBox[0])},y_${Math.round(cropBox[1])},w_${Math.round(cropBox[2])},h_${Math.round(cropBox[3])}`
        : "c_fill,ar_1.0,g_auto";

    const insert = at + marker.length;
    return (
        secureUrl.slice(0, insert) +
        `${cropStep}/c_fill,w_512,h_512/f_auto,q_auto/` +
        secureUrl.slice(insert)
    );
};

export const bannerPhoto = (imageCldPubId: string, name: string) => {
    return cld
        .image(imageCldPubId)
        .resize(fill())
        .delivery(format('auto'))
        .delivery(quality('auto'))
        .delivery(dpr('auto'))
        .overlay(
            source(
                text(name, new TextStyle("roboto", 100).fontWeight("bold")).textColor(
                    "white"
                )
            ).position(
                new Position()
                    .gravity(compass("west"))
                    .offsetX(0.02)
            )
        );
}
