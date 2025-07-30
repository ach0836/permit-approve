"use client";
import { useEffect } from "react";

interface ToastProps {
    message: string;
    type?: "success" | "error" | "info";
    onClose?: () => void;
    duration?: number;
}

export default function Toast({ message, type = "info", onClose, duration = 2500 }: ToastProps) {
    useEffect(() => {
        if (!onClose) return;
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    let bg = "bg-gray-800", text = "text-white";
    if (type === "success") bg = "bg-blue-500";
    if (type === "error") bg = "bg-red-500";

    return (
        <div
            className={`fixed z-50 bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded shadow-lg flex items-center gap-2 ${bg} ${text}`}
            role="alert"
        >
            {message}
        </div>
    );
}
