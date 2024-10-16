import { post } from "../http-fetch.js";
import type { IDBlob } from "../types.js";
import { XMLBuilder } from "fast-xml-parser";

export async function getMessages(idBlob: IDBlob) {
    const builder = new XMLBuilder({
        attributeNamePrefix: "$",
        ignoreAttributes: false
    });
    const xmlOut = builder.build({
        picaso: {
            "p-question": {
                uri: new URL("/messaging", `http://${idBlob.ip}`).href,
                time: new Date().toISOString(),
                id: "vmbm",
                component: "PSC",
                subcomponent: "UI",
                target: idBlob.id,
                action: "retrieve",
                serviceid: 0
            },
            "$version": "1.0.0"
        }
    });

    const request = await post(new URL("/messaging?&c=" + Date.now(), `http://${idBlob.ip}`), xmlOut, {
        headers: {
            "Content-Type": "text/plain"
        },
        localAddress: idBlob.if,
        agent: idBlob.agent
    });

    const response = await request.xml();

    // Array that contains inbox and outbox as separate objects.
    const messageObject = response.picaso["p-answer"].messaging;
    if (!messageObject) {
        return [];
    }

    const messages = [] as {
        id: number,
        direction: "inbox" | "outbox",
        from?: string,
        to?: string,
        timestamp: number,
        /** MMS only. */
        subject?: string,
        body: string,
        status: "unread" | "notsent" | "sent" | "read" | `unknown-${string}`,
        error?: {
            code: number,
            message: string
        }
    }[];

    for (let box of messageObject) {
        const direction = box.summary.foldertype;

        const recMessages = Array.isArray(box.message) ? box.message : typeof box.message === "object" ? [box.message] : [];
        for (let message of recMessages) {
            messages.push({
                id: message.id,
                from: "from" in message ? String(message.from) : void 0,
                to: "to" in message ? String(message.to) : void 0,
                timestamp: new Date(message.receivedate ?? message.senddate).getTime(),
                subject: message.subject === message.body ? undefined : Buffer.from(String(message.subject), "hex").toString("utf8"),
                body: Buffer.from(String(message.body), "hex").toString("utf8"),
                direction: direction === "inbox" ? "inbox" : "outbox",
                status: message.state.value in { unread: 1, notsent: 1, sent: 1, read: 1 } ? message.state.value : `unknown-${message.state.value}`,
                error: message.state.error.value !== "none" ? {
                    code: message.state.error.value,
                    message: message.state.error.description
                } : void 0
            });
        }
    }

    return messages.sort((a, b) => a.timestamp - b.timestamp);
}


