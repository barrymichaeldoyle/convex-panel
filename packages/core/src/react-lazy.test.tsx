// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConvexPanel } from "./react-lazy.js";

beforeEach(() => {
  globalThis.__CONVEX_INSPECT_DEV__ = false;
});

afterEach(() => {
  delete globalThis.__CONVEX_INSPECT_DEV__;
});

describe("ConvexPanel lazy entry", () => {
  it("does not render the panel when devtools are disabled", () => {
    render(<ConvexPanel defaultOpen />);
    expect(screen.queryByRole("dialog", { name: "Convex Inspect" })).toBeNull();
  });

  it("renders the panel when explicitly enabled via prop", async () => {
    render(<ConvexPanel defaultOpen enabled />);
    expect(await screen.findByRole("dialog", { name: "Convex Inspect" })).toBeTruthy();
  });
});
