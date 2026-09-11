import { parseCoords, gcj02ToWgs84, round6 } from "../worker/src/parse.js";

export const config = {
  runtime: "edge",
};

export default async function handler(request) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
      },
    });
  }

  const raw = url.searchParams.get("u") || "";
  const cs = (url.searchParams.get("cs") || "").toLowerCase();
  const fmt = (url.searchParams.get("format") || "").toLowerCase();

  try {
    let { lat, lon, name, src } = await parseCoords(raw);
    const needConv = cs === "gcj" || (cs !== "none" && (src === "amap" || src === "apple"));
    if (needConv) ({ lat, lon } = gcj02ToWgs84(lat, lon));
    lat = round6(lat);
    lon = round6(lon);
    name = name || "";
    const headers = { "Access-Control-Allow-Origin": "*" };
    if (fmt === "json") {
      return new Response(JSON.stringify({ lat, lon, name }), {
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    return new Response(`lat=${lat}&lon=${lon}`, { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message ? e.message : e) }), {
      status: 422,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
}
