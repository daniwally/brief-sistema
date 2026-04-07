export const revalidate = 3600; // Cache 1 hour

export async function GET() {
  try {
    // Fetch dolar oficial venta from dolarhoy.com
    let arsPerUsd = 1415; // fallback
    try {
      const html = await fetch("https://dolarhoy.com/cotizaciondolaroficial", {
        next: { revalidate: 3600 },
      }).then((r) => r.text());

      // Look for the Venta price: <p>Venta</p><p>$1.415,00</p>
      const ventaMatch = html.match(
        /Venta\s*<\/p>\s*<p[^>]*>\s*\$\s*([\d.,]+)/i
      );
      if (ventaMatch) {
        arsPerUsd = parseFloat(ventaMatch[1].replace(/\./g, "").replace(",", "."));
      }
    } catch {
      console.error("Failed to fetch dolarhoy, using fallback");
    }

    // Fetch CLP and PYG from free API
    let clpPerUsd = 920;
    let pygPerUsd = 6432;
    try {
      const ratesRes = await fetch("https://open.er-api.com/v6/latest/USD", {
        next: { revalidate: 3600 },
      });
      const ratesData = await ratesRes.json();
      if (ratesData.rates) {
        clpPerUsd = ratesData.rates.CLP || clpPerUsd;
        pygPerUsd = ratesData.rates.PYG || pygPerUsd;
        // Override ARS only if dolarhoy failed
        if (arsPerUsd === 1415 && ratesData.rates.ARS) {
          arsPerUsd = ratesData.rates.ARS;
        }
      }
    } catch {
      console.error("Failed to fetch exchange rates, using fallbacks");
    }

    return Response.json({
      ARS: arsPerUsd,
      CLP: clpPerUsd,
      PYG: pygPerUsd,
      USD: 1,
      source: "dolarhoy.com/cotizaciondolaroficial (ARS) + open.er-api.com (CLP/PYG)",
      updated: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
