import "dotenv/config";

import { createHTTPServer } from "./func/createHTTPServer.js";
import { getIDBlob } from "./func/getIDBlob.js";

let DEVICE_IP = process.env.UML295_TARGET_ADDRESS ?? "192.168.32.2";
let DEVICE_INTERFACE = process.env.UML295_INTERFACE;

const ID_BLOB = await getIDBlob(DEVICE_IP, DEVICE_INTERFACE);
const server = createHTTPServer(ID_BLOB);

const IP = process.env.REST_SERVER_IP || '::';
const PORT = process.env.REST_SERVER_PORT || '3000';
const http = server.listen(+PORT, IP, () => {
    const address = http.address();
    if (!address) {
        throw new Error('Server failed to start');
    }

    if (typeof address === 'string') {
        console.log(`Server listening on IPC ${address}`);
        return;
    }

    console.log(`Server listening on http://${address.address}:${address.port}`);
});
