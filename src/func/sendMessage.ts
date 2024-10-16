import { XMLBuilder } from "fast-xml-parser";
import type { IDBlob } from "../types.js";
import { post } from "../http-fetch.js";
import { SegmentedMessage } from "sms-segments-calculator";

/**
 * Message is limited to 160 characters (GSM-7) or 70 characters (Unicode/UCS-2). If exceeded, throws an error.
 * 
 * If you need to send a message longer than that, or use some advanced features, you might want to consider using AT commands directly for sendinig.
 * 
 * @param to The phone number to send the message to. Use universal E.164 format or formats that your network provider supports.
 * @param message The message to send.
 * @param smartEncodingMap Whether to use smart encoding map or not. If enabled, some characters will be remapped to GSM-7 characters if possible to save space.
 */
export async function sendMessage(idBlob: IDBlob, to: string, message: string, smartEncodingMap?: boolean) {
    const segmented = new SegmentedMessage(message, "auto", smartEncodingMap);
    if (segmented.segments.length > 1) {
        throw new Error("Message is too long. Please consider using AT commands directly for sending messages longer than 160 characters (GSM-7) or 70 characters (Unicode/UCS-2).");
    }

    const builder = new XMLBuilder({
        attributeNamePrefix: "$",
        ignoreAttributes: false
    });

    const xmlOut1 = builder.build({
        picaso: {
            "p-question": {
                uri: new URL(`/${idBlob.id}/MessagingSendKey`, `http://${idBlob.ip}`).href,
                time: new Date().toISOString(),
                id: "vmbm",
                component: "PSC",
                subcomponent: "UI",
                target: idBlob.id
            },
            "$version": "1.0.0"
        }
    });

    const request1 = await post(new URL(`/${idBlob.id}/MessagingSendKey?&c=${Date.now()}`, `http://${idBlob.ip}`), xmlOut1, {
        headers: {
            "Content-Type": "text/plain"
        },
        localAddress: idBlob.if,
        agent: idBlob.agent
    });

    const response1 = await request1.xml();

    const xmlOut2 = builder.build({
        picaso: {
            "p-question": {
                uri: new URL("/messaging", `http://${idBlob.ip}`).href,
                time: new Date().toISOString(),
                id: "vmbm",
                component: "PSC",
                subcomponent: "UI",
                target: idBlob.id,
                action: "send",
                serviceid: 0,
                from: idBlob.d.phone,
                to: to.replace(/\+/g, ""),
                cc: null,
                bcc: null,
                replyto: null,
                subject: null,
                body: Buffer.from(message, "utf-8").toString("hex"),
                priority: null,
                sendkey: response1.sendkey.token
            },
            "$version": "1.0.0"
        }
    });

    const request2 = await post(new URL("/messaging?&c=" + Date.now(), `http://${idBlob.ip}`), xmlOut2, {
        headers: {
            "Content-Type": "text/plain"
        },
        localAddress: idBlob.if,
        agent: idBlob.agent
    });

    // Consumes the response to prevent memory leaks.
    await request2.xml();

    return null;
}
