import { beforeEach, describe, expect, it, vi } from "vitest";
import { authText } from "./auth-messages";
const { auth, cookieStore } = vi.hoisted(() => ({
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
  cookieStore: { has: vi.fn(() => false), delete: vi.fn() },
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth })),
}));
vi.mock("@/lib/supabase/config", () => ({
  getAppUrl: () => "https://app.example",
}));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
import {
  signInAction,
  signUpAction,
  requestPasswordResetAction,
  updatePasswordAction,
} from "./actions";

const form = (input: Record<string, string>) => {
  const data = new FormData();
  Object.entries(input).forEach(([key, value]) => data.set(key, value));
  return data;
};
describe("authentication actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.has.mockReturnValue(false);
  });
  it("validates recovery email before contacting the provider", async () => {
    expect(
      (await requestPasswordResetAction({ ok: false }, form({ email: "bad" })))
        .ok,
    ).toBe(false);
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });
  it("requests PKCE recovery with the configured origin and a fixed destination", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    const result = await requestPasswordResetAction(
      { ok: false },
      form({
        email: "a@example.com",
        locale: "en",
        next: "https://evil.example",
      }),
    );
    expect(result).toEqual({ ok: true, message: authText("en", "checkEmail") });
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("a@example.com", {
      redirectTo:
        "https://app.example/auth/callback?next=%2Fauth%2Freset-password&locale=en",
    });
  });
  it("does not disclose provider error details or account existence", async () => {
    auth.signInWithPassword.mockResolvedValue({
      error: { message: "private internal details" },
    });
    expect(
      await signInAction(
        { ok: false },
        form({ email: "a@example.com", password: "password123" }),
      ),
    ).toEqual({ ok: false, message: authText("fr", "credentials") });
    auth.resetPasswordForEmail.mockResolvedValue({
      error: { code: "user_not_found" },
    });
    expect(
      (
        await requestPasswordResetAction(
          { ok: false },
          form({ email: "a@example.com" }),
        )
      ).message,
    ).toBe(authText("fr", "checkEmail"));
  });
  it("rejects mismatching passwords without creating an account", async () => {
    await signUpAction(
      { ok: false },
      form({
        email: "a@example.com",
        password: "password123",
        confirmPassword: "different",
      }),
    );
    expect(auth.signUp).not.toHaveBeenCalled();
  });
  it("requires email confirmation before a new account proceeds", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const result = await signUpAction(
      { ok: false },
      form({
        email: "a@example.com",
        password: "password123",
        confirmPassword: "password123",
        locale: "en",
      }),
    );
    expect(result.message).toBe(authText("en", "checkEmail"));
    expect(auth.signUp.mock.calls[0][0].options.data).toEqual({
      preferred_locale: "en",
    });
  });
  it("prevents return-URL injection after login", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    await expect(
      signInAction(
        { ok: false },
        form({
          email: "a@example.com",
          password: "password123",
          next: "//evil.example",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });
  it("requires a verified live identity before updating a password", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await updatePasswordAction(
      { ok: false },
      form({ password: "password123", confirmPassword: "password123" }),
    );
    expect(result.message).toBe(authText("fr", "invalidLink"));
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("updates the password then revokes refresh sessions and asks for a new login", async () => {
    auth.getUser.mockResolvedValue({
      data: { user: { email_confirmed_at: "2026-01-01" } },
      error: null,
    });
    auth.updateUser.mockResolvedValue({ error: null });
    auth.signOut.mockResolvedValue({ error: null });
    await expect(
      updatePasswordAction(
        { ok: false },
        form({
          password: "password123",
          confirmPassword: "password123",
          locale: "en",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/login?notice=passwordUpdated&locale=en");
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "password123" });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
  });
});
