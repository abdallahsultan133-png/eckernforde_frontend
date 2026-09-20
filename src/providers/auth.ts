import type { AuthProvider } from "@refinedev/core";

const API_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const RETRYABLE_SIGN_IN_STATUSES = new Set([408, 425, 500, 502, 503, 504]);

const wait = (milliseconds: number) =>
    new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

/**
 * A first request can occasionally reach the API while its database pool is
 * reconnecting after an idle period. Retry that narrow class of failures once;
 * never retry an invalid password, a security block, or a rate limit.
 */
async function requestEmailSignIn(email: string, password: string): Promise<Response> {
    let latestError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const response = await fetch(`${API_URL}/auth/sign-in/email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            if (attempt === 0 && RETRYABLE_SIGN_IN_STATUSES.has(response.status)) {
                await wait(350);
                continue;
            }

            return response;
        } catch (error) {
            latestError = error;
            if (attempt === 0) {
                await wait(350);
                continue;
            }
        }
    }

    throw latestError instanceof Error ? latestError : new Error("Sign-in request failed");
}

export const authProvider: AuthProvider = {
    login: async ({ email, password }) => {
        try {
            const response = await requestEmailSignIn(email, password);

            if (!response.ok) {
                if (response.status === 401) {
                    return {
                        success: false,
                        error: {
                            message: "The email address or password is incorrect.",
                            name: "Invalid credentials",
                        },
                    };
                }

                if (response.status === 429) {
                    return {
                        success: false,
                        error: {
                            message: "Too many sign-in attempts. Please wait a minute and try again.",
                            name: "Please wait",
                        },
                    };
                }

                if (response.status === 403) {
                    const blocked = await response.clone().json().catch(() => ({})) as { code?: string; message?: string; error?: string };
                    const blockedMessage = blocked.code === "TEACHER_LOGIN_DISABLED"
                        ? "Teacher login is temporarily disabled by the super administrator."
                        : blocked.code === "STUDENT_PARENT_LOGIN_DISABLED"
                            ? "Student and parent login is temporarily disabled by the super administrator."
                            : blocked.code === "SYSTEM_OFFLINE"
                                ? "The school system is temporarily offline. Please try again later."
                                : blocked.message ?? blocked.error;
                    return {
                        success: false,
                        error: {
                            message: blockedMessage ?? "This sign-in request was blocked. Refresh the page and try again.",
                            name: "Sign-in blocked",
                        },
                    };
                }

                return {
                    success: false,
                    error: {
                        message: "The sign-in service is temporarily unavailable. Please try again.",
                        name: "Sign-in unavailable",
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
                    message: "We couldn't reach the sign-in service. Check your connection and try again.",
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
                return {
                    success: false,
                    error: {
                        name: "Couldn't send reset link",
                        message: "We couldn't send the reset link. Please check the address and try again.",
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
                return {
                    success: false,
                    error: {
                        name: "Couldn't reset password",
                        message: "This link may have expired or already been used. Request a new one.",
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
            // Only an explicit authentication failure should remove someone
            // from a protected route. A 5xx response during a context switch
            // is temporary and must not send a signed-in teacher to /login.
            if (response.status === 401 || response.status === 403) {
                return { authenticated: false, redirectTo: "/login" };
            }
            if (!response.ok) return { authenticated: true };
            const data = await response.json().catch(() => null);

            if (data?.user) {
                return { authenticated: true };
            }
        } catch (error) {
            // Keep the active route during a transient network failure. The
            // backend continues to enforce every API authorization boundary.
            console.warn("Session check unavailable; retaining current route:", error);
            return { authenticated: true };
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
            const sessionUser = data?.user;
            if (!sessionUser) return null;

            // Better Auth can return a cached session user without custom
            // additional fields (including `role`). The profile endpoint reads
            // the same authenticated account directly from the users table,
            // so hydrate the identity before role-aware navigation renders.
            if (!sessionUser.role) {
                try {
                    const profileResponse = await fetch(`${API_URL}/profile/me`, {
                        credentials: "include",
                    });
                    if (profileResponse.ok) {
                        const profilePayload = await profileResponse.json().catch(() => null);
                        const profileUser = profilePayload?.data;
                        if (profileUser?.role) {
                            return { ...sessionUser, ...profileUser };
                        }
                    }
                } catch (profileError) {
                    console.warn("Profile identity hydration unavailable:", profileError);
                }
            }

            return sessionUser;
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
