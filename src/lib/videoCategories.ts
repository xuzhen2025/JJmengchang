export function parseVideoCategory(category = "") {
  const [primary = "", secondary = ""] = category.split("/").map((part) => part.trim());
  return { primary, secondary };
}

export function getVideoSecondaryCategories(videos: ReadonlyArray<{ category?: string }>) {
  return [...new Set(videos.map((video) => parseVideoCategory(video.category).secondary).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "zh-CN"));
}
