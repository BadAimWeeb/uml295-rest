import http from "node:http";
import { XMLParser } from "fast-xml-parser";

export function get(url: string | URL, options?: http.RequestOptions) {
    return new Promise<http.IncomingMessage & {
        text(): Promise<string>,
        xml(): Promise<any>
    }>((resolve, reject) => {
        const req = http.get(url, options ?? {});

        req.once("error", (err) => {
            reject(err);
            req.destroy();
            req.removeAllListeners();
        });

        req.once("response", (res) => {
            resolve(Object.assign(res, {
                text() {
                    res.setEncoding("utf8")
                    return new Promise<string>((resolve, reject) => {
                        let data = "";
                        res.on("data", (chunk) => {
                            data += chunk;
                        });
                        res.once("end", () => {
                            resolve(data);
                            res.destroy();
                            res.removeAllListeners();
                        });
                        res.once("error", (err) => {
                            reject(err);
                            res.destroy();
                            res.removeAllListeners();
                        });
                    });
                },
                async xml() {
                    const text = await this.text();
                    const parser = new XMLParser();
                    return parser.parse(text);
                }
            }));
        });
    });
}

export function post(url: string | URL, data: string | Buffer, options?: http.RequestOptions) {
    return new Promise<http.IncomingMessage & {
        text(): Promise<string>,
        xml(): Promise<any>
    }>((resolve, reject) => {
        const req = http.request(url, {
            method: "POST",
            ...options
        });

        req.once("error", (err) => {
            reject(err);
            req.destroy();
            req.removeAllListeners();
        });

        req.once("response", (res) => {
            resolve(Object.assign(res, {
                text() {
                    res.setEncoding("utf8")
                    return new Promise<string>((resolve, reject) => {
                        let data = "";
                        res.on("data", (chunk) => {
                            data += chunk;
                        });
                        res.once("end", () => {
                            resolve(data);
                            res.destroy();
                            res.removeAllListeners();
                        });
                        res.once("error", (err) => {
                            reject(err);
                            res.destroy();
                            res.removeAllListeners();
                        });
                    });
                },
                async xml() {
                    const text = await this.text();
                    const parser = new XMLParser();
                    return parser.parse(text);
                }
            }));
        });

        req.end(data);
    });
}

