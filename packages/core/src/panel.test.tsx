// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConvexPanel } from "./panel.js";
import { convexPanelBus } from "./index.js";

function seedEvent(id: string, name = "tasks:add") {
  convexPanelBus.emit({
    id,
    type: "mutation",
    name,
    args: { text: "Buy milk" },
    status: "success",
    result: { ok: true },
    startedAt: 1,
    completedAt: 2,
  });
}

beforeEach(() => {
  convexPanelBus.clear();
  localStorage.clear();
});

describe("ConvexPanel accessibility", () => {
  it("supports keyboard expansion and collapse on event rows", async () => {
    seedEvent("event-1");
    const user = userEvent.setup();
    const { container } = render(<ConvexPanel defaultOpen />);

    const rowSummary = container.querySelector('[aria-controls="convex-panel-detail-event-1"]');
    if (!(rowSummary instanceof HTMLDivElement)) {
      throw new Error("Expected row summary button to exist");
    }

    expect(rowSummary.getAttribute("role")).toBe("button");
    expect(rowSummary.getAttribute("tabindex")).toBe("0");
    expect(rowSummary.getAttribute("aria-expanded")).toBe("false");

    rowSummary.focus();
    await user.keyboard("{Enter}");
    expect(rowSummary.getAttribute("aria-expanded")).toBe("true");
    screen.getByText("Args");

    await user.keyboard(" ");
    expect(rowSummary.getAttribute("aria-expanded")).toBe("false");
  });

  it("removes collapsed detail actions from the accessibility tree", async () => {
    seedEvent("event-2", "tasks:delete");
    const user = userEvent.setup();
    const { container } = render(<ConvexPanel defaultOpen />);

    const rowSummary = container.querySelector('[aria-controls="convex-panel-detail-event-2"]');
    if (!(rowSummary instanceof HTMLDivElement)) {
      throw new Error("Expected row summary button to exist");
    }

    expect(screen.queryByRole("button", { name: "Copy Args" })).toBeNull();

    await user.click(rowSummary);
    screen.getByRole("button", { name: "Copy Args" });

    await user.click(rowSummary);
    expect(screen.queryByRole("button", { name: "Copy Args" })).toBeNull();
  });

  it("keeps collapsed detail actions out of tab order while row summaries remain focusable", async () => {
    seedEvent("event-3", "tasks:list");
    const user = userEvent.setup();
    render(<ConvexPanel defaultOpen />);

    await user.tab();
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Clear events");

    await user.tab();
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Toggle settings");

    await user.tab();
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Toggle filters");

    await user.tab();
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Close Convex Inspect");

    await user.tab();
    expect(document.activeElement?.getAttribute("role")).toBe("button");
    expect(document.activeElement?.getAttribute("aria-controls")).toBe("convex-panel-detail-event-3");

    expect(screen.queryByRole("button", { name: "Copy Args" })).toBeNull();
  });
});

describe("ConvexPanel error display", () => {
  it("displays error strings without surrounding JSON quotes", async () => {
    convexPanelBus.emit({
      id: "err-1",
      type: "mutation",
      name: "tasks:add",
      args: { text: "Buy milk" },
      status: "error",
      error: "ConvexError: permission denied",
      startedAt: 1,
      completedAt: 2,
    });
    const user = userEvent.setup();
    const { container } = render(<ConvexPanel defaultOpen />);

    const rowSummary = container.querySelector('[aria-controls="convex-panel-detail-err-1"]');
    if (!(rowSummary instanceof HTMLElement)) throw new Error("Expected row summary");
    await user.click(rowSummary);

    const view = within(container);
    expect(view.getByText("ConvexError: permission denied")).toBeTruthy();
    expect(view.queryByText('"ConvexError: permission denied"')).toBeNull();
  });
});

describe("ConvexPanel duration display", () => {
  it("shows duration for completed events", () => {
    convexPanelBus.emit({
      id: "dur-1",
      type: "query",
      name: "tasks:list",
      args: {},
      status: "success",
      result: [],
      startedAt: 1000,
      completedAt: 1342,
    });
    const { container } = render(<ConvexPanel defaultOpen />);
    expect(within(container).getByText("342ms")).toBeTruthy();
  });

  it("shows seconds for long-running events", () => {
    convexPanelBus.emit({
      id: "dur-2",
      type: "action",
      name: "ai:summarize",
      args: {},
      status: "success",
      result: {},
      startedAt: 0,
      completedAt: 2400,
    });
    const { container } = render(<ConvexPanel defaultOpen />);
    expect(within(container).getByText("2.4s")).toBeTruthy();
  });

  it("does not show duration for in-flight loading events", () => {
    convexPanelBus.emit({
      id: "dur-3",
      type: "query",
      name: "tasks:list",
      args: {},
      status: "loading",
      startedAt: 1000,
    });
    const { container } = render(<ConvexPanel defaultOpen />);
    const view = within(container);
    expect(view.queryByText(/^\d+ms$/)).toBeNull();
    expect(view.queryByText(/^\d+\.\d+s$/)).toBeNull();
  });
});

