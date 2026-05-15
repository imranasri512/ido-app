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

    console.log("Calling Apps Script:", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
    });

    console.log("Response status:", response.status);
    console.log("Response URL after redirect:", response.url);
    console.log("Content-Type:", response.headers.get("content-type"));

    const text = await response.text();
    console.log("Raw response (first 500 chars):", text.substring(0, 500));

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Return the raw text in the error so we can see what came back
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: false,
          error: "Non-JSON response from Apps Script",
          debug: {
            status: response.status,
            finalUrl: response.url,
            contentType: response.headers.get("content-type"),
            rawResponse: text.substring(0, 500),
          }
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
