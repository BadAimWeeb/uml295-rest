import { XMLBuilder } from "fast-xml-parser";
import type { IDBlob } from "../types.js";
import { post } from "../http-fetch.js";

export async function markReadMessage(idBlob: IDBlob, messageID: number) {
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
                serviceid: 0,
                msgid: messageID
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

    // Consumes the response to prevent memory leaks.
    await request.xml();

    return null;
}
