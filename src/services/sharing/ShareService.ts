export async function shareResult(text: string, title = "The Great Invasion") {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text });
      return { method: "native", success: true };
    } catch {
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return { method: "clipboard", success: true };
  } catch {
    return { method: "none", success: false };
  }
}

export function buildShareLinks(text: string) {
  const encoded = encodeURIComponent(text);
  return {
    whatsapp: `https://wa.me/?text=${encoded}`,
    twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      typeof window !== "undefined" ? window.location.href : ""
    )}&quote=${encoded}`,
  };
}
