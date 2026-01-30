import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-0G9KHF8ZKB'; // FINAL, ACTIVE Measurement ID

export default function GoogleAnalytics() {
  return (
    <>
      {/* Google Analytics 4 - Global Site Tag (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname + window.location.search,
              send_page_view: true
            });
          `,
        }}
      />
    </>
  );
}
