import logging
from urllib.parse import ParseResult, urlparse

import requests

# Flask Imports
from flask import Response
from flask import current_app as app
from flask.wrappers import Request

logger = app.logger
DEBUG = app.config["DEBUG"]
if DEBUG:
    logger.setLevel(logging.DEBUG)


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
    if len(request.path) <= 1:
        return "OK", 200

    url = f"{request.path[1:]}?{request.query_string.decode('utf-8')}"
    parsed_url: ParseResult = urlparse(url)
    url = f"{parsed_url.scheme}:/{parsed_url.path}?{parsed_url.query}"

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
