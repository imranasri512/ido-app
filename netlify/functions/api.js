// netlify/functions/api.js
// Proxies all requests to Google Apps Script server-side — no CORS issues on any device.

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzDSay6J_kDwB1qeDOvwHBFTpQW3ax9yOXBhuB0FM7j9BvQKVOcWYkV9SBDP8_y-5zrEQ/exec";

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    let params = {};

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      params = { ...body, _method: "POST" };
    } else {
      params = event.queryStringParameters || {};
    }

    const url = new URL(APPS_SCRIPT_URL);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
    });

    const text = await response.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: "Proxy error: " + err.message }),
    };
  }
};
