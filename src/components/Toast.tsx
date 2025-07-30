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

    let bg = "bg-gray-800";
    const text = "text-white";
    if (type === "success") bg = "bg-blue-500";
    if (type === "error") bg = "bg-red-500";

    return (
        <div
            className={`fixed z-50 bottom-4 left-1/2 -translate-x-1/2 w-[95vw] max-w-xs sm:max-w-md px-3 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg flex items-center gap-2 text-sm sm:text-base font-medium ${bg} ${text} animate-fade-in`}
            style={{ wordBreak: 'keep-all', textAlign: 'center', boxSizing: 'border-box' }}
            role="alert"
            tabIndex={0}
            aria-live="assertive"
        >
            <span className="flex-1 break-keep">{message}</span>
            {onClose && (
                <button
                    onClick={onClose}
                    aria-label="닫기"
                    className="ml-2 p-2 rounded-full bg-black/20 hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white transition-all duration-150"
                    style={{ minWidth: 36, minHeight: 36 }}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 6L14 14M14 6L6 14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            )}
            <style jsx>{`
                .animate-fade-in {
                    animation: fadeInToast 0.3s ease;
                }
                @keyframes fadeInToast {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
