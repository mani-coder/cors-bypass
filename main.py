import logging
from urllib.parse import ParseResult, urlparse

import requests

# Flask Imports
from flask import Response
from flask import current_app as app
from flask.wrappers import Request

logger = app.logger
DEBUG = app.config["DEBUG"]
logger.setLevel(logging.DEBUG if DEBUG else logging.INFO)


HEADERS = [
    ("Cache-Control", "public, max-age=3600"),
    ("Access-Control-Allow-Origin", "*"),
]

EXCLUDED_HEADERS = [
    "transfer-encoding",
    "connection",
    "content-encoding",
    "access-control-allow-origin",
    "cache-control",
    "set-cookie",
]


def main(request: Request):
    if request.method == "OPTIONS":
        # Allows any requests from any origin with the Content-Type
        # header and caches preflight response for an 360000s
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS,HEAD,CONNECT",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "360000",
        }

        return ("", 204, headers)

    if len(request.path) <= 1:
        return "OK", 200

    url = request.args.url
    parsed_url: ParseResult = urlparse(url)
    url = "{scheme}:{slash}{domain}{path}{query}".format(
        scheme=parsed_url.scheme,
        slash="//" if parsed_url.netloc else "/",
        domain=f"{parsed_url.netloc}" if parsed_url.netloc else "",
        path=parsed_url.path,
        query=f"?{parsed_url.query}" if parsed_url.query else "",
    )

    logger.info(f"URL: {url}")

    resp = requests.request(
        method=request.method,
        url=url,
        headers={key: value for (key, value) in request.headers if key != "Host"},
        data=request.get_data(),
        cookies=request.cookies,
        allow_redirects=False,
    )

    headers = HEADERS + [
        (name, value)
        for (name, value) in resp.raw.headers.items()
        if name.lower() not in EXCLUDED_HEADERS
    ]

    response = Response(
        resp.content,
        status=resp.status_code,
        headers=headers,
    )

    return response
