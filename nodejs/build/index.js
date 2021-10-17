"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bodyParser = __importStar(require("body-parser"));
var express_1 = __importDefault(require("express"));
var request_1 = __importDefault(require("request"));
var url_1 = __importDefault(require("url"));
var app = (0, express_1.default)();
var limit = typeof process.argv[2] != "undefined" ? process.argv[2] : "100kb";
console.log("Using limit: ", limit);
app.use(bodyParser.json({ limit: limit }));
app.all("*", function (req, res) {
    var _a;
    // Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    res.header("Access-Control-Allow-Headers", req.header("access-control-request-headers"));
    res.header("Cache-Control", "public, max-age=3600");
    // skip favicon.ico.
    if (req.path === "/favicon.ico") {
        res.send();
        return;
    }
    if (req.method === "OPTIONS") {
        // CORS Preflight
        res.send();
    }
    else {
        var parsedUrl = url_1.default.parse(req.url);
        var targetURL = (_a = parsedUrl.path) === null || _a === void 0 ? void 0 : _a.slice(1);
        if (!targetURL) {
            res.status(500);
            res.send({ error: "Append your url to the end of the cors-bypass URL." });
            return;
        }
        (0, request_1.default)({
            url: targetURL + req.url,
            method: req.method,
            json: req.body,
            headers: { Authorization: req.header("Authorization") },
        }).pipe(res);
    }
});
app.set("port", process.env.PORT || 3000);
app.listen(app.get("port"), function () {
    console.log("Proxy server listening on port " + app.get("port"));
});
