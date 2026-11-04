import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge" });
const routes = ["/", "/portfolio", "/services", "/about", "/contact"];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  for (const route of routes) {
    await page.goto(`http://127.0.0.1:4173${route}`, { waitUntil: "networkidle" });
    const result = await page.evaluate(() => {
      const interactive = [...document.querySelectorAll("a, button, input, select, textarea")]
        .filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        })
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            element: element.tagName.toLowerCase(),
            text: (element.getAttribute("aria-label") || element.textContent || element.getAttribute("name") || "").trim().replace(/\s+/g, " ").slice(0, 50),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        });

      const headings = [...document.querySelectorAll("h1, h2")].slice(0, 8).map((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 58),
          size: style.fontSize,
          lineHeight: style.lineHeight,
          width: Math.round(rect.width),
          scrollWidth: element.scrollWidth,
        };
      });

      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        smallTargets: interactive.filter(({ width, height }) => width < 44 || height < 44),
        headings,
      };
    });
    console.log(JSON.stringify({ viewport: viewport.name, route, ...result }));
  }
  await page.close();
}

await browser.close();
