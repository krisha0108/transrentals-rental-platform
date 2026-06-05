// screens/travel-agent/_shared/RemoteImage.js
// Drop-in replacement for <Image> that auto-prefixes the base URL when the
// `uri` is a relative path (e.g. `/uploads/...`). The TA upload endpoint
// returns relative URLs, and RN's <Image> can't render those — it needs a
// fully-qualified http(s) URL. Without this wrapper, images appear blank.
import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import { getBaseURL } from "../../api/travelAgentClient";

// Module-level cache so we don't re-resolve baseURL on every mount.
let cachedBase = null;

export function isAbsoluteUrl(u) {
  return typeof u === "string" && (/^https?:\/\//i.test(u) || u.startsWith("data:"));
}

export function buildImageUri(uri, base) {
  if (!uri || typeof uri !== "string") return uri;
  if (isAbsoluteUrl(uri)) return uri;
  if (uri.startsWith("/")) return base ? `${base}${uri}` : uri;
  return uri;
}

export default function RemoteImage({ source, ...rest }) {
  const rawUri = source?.uri;
  const [base, setBase] = useState(cachedBase);

  useEffect(() => {
    let cancelled = false;
    if (!base && rawUri && !isAbsoluteUrl(rawUri) && rawUri.startsWith("/")) {
      getBaseURL().then((b) => {
        if (cancelled) return;
        cachedBase = b;
        setBase(b);
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [rawUri, base]);

  const resolvedUri = rawUri ? buildImageUri(rawUri, base) : rawUri;
  // If relative path and base hasn't resolved yet, render nothing (parent
  // wrapper styling typically gives a placeholder background).
  const finalSource = resolvedUri && (isAbsoluteUrl(resolvedUri) || !resolvedUri.startsWith("/"))
    ? { ...source, uri: resolvedUri }
    : undefined;

  return <Image {...rest} source={finalSource} />;
}
