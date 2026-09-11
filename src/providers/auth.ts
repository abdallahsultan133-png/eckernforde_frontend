import type { AuthProvider } from "@refinedev/core";

const API_URL = import.meta.env.VITE_BACKEND_BASE_URL;

export const authProvider: AuthProvider = {
    login: async ({ email, password }) => {
        try {
            const response = await fetch(`${API_URL}/auth/sign-in/email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: {
                        message: "Login failed",
                        name: "Invalid credentials",
                    },
                };
            }

            return {
                success: true,
                redirectTo: "/portal",
            };

        } catch (error) {
            console.error("Login request failed:", error);
            return {
                success: false,
                error: {
                    message: "Login error",
                    name: "Network error",
                },
            };
        }
    },

    register: async ({ name, email, password }) => {
        try {
            const response = await fetch(
                `${API_URL}/auth/sign-up/email`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                    }),
                }
            );

            if (!response.ok) {
                return {
                    success: false,
                    error: {
                        message: "Registration failed",
                        name: "Register error",
                    },
                };
            }

            return {
                success: true,
                redirectTo: "/portal",
            };

        } catch (error) {
            console.error("Registration request failed:", error);
            return {
                success: false,
                error: {
                    message: "Registration error",
                    name: "Network error",
                },
            };
        }
    },

    logout: async () => {
        await fetch(`${API_URL}/auth/sign-out`, {
            method: "POST",
            credentials: "include",
        });

        return {
            success: true,
        };
    },

    // Step 1 of the reset flow: ask the backend to email a reset link. Better
    // Auth returns 200 whether or not the address exists (no account
    // enumeration), so the success copy is deliberately non-committal.
    forgotPassword: async ({ email }: { email: string }) => {
        try {
            const response = await fetch(`${API_URL}/auth/request-password-reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    email,
                    redirectTo: `${window.location.origin}/reset-password`,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: {
                        name: "Couldn't send reset link",
                        message: data?.message ?? "Something went wrong. Please try again.",
                    },
                };
            }

            return {
                success: true,
                successNotification: {
                    message: "Check your email",
                    description:
                        "If an account exists for that address, a link to reset your password is on its way.",
                },
            };
        } catch (error) {
            console.error("Forgot-password request failed:", error);
            return {
                success: false,
                error: { name: "Network error", message: "Couldn't reach the server. Try again." },
            };
        }
    },

    // Step 2: set the new password using the token from the emailed link.
    updatePassword: async ({
        password,
        confirmPassword,
        token,
    }: {
        password?: string;
        confirmPassword?: string;
        token?: string;
    }) => {
        if (!token) {
            return {
                success: false,
                error: {
                    name: "Invalid reset link",
                    message: "This link is missing or malformed. Request a new one.",
                },
            };
        }
        if (!password || password.length < 8) {
            return {
                success: false,
                error: { name: "Password too short", message: "Use at least 8 characters." },
            };
        }
        if (password !== confirmPassword) {
            return {
                success: false,
                error: { name: "Passwords don't match", message: "Both fields must be identical." },
            };
        }

        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword: password, token }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: {
                        name: "Couldn't reset password",
                        message:
                            data?.message ??
                            "This link may have expired or already been used. Request a new one.",
                    },
                };
            }

            return {
                success: true,
                redirectTo: "/login",
                successNotification: {
                    message: "Password updated",
                    description: "Sign in with your new password.",
                },
            };
        } catch (error) {
            console.error("Reset-password request failed:", error);
            return {
                success: false,
                error: { name: "Network error", message: "Couldn't reach the server. Try again." },
            };
        }
    },

    check: async () => {
        try {
            const response = await fetch(`${API_URL}/auth/get-session`, {
                credentials: "include",
            });
            const data = response.ok ? await response.json().catch(() => null) : null;

            if (data?.user) {
                return { authenticated: true };
            }
        } catch (error) {
            // A local backend can be restarting or temporarily unavailable.
            // Treat that as an unauthenticated session so routing remains
            // usable; the sign-in screen gives a clear configuration message.
            console.warn("Session check unavailable:", error);
        }

        return { authenticated: false, redirectTo: "/login" };
    },

    getIdentity: async () => {
        // `disableCookieCache=true` forces Better Auth to read the user row from
        // the DB instead of the ~5-minute signed cookie cache (enabled in
        // backend lib/auth.ts). Without it, profile edits like a new display
        // photo or name don't show until the cache expires — the app-wide
        // avatar (header, sidebar, profile) all read this identity.
        try {
            const response = await fetch(`${API_URL}/auth/get-session?disableCookieCache=true`, {
                credentials: "include",
            });

            if (!response.ok) return null;
            const data = await response.json().catch(() => null);
            return data?.user ?? null;
        } catch (error) {
            console.warn("Identity check unavailable:", error);
            return null;
        }
    },

    onError: async (error) => {
        return {
            error,
        };
    },
};
