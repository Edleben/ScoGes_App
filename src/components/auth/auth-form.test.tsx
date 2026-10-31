// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const { signup } = vi.hoisted(() => ({ signup: vi.fn() }));
vi.mock("@/modules/identity/actions", () => ({
  signUpAction: signup,
  signInAction: vi.fn(),
  requestPasswordResetAction: vi.fn(),
  updatePasswordAction: vi.fn(),
}));
vi.mock("@/modules/identity/invitation-actions", () => ({
  acceptInvitationAction: vi.fn(),
  captureInvitationAction: vi.fn(),
}));
import { AuthForm } from "./auth-form";
import { authText } from "@/modules/identity/auth-messages";
afterEach(cleanup);

for (const locale of ["fr", "en"] as const) {
  it(`keeps the entered email and clears passwords after a ${locale} provider failure`, async () => {
    signup.mockResolvedValue({
      ok: false,
      message: authText(locale, "emailRateLimited"),
    });
    const { container } = render(<AuthForm mode="signup" locale={locale} />);
    const email = screen.getByLabelText(authText(locale, "email"));
    fireEvent.change(email, { target: { value: "synthetic@example.invalid" } });
    fireEvent.change(
      screen.getByLabelText(authText(locale, "password"), { exact: true }),
      { target: { value: "Synthetic-PasswordAa1!" } },
    );
    fireEvent.change(screen.getByLabelText(authText(locale, "confirm")), {
      target: { value: "Synthetic-PasswordAa1!" },
    });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        authText(locale, "emailRateLimited"),
      ),
    );
    expect(email).toHaveValue("synthetic@example.invalid");
    expect(
      screen.getByLabelText(authText(locale, "password"), { exact: true }),
    ).toHaveValue("");
    expect(screen.getByLabelText(authText(locale, "confirm"))).toHaveValue("");
  });
}
