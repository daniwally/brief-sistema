import { NextResponse } from "next/server";

export const revalidate = 1800; // 30 min cache

export async function GET() {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America/Argentina/Buenos_Aires",
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) throw new Error("Weather API error");

    const data = await res.json();
    const current = data.current;

    return NextResponse.json({
      temperatura: Math.round(current.temperature_2m),
      humedad: current.relative_humidity_2m,
      viento: Math.round(current.wind_speed_10m),
      codigo: current.weather_code,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener clima" },
      { status: 500 }
    );
  }
}
