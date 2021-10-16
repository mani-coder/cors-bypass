import logging

import requests

# Flask Imports
from flask import Response
from flask import current_app as app
from flask.wrappers import Request
from werkzeug.datastructures import HeaderSet

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
    url = f"{request.path[1:]}?{request.query_string.decode('utf-8')}"
    logger.info(f"URL: {url}")

    import pprint

    pprint.pprint(request.headers)
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
        if name.lower() not in excluded_headers
    ]

    response = Response(
        resp.content,
        status=resp.status_code,
        headers=headers,
    )

    return response
