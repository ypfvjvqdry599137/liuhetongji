const COOKIE_NAME = "stat_auth";

function readCookie(cookieHeader, cookieName) {
  if (!cookieHeader) return "";
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === cookieName) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return "";
}

function isPublicPath(pathname) {
  // 登录页
  if (pathname === "/login" || pathname === "/login.html") return true;

  // Netlify functions
  if (
    pathname === "/.netlify/functions/login" ||
    pathname === "/.netlify/functions/logout"
  ) {
    return true;
  }

  // 常见静态资源
  if (
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".woff") ||
    pathname.endsWith(".woff2") ||
    pathname.endsWith(".ttf") ||
    pathname.endsWith(".map")
  ) {
    return true;
  }

  return false;
}

export default async (request, context) => {
  const url = new URL(request.url);

  if (isPublicPath(url.pathname)) {
    return context.next();
  }

  const authToken = Netlify.env.get("SITE_AUTH_TOKEN") || "";
  if (!authToken) {
    return new Response("Missing SITE_AUTH_TOKEN.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const cookieValue = readCookie(request.headers.get("cookie"), COOKIE_NAME);
  if (cookieValue === authToken) {
    return context.next();
  }

  const next = `${url.pathname}${url.search}`;
  const redirectUrl = new URL("/login", url.origin);
  redirectUrl.searchParams.set("next", next);
  return Response.redirect(redirectUrl.toString(), 302);
};