import {useEffect, useRef, useState} from 'react'
import {UploadWidgetValue} from "@/types";
import {UploadCloud} from "lucide-react";
import {CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME} from "@/constants";
import {signUploadParams} from "@/lib/cloudinary.ts";
import { loadCloudinaryWidget } from "@/lib/load-cloudinary-widget";

type UploadWidgetProps = {
    value?: {
        url: string;
        publicId: string;
    } | null;
    onChange: (value: { url: string; publicId: string } | null) => void;
    disabled?: boolean;
};

const UploadWidget = ({ value = null, onChange, disabled = false }: UploadWidgetProps) => {
    const widgetRef = useRef<CloudinaryWidget | null>(null)
    const onChangeRef = useRef(onChange);

    const [preview, setPreview] = useState<UploadWidgetValue | null>(value);

    useEffect(() => {
        setPreview(value);
    }, [value])

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if(typeof window === 'undefined') return;

        const initializeWidget = () => {
            if(!window.cloudinary || widgetRef.current) return false;

            widgetRef.current = window.cloudinary.createUploadWidget({
                cloudName: CLOUDINARY_CLOUD_NAME,
                apiKey: CLOUDINARY_API_KEY,
                uploadSignature: signUploadParams,
                multiple: false,
                folder: 'uploads/banners',
                maxFileSize: 5000000,
                clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp']
            }, (error, result) => {
                if(!error && result.event === 'success') {
                    const payload: UploadWidgetValue = {
                        url: result.info.secure_url,
                        publicId: result.info.public_id,
                    }

                    setPreview(payload);

                    onChangeRef.current?.(payload)
                }
            });

            return true;
        }

        let cancelled = false;
        void loadCloudinaryWidget().then(() => {
            if (!cancelled) initializeWidget();
        }).catch((error) => console.warn("Upload widget unavailable:", error));
        return () => { cancelled = true; };
    }, []);

    const openWidget = () => {
        if(!disabled) widgetRef.current?.open();
    }

    return (
        <div className="space-y-2">
            {preview ? (
                <div className="upload-preview">
                    <img src={preview.url} alt="Uploaded file" />
                </div>
            ): <div className="upload-dropzone" role="button" tabIndex={0}
                    onClick={openWidget} onKeyDown={(event) => {
                if(event.key === 'Enter') {
                    event.preventDefault();
                    openWidget();
                }
            }}
            >
                <div className="upload-prompt">
                    <UploadCloud className="icon" />
                    <div>
                        <p>Click to upload photo</p>
                        <p>PNG, JPG up to 5MB</p>
                    </div>
                </div>
            </div>}
        </div>
    )
}
export default UploadWidget
