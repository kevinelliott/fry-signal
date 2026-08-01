import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import Home from "./page";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

async function readAndCommit(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText(/Saved locally/i);
  await user.click(screen.getByRole("button", { name: /^read road forecast: Commuter Drift/i }));
  await user.click(screen.getByRole("button", { name: /commit opening batch/i }));
}

async function advanceThroughArrival(user: ReturnType<typeof userEvent.setup>, orderId: string) {
  await user.click(screen.getByRole("button", { name: new RegExp(`run next arrival · ${orderId}`, "i") }));
}

describe("Midnight Merge player surface", () => {
  it("keeps commit, switches, and service progress unavailable until the forecast is read", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const commit = screen.getByRole("button", { name: /commit opening batch/i });
    const gate = screen.getByRole("button", { name: /switch gate b/i });
    const progress = screen.getByRole("button", { name: /run next arrival/i });
    expect(commit).toBeDisabled();
    expect(gate).toBeDisabled();
    expect(progress).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /^read road forecast: Commuter Drift/i }));
    expect(commit).toBeEnabled();
    expect(progress).toBeDisabled();
  });

  it("keeps forecast browsing separate from advancing the authoritative shift", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByText(/Saved locally/i);

    await user.click(screen.getByRole("button", { name: /^read road forecast: Rain Detour/i }));
    expect(screen.getByText(/Tick 0 \/ 420/i)).toBeInTheDocument();
    expect(screen.getByText(/Viewing wave 2 · current 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/mm-05 ·/i)).not.toBeInTheDocument();
  });

  it("renders the reducer's real recovery order, cause, actions, and chosen cost", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await readAndCommit(user);

    for (const orderId of ["mm-01", "mm-02", "mm-03", "mm-04", "mm-05"]) {
      await advanceThroughArrival(user, orderId);
    }

    expect(screen.getByText("Choice open")).toBeInTheDocument();
    expect(screen.getAllByText(/mm-05/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Biscuit Basket/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Lane 2 arrival/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Route blocked/i).length).toBeGreaterThan(0);
    const loopback = screen.getByRole("button", { name: /Loopback Save.*\+5 ticks.*−3 freshness.*\$1\.25/i });
    await user.click(loopback);
    expect(screen.getByText("Resolved")).toBeInTheDocument();
    expect(screen.getAllByText(/resolved with Loopback Save/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+5t/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/−3/).length).toBeGreaterThan(0);
  });

  it("makes the announced Rain Detour require a real route choice", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await readAndCommit(user);

    for (const orderId of ["mm-01", "mm-02", "mm-03", "mm-04"]) {
      await advanceThroughArrival(user, orderId);
    }

    expect(
      screen.getByRole("group", { name: /Rain Detour: Gate A is closed to new hot trays/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /switch gate b toward pack b and window 2/i }));
    expect(
      screen.getByRole("group", { name: /Rain Detour: hot trays are set to the safe Pack B crossover/i }),
    ).toBeInTheDocument();

    await advanceThroughArrival(user, "mm-05");
    expect(screen.queryByText("Choice open")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/mm-05, Biscuit Basket, dispatched/i)).toBeInTheDocument();
  });

  it("progresses all three deterministic waves and settles a reducer-derived House Book", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await readAndCommit(user);

    for (let step = 0; step < 40; step += 1) {
      if (screen.queryByText("Choice open")) {
        const shortBatch = screen.queryByRole("button", { name: /Short Batch/i });
        if (shortBatch) {
          await user.click(shortBatch);
          continue;
        }
        const loopback = screen.queryByRole("button", { name: /Loopback Save/i });
        if (loopback) {
          await user.click(loopback);
          continue;
        }
      }
      const progress = screen.getByRole("button", { name: /run next arrival|close service|settle shift/i });
      if (/mm-05/i.test(progress.textContent ?? "")) {
        await user.click(screen.getByRole("button", { name: /switch gate b toward pack b and window 2/i }));
      }
      await user.click(progress);
      if (screen.queryByRole("heading", { name: "House Book" })) break;
    }

    expect(screen.getByRole("heading", { name: "House Book" })).toBeInTheDocument();
    expect(screen.getByText(/15 \/ 15 orders dispatched/i)).toBeInTheDocument();
    expect(screen.getByText(/Restaurant health margin/i)).toBeInTheDocument();
    expect(screen.getByText(/Margin keeps Mile 42 healthy/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Arena Let-Out/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Rain route read clean/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run Midnight Merge again/i })).toBeEnabled();
  });

  it("restores the versioned local snapshot without overwriting it during hydration", async () => {
    const user = userEvent.setup();
    const first = render(<Home />);
    await readAndCommit(user);
    await user.click(screen.getByRole("button", { name: /run next arrival · mm-01/i }));
    await waitFor(() => expect(window.localStorage.length).toBe(1));
    await waitFor(() => {
      const key = window.localStorage.key(0);
      expect(key).not.toBeNull();
      expect(window.localStorage.getItem(key!)).toContain('"tick":20');
    });
    first.unmount();

    render(<Home />);
    await waitFor(() => expect(screen.getByText(/Tick 20 \/ 420/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /batch committed/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /run next arrival · mm-02/i })).toBeEnabled();
  });

  it("supports pausing without changing the visible route", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByText(/Saved locally/i);

    const pause = screen.getByRole("button", { name: "Pause" });
    await user.click(pause);
    expect(screen.getByRole("button", { name: "Resume" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("group", { name: /ghost route preview/i })).toBeInTheDocument();
  });

  it("contains no wallet, token, price, or public-ranking prompt", () => {
    const { container } = render(<Home />);
    const visibleCopy = container.textContent ?? "";
    expect(visibleCopy).not.toMatch(/wallet|token|floor price|leaderboard|apy|yield/i);
  });

  it("offers all three announced waves through the accessible mobile forecast drawer", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const forecastToggle = screen.getByRole("button", { name: "Open three-wave road forecast" });
    expect(forecastToggle).toHaveAttribute("aria-expanded", "false");
    await user.click(forecastToggle);
    expect(screen.getByRole("button", { name: "Close three-wave road forecast" })).toHaveAttribute("aria-expanded", "true");

    expect(screen.getAllByRole("button", { name: /Read mobile forecast wave/i })).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: /Read mobile forecast wave 2: Rain Detour/i }));
    expect(screen.getByRole("button", { name: "Open three-wave road forecast" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getAllByText("Rain Detour").length).toBeGreaterThan(0);
  });

  it("keeps mobile exception context and all four service conditions available without fabricating an order", () => {
    render(<Home />);

    const exceptionContext = screen.getByLabelText("Selected exception order and announced cause");
    expect(exceptionContext).toHaveTextContent("No active exception");
    expect(exceptionContext).not.toHaveTextContent("Order #14");

    const conditions = screen.getByRole("group", { name: "All service conditions" });
    expect(conditions).toHaveTextContent("Warmth");
    expect(conditions).toHaveTextContent("Accuracy");
    expect(conditions).toHaveTextContent("Flow");
    expect(conditions).toHaveTextContent("Crew condition");
  });
});
