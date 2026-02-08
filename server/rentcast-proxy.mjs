import dotenv from "dotenv";
import express from "express";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

const API_KEY = process.env.RENTCAST_API_KEY;
if (!API_KEY) throw new Error("Missing RENTCAST_API_KEY");

const BASE = "https://api.rentcast.io/v1";

app.get("/api/listings", async (req, res) => {
  try {
    const mode = (req.query.mode || "rent").toString(); // "rent" | "buy"
    const endpoint =
      mode === "buy" ? "/listings/sale" : "/listings/rental/long-term";

    const u = new URL(BASE + endpoint);

    // Map frontend params to RentCast API params
    const paramMap = {
      city: "city",
      state: "state",
      latitude: "latitude",
      longitude: "longitude",
      limit: "limit",
      offset: "offset",
    };

    const hasCoords = req.query.latitude && req.query.longitude;

    for (const [k, v] of Object.entries(req.query)) {
      if (k === "mode" || v == null) continue;

      // Handle range params like "2200-5200" -> priceMin=2200&priceMax=5200
      if (k === "price" && typeof v === "string" && v.includes("-")) {
        const [min, max] = v.split("-");
        if (min) u.searchParams.set("priceMin", min);
        if (max) u.searchParams.set("priceMax", max);
      } else if (k === "bedrooms" && typeof v === "string" && v.includes("-")) {
        const [min, max] = v.split("-");
        if (min) u.searchParams.set("bedroomsMin", min);
        if (max) u.searchParams.set("bedroomsMax", max);
      } else if (k === "bathrooms" && typeof v === "string" && v.includes("-")) {
        const [min, max] = v.split("-");
        if (min) u.searchParams.set("bathroomsMin", min);
        if (max) u.searchParams.set("bathroomsMax", max);
      } else if (k === "radius" && hasCoords) {
        // Only include radius if lat/lng are provided
        u.searchParams.set("radius", String(v));
      } else if (paramMap[k]) {
        u.searchParams.set(paramMap[k], Array.isArray(v) ? v.join(",") : String(v));
      }
    }

    const r = await fetch(u, {
      headers: { "X-Api-Key": API_KEY },
    });

    const text = await r.text();
    res.status(r.status).type("application/json").send(text);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`RentCast proxy on http://localhost:${PORT}`);
});
