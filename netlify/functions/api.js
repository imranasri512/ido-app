// netlify/functions/api.js
// Proxies all requests to Google Apps Script server-side — no CORS issues on any device.

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxI8bUi-CsEY_zeoxqwS6I1AtHTtFDQ3Yvs17aaPzmaWxyzvtG3aZsnhvMkcKKAmnfvHw/exec";

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    let params = {};

    if (event.httpMethod === "POST") {
      // Parse POST body and add _method=POST so Apps Script routes it correctly
      const body = JSON.parse(event.body || "{}");
      params = { ...body, _method: "POST" };
    } else {
      // GET — pass query params through directly
      params = event.queryStringParameters || {};
    }

    // Build Apps Script GET URL (doGet handles all routing via params)
    const url = new URL(APPS_SCRIPT_URL);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    // Call Apps Script server-side — no browser CORS restrictions here
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
    });

    const text = await response.text();

    // Validate it's JSON
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("Apps Script non-JSON response:", text.substring(0, 300));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: false,
          error: "Server returned unexpected response. Make sure Apps Script is deployed with 'Anyone' access (not 'Anyone with Google account').",
        }),
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify(json) };

  } catch (err) {
    console.error("Proxy error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: "Proxy error: " + err.message }),
    };
  }
};
