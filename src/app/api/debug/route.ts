import { checkConfig, TABLE_IDS } from "@/lib/airtable";

export async function GET() {
  const config = checkConfig();

  // Test actual Airtable connection
  let testResult = "not tested";
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${TABLE_IDS.Facturas}?maxRecords=1`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        },
        cache: "no-store",
      }
    );
    testResult = `${res.status} ${res.statusText}`;
    if (!res.ok) {
      const body = await res.text();
      testResult += ` - ${body}`;
    }
  } catch (err) {
    testResult = `Error: ${err}`;
  }

  return Response.json({
    config,
    tableIds: TABLE_IDS,
    baseIdFull: process.env.AIRTABLE_BASE_ID,
    apiKeyPrefix: process.env.AIRTABLE_API_KEY?.substring(0, 10),
    testResult,
  });
}
