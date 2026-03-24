const COOKIE_NAME = "stat_auth";
const COOKIE_MAX_AGE = 60 * 60 * 3;

function sanitizeNext(rawNext) {
  const next = typeof rawNext === "string" ? rawNext.trim() : "";
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 303,
      headers: { Location: "/login" },
      body: ""
    };
  }

  const params = new URLSearchParams(event.body || "");
  const inputPassword = params.get("password") || "";
  const next = sanitizeNext(params.get("next"));
  const expectedPassword = process.env.SITE_PASSWORD || "";
  const authToken = process.env.SITE_AUTH_TOKEN || "";

  if (!expectedPassword || !authToken) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: "Missing SITE_PASSWORD or SITE_AUTH_TOKEN."
    };
  }

  if (inputPassword !== expectedPassword) {
    return {
      statusCode: 303,
      headers: { Location: `/login?error=1&next=${encodeURIComponent(next)}` },
      body: ""
    };
  }

  return {
    statusCode: 303,
    headers: {
      Location: next,
      "Set-Cookie": `${COOKIE_NAME}=${encodeURIComponent(authToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
    },
    body: ""
  };
};