describe("ConvexPanel loading pulse animation", () => {
  it("applies pulse animation to the status text of in-flight events", () => {
    convexPanelBus.emit({
      id: "pulse-1",
      type: "query",
      name: "tasks:list",
      args: {},
      status: "loading",
      startedAt: Date.now(),
    });
    const { container } = render(<ConvexPanel defaultOpen />);
    const loadingStatus = within(container).getByText("loading");
    expect(loadingStatus.style.animation).toContain("convex-panel-pulse");
  });

  it("does not apply pulse animation to completed events", () => {
    convexPanelBus.emit({
      id: "pulse-2",
      type: "query",
      name: "tasks:list",
      args: {},
      status: "success",
      result: [],
      startedAt: 1,
      completedAt: 2,
    });
    const { container } = render(<ConvexPanel defaultOpen />);
    const successStatus = within(container).getByText("success");
    expect(successStatus.style.animation ?? "").toBe("");
  });
});

describe("ConvexPanel mutually exclusive settings and filter panels", () => {
  it("closes filter when settings is opened", async () => {
    const user = userEvent.setup();
    const { container } = render(<ConvexPanel defaultOpen />);
    const view = within(container);
    const settingsBtn = view.getByRole("button", { name: "Toggle settings" });
    const filterBtn = view.getByRole("button", { name: "Toggle filters" });

    await user.click(filterBtn);
    expect(filterBtn.getAttribute("aria-expanded")).toBe("true");

    await user.click(settingsBtn);
    expect(settingsBtn.getAttribute("aria-expanded")).toBe("true");
    expect(filterBtn.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes settings when filter is opened", async () => {
    const user = userEvent.setup();
    const { container } = render(<ConvexPanel defaultOpen />);
    const view = within(container);
    const settingsBtn = view.getByRole("button", { name: "Toggle settings" });
    const filterBtn = view.getByRole("button", { name: "Toggle filters" });

    await user.click(settingsBtn);
    expect(settingsBtn.getAttribute("aria-expanded")).toBe("true");

    await user.click(filterBtn);
    expect(filterBtn.getAttribute("aria-expanded")).toBe("true");
    expect(settingsBtn.getAttribute("aria-expanded")).toBe("false");
  });

  it("allows toggling settings closed without affecting filters", async () => {
    const user = userEvent.setup();
    const { container } = render(<ConvexPanel defaultOpen />);
    const view = within(container);
    const settingsBtn = view.getByRole("button", { name: "Toggle settings" });
    const filterBtn = view.getByRole("button", { name: "Toggle filters" });

    await user.click(settingsBtn);
    await user.click(settingsBtn);
    expect(settingsBtn.getAttribute("aria-expanded")).toBe("false");
    expect(filterBtn.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("ConvexPanel new-event badge count", () => {
  it("shows new events received while panel was closed", async () => {
    const user = userEvent.setup();
    const { container } = render(<ConvexPanel defaultOpen={false} />);
    const view = within(container);

    seedEvent("badge-1");
    seedEvent("badge-2");
    seedEvent("badge-3");

    await user.click(view.getByRole("button", { name: "Open Convex Inspect" }));
    await user.click(view.getByRole("button", { name: "Close Convex Inspect" }));
    await waitFor(() => view.getByRole("button", { name: "Open Convex Inspect" }));

    seedEvent("badge-4");
    seedEvent("badge-5");

    const badge = await view.findByLabelText("2 new events");
    expect(badge.textContent).toBe("2");
  });

  it("hides badge when no new events have arrived since close", async () => {
    const user = userEvent.setup();
    const { container } = render(<ConvexPanel defaultOpen={false} />);
    const view = within(container);

    seedEvent("badge-6");

    await user.click(view.getByRole("button", { name: "Open Convex Inspect" }));
    await user.click(view.getByRole("button", { name: "Close Convex Inspect" }));
    await waitFor(() => view.getByRole("button", { name: "Open Convex Inspect" }));

    expect(view.queryByLabelText(/new events/)).toBeNull();
  });
});
