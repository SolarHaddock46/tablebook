import { getBrandName } from "@tablebook/shared";
import { resolveApiPublicUrl } from "@/lib/storage";

export function getReviewReminderOpenUrl(token: string, request?: Request) {
  const apiBase = resolveApiPublicUrl(request);
  return `${apiBase}/api/v1/reviews/reminder/${encodeURIComponent(token)}/open`;
}

export function getReviewReminderAppUrl(token: string) {
  const appBase = (process.env.APP_URL ?? "http://localhost:8081").replace(/\/$/, "");
  return `${appBase}/review?token=${encodeURIComponent(token)}`;
}

export function buildReviewReminderRedirectHtml(input: {
  token: string;
  restaurantName: string;
  locale: "ru" | "en";
}) {
  const appUrl = getReviewReminderAppUrl(input.token);
  const deepLink = `tablebook://review?token=${encodeURIComponent(input.token)}`;
  const title =
    input.locale === "en"
      ? `Leave a review — ${input.restaurantName}`
      : `Оставить отзыв — ${input.restaurantName}`;
  const hint =
    input.locale === "en"
      ? "If the app does not open automatically, use the button below."
      : "Если приложение не открылось, нажмите кнопку ниже.";
  const button =
    input.locale === "en"
      ? `Open in ${getBrandName("en")}`
      : `Открыть в ${getBrandName("ru")}`;

  return `<!DOCTYPE html>
<html lang="${input.locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="0;url=${appUrl}" />
  <title>${title}</title>
</head>
<body style="font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;">
  <h1 style="font-size:1.25rem;">${title}</h1>
  <p>${hint}</p>
  <p><a href="${appUrl}" style="color:#22d3ee;">${button}</a></p>
  <script>
    window.location.replace(${JSON.stringify(appUrl)});
    setTimeout(function () {
      window.location.href = ${JSON.stringify(deepLink)};
    }, 600);
  </script>
</body>
</html>`;
}
