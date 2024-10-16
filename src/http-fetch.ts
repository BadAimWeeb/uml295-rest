import http from "node:http";
import { XMLParser, type X2jOptions } from "fast-xml-parser";

export function get(url: string | URL, options?: http.RequestOptions, _internalCount = 0) {
    return new Promise<http.IncomingMessage & {
        text(): Promise<string>,
        xml(options?: X2jOptions): Promise<any>
    }>((resolve, reject) => {
        const req = http.get(url, options ?? {});

        req.once("error", (err) => {
            if (_internalCount >= 3) {
                reject(err);
                req.destroy();
                req.removeAllListeners();
                return;
            }

            get(url, options, _internalCount + 1).then(resolve).catch(reject);
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
                async xml(o: X2jOptions) {
                    const text = await this.text();
                    const parser = new XMLParser(o);
                    return parser.parse(text);
                }
            }));
        });
    });
}

export function post(url: string | URL, data: string | Buffer, options?: http.RequestOptions, _internalCount = 0) {
    return new Promise<http.IncomingMessage & {
        text(): Promise<string>,
        xml(options?: X2jOptions): Promise<any>
    }>((resolve, reject) => {
        const req = http.request(url, {
            method: "POST",
            ...options
        });

        req.once("error", (err) => {
            if (_internalCount >= 3) {
                reject(err);
                req.destroy();
                req.removeAllListeners();
                return;
            }

            post(url, data, options, _internalCount + 1).then(resolve).catch(reject);
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
                async xml(o: X2jOptions) {
                    const text = await this.text();
                    const parser = new XMLParser(o);
                    return parser.parse(text);
                }
            }));
        });

        req.end(data);
    });
}

