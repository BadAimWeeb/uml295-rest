import "dotenv/config";
import "node:http";
import { post } from "./http-fetch.js";

let DEVICE_IP = process.env.UML295_TARGET_ADDRESS ?? "192.168.32.2";
let DEVICE_INTERFACE = process.env.UML295_INTERFACE;

// Get UUID of the device
const initRequest = await post(new URL("/discovery", `http://${DEVICE_IP}`), "id=vmbm", {
    headers: {
        "Content-Type": "text/plain"
    },
    localAddress: DEVICE_INTERFACE
});
const initResponse = await initRequest.xml();

const deviceID = initResponse.picaso["p-answer"].id;
if (!deviceID) {
    throw new Error("Device ID not found, please check the device IP and interface");
}
console.log("Device ID:", deviceID);

// TODO
