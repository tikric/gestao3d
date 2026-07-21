// Pre-initialize environment variables before other imports
export function preInit() {
  if (
    !process.env.LOVABLE_PREVIEW_HOST ||
    process.env.LOVABLE_PREVIEW_HOST.includes("your-project-preview")
  ) {
    process.env.LOVABLE_PREVIEW_HOST =
      "id-preview-4be6a3df--ec7aa494-0b27-4dd5-9680-5387d979d3f4.lovable.app";
  } else {
    process.env.LOVABLE_PREVIEW_HOST = process.env.LOVABLE_PREVIEW_HOST.replace(/^"|"$/g, "")
      .replace(/^https?:\/\//, "")
      .trim();
  }
}
