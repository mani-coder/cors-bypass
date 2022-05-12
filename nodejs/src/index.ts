import { createServer } from "cors-anywhere";

// Listen on a specific port via the PORT environment variable
const port = process.env.PORT || 3000;

function parseEnvList(env?: string) {
  return env ? env.split(",") : [];
}

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
const ALLOWED_PROXY_HOSTS = parseEnvList(process.env.ALLOWED_PROXY_HOSTS);

console.log("ALLOWED_PROXY_HOSTS", ALLOWED_PROXY_HOSTS);

createServer({
  originBlacklist,
  originWhitelist,
  requireHeader: [],
  removeHeaders: [
    "cookie",
    "cookie2",
    "x-request-start",
    "x-request-id",
    "via",
    "connect-time",
    "total-route-time",
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    xfwd: false,
  },
  handleInitialRequest: (req, res, location) => {
    if (
      ALLOWED_PROXY_HOSTS.length === 0 ||
      ALLOWED_PROXY_HOSTS.indexOf(location.hostname) >= 0
    ) {
      // handle the request.
      return false;
    } else {
      console.debug(`Blocked proxy request for ${location.hostname}`, {
        location,
      });
      res.writeHead(403, "Forbidden");
      res.end(
        `The request host "${location.hostname}" isn't allowed by the operator for proxy, reach out to the developer.`
      );
      return true;
    }
  },
}).listen(port, function () {
  console.log("Running CORS Bypass on : " + port);
});
