import express from "express";
import request from "request";
import URL from "url";

const app = express();

// const limit = typeof process.argv[2] != "undefined" ? process.argv[2] : "100kb";
// console.log("Using limit: ", limit);
// app.use(bodyParser.json({ limit: limit }));

app.all("*", function (req, res) {
  // Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
  if (req.header("access-control-request-headers")) {
    res.header(
      "Access-Control-Allow-Headers",
      req.header("access-control-request-headers")
    );
  }
  res.header("cache-control", "public, max-age=3600");

  // skip favicon.ico.
  if (req.path === "/favicon.ico") {
    res.send();
    return;
  }

  if (req.method === "OPTIONS") {
    // CORS Preflight
    res.send();
  } else {
    const parsedUrl = URL.parse(req.url);
    if (!parsedUrl.path || parsedUrl.path === "/") {
      res.status(500);
      res.send({ error: "Append your URL to the end of the cors-bypass URL." });
      return;
    }

    let url = parsedUrl.path.slice(1);
    if (!url.includes("https://")) {
      url = url.replace("https:/", "https://");
    } else if (!url.includes("http://")) {
      url = url.replace("http:/", "http://");
    }

    console.info("Target URL: ", url);
    request({
      url,
      method: req.method,
      json: req.body,
    }).pipe(res);
  }
});

app.set("port", process.env.PORT || 3000);

app.listen(app.get("port"), function () {
  console.log("Proxy server listening on port " + app.get("port"));
});

export default app;
