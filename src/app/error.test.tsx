// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ErrorPage from "./error";
import { LocaleContext } from "@/i18n/locale-context";
afterEach(cleanup);

for (const locale of ["fr", "en"] as const) {
  it(`renders a safe ${locale} error and retries without exposing exception details`, () => {
    const reset = vi.fn();
    render(
      <LocaleContext value={locale}>
        <ErrorPage
          error={new Error("private database credentials")}
          reset={reset}
        />
      </LocaleContext>,
    );
    expect(screen.getByRole("heading")).toHaveTextContent(
      locale === "fr" ? "Une erreur est survenue" : "Something went wrong",
    );
    expect(screen.queryByText(/private database credentials/)).toBeNull();
    fireEvent.click(
      screen.getByRole("button", {
        name: locale === "fr" ? "Réessayer" : "Try again",
      }),
    );
    expect(reset).toHaveBeenCalledOnce();
  });
}
