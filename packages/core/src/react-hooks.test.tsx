// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import type { FunctionReference } from "convex/server";
import { convexPanelBus } from "./index.js";
import { useQuery } from "./react-hooks.js";

const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: vi.fn(),
  useAction: vi.fn(),
}));

beforeEach(() => {
  convexPanelBus.clear();
  globalThis.__CONVEX_INSPECT_DEV__ = true;
  mockUseQuery.mockReset();
});

afterEach(() => {
  delete globalThis.__CONVEX_INSPECT_DEV__;
});

function QueryHarness({ query }: { query: FunctionReference<"query"> }) {
  useQuery(query, {} as never);
  return null;
}

describe("useQuery logging", () => {
  it("creates a new event when the query ref changes with the same args", async () => {
    const firstQuery = { _name: "tasks:first" } as unknown as FunctionReference<"query">;
    const secondQuery = { _name: "tasks:second" } as unknown as FunctionReference<"query">;
    let currentResult: unknown = undefined;

    mockUseQuery.mockImplementation(() => currentResult);

    const { rerender } = render(<QueryHarness query={firstQuery} />);

    await waitFor(() => {
      expect(convexPanelBus.getEvents()).toHaveLength(1);
      expect(convexPanelBus.getEvents()[0]?.name).toBe("tasks:first");
      expect(convexPanelBus.getEvents()[0]?.status).toBe("loading");
    });

    currentResult = { ok: true };
    rerender(<QueryHarness query={firstQuery} />);

    await waitFor(() => {
      expect(convexPanelBus.getEvents()).toHaveLength(1);
      expect(convexPanelBus.getEvents()[0]?.status).toBe("success");
    });

    currentResult = undefined;
    rerender(<QueryHarness query={secondQuery} />);

    await waitFor(() => {
      expect(convexPanelBus.getEvents()).toHaveLength(2);
      expect(convexPanelBus.getEvents()[1]?.name).toBe("tasks:second");
      expect(convexPanelBus.getEvents()[1]?.status).toBe("loading");
    });
  });
});
