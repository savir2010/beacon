import type { ReactNode } from "react";
import { absolute, isNative, openExternal } from "../api";

/** A link to a page on the Beacon website. In the iPhone app it opens in a Safari sheet. */
export function SiteLink({ path, children }: { path: string; children: ReactNode }) {
  return (
    <a href={absolute(path)} onClick={(e) => { if (isNative) { e.preventDefault(); openExternal(path); } }}>{children}</a>
  );
}
