export function safeRedirectPath(value, fallback = "/upload") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  try {
    const target = new URL(value, "http://internal");
    return target.origin === "http://internal"
      ? `${target.pathname}${target.search}${target.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
