import { Suspense, lazy, type ComponentType } from "react";
import { isDevEnvironment } from "./env.js";
import type { ConvexPanelProps } from "./panel.js";

const LazyPanel = lazy<ComponentType<ConvexPanelProps>>(async () => {
  const mod = await import("./panel.js");
  return { default: mod.ConvexPanel as ComponentType<ConvexPanelProps> };
});

export function ConvexPanel(props: ConvexPanelProps) {
  if (!isDevEnvironment(props.enabled)) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <LazyPanel {...props} />
    </Suspense>
  );
}

export { useAction, useMutation, useQuery } from "./react-hooks.js";
export { convexPanelBus } from "./index.js";
export { resetConvexInspectEnabled, setConvexInspectEnabled } from "./env.js";
export type { ConvexPanelProps } from "./panel.js";
