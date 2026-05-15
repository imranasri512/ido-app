// netlify/functions/api.js

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxI8bUi-CsEY_zeoxqwS6I1AtHTtFDQ3Yvs17aaPzmaWxyzvtG3aZsnhvMkcKKAmnfvHw/exec";

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

    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      return { statusCode: 200, headers, body: JSON.stringify(json) };
    } catch (e) {
      // Not JSON — return raw response so user can see what Apps Script sent back
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: false,
          error: text.substring(0, 300),  // show raw response as the error message
        }),
      };
    }

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: "Proxy error: " + err.message }),
    };
  }
};
