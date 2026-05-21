import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06b6d4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                width: 100%;
                max-width: 100vw;
                overflow-x: hidden;
              }
              .tablebook-picker-input {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                border: 0;
                opacity: 0;
                cursor: pointer;
                box-sizing: border-box;
                min-width: 0;
                max-width: 100%;
                -webkit-appearance: none;
                appearance: none;
              }
            `
          }}
        />
      </head>
      <body style={{ backgroundColor: "#0f172a" }}>{children}</body>
    </html>
  );
}
