// netlify/functions/api.js
// This runs on Netlify's servers — no CORS issues, works on all devices.

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "YOUR_APPS_SCRIPT_URL_HERE";

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    let params = {};

    if (event.httpMethod === "GET") {
      params = event.queryStringParameters || {};
    } else {
      params = JSON.parse(event.body || "{}");
    }

    // Build Apps Script URL
    const url = new URL(APPS_SCRIPT_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    // Fetch from Apps Script (server-side — no CORS restrictions)
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
    });

    const text = await response.text();

    // Apps Script sometimes wraps in JSONP even without callback — strip if needed
    const clean = text.replace(/^[^(]+\(/, "").replace(/\);?\s*$/, "");

    return {
      statusCode: 200,
      headers,
      body: clean,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: "Proxy error: " + err.message }),
    };
  }
};
