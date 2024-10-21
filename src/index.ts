import "dotenv/config";
import { Agent } from "node:http";
import { post } from "./http-fetch.js";
import type { IDBlob } from "./types.js";
import { initServer } from "./server.js";

let DEVICE_IP = process.env.UML295_TARGET_ADDRESS ?? "192.168.32.2";
let DEVICE_INTERFACE = process.env.UML295_INTERFACE;

const agent = new Agent({
    keepAlive: true,
    maxSockets: 1
});

// Get UUID of the device
const initRequest = await post(new URL("/discovery", `http://${DEVICE_IP}`), "id=vmbm", {
    headers: {
        "Content-Type": "text/plain"
    },
    localAddress: DEVICE_INTERFACE,
    agent
});
const initResponse = await initRequest.xml({
    attributeNamePrefix: "$",
    ignoreAttributes: false
});

const deviceID = initResponse.picaso["p-answer"].id;
if (!deviceID) {
    throw new Error("Device ID not found, please check the device IP and interface");
}
console.log("Device ID:", deviceID);

const discovery = initResponse.picaso["p-answer"].discovery.uniqueids.ui as { "#text": string, "$type": string }[];

const ID_BLOB = {
    ip: DEVICE_IP,
    if: DEVICE_INTERFACE,
    id: deviceID,
    agent,
    d: {
        phone: String(discovery.find(v => v["$type"] === "Phone Number")?.["#text"]),
        esn: String(discovery.find(v => v["$type"] === "ESN")?.["#text"]),
        iccid: String(discovery.find(v => v["$type"] === "IccId")?.["#text"]),
        imei: String(discovery.find(v => v["$type"] === "IMEI")?.["#text"]),
        imsi: String(discovery.find(v => v["$type"] === "IMSI")?.["#text"]),
        meid: String(discovery.find(v => v["$type"] === "MEID")?.["#text"])
    }
} as IDBlob;

initServer(ID_BLOB);
