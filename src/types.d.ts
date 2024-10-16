import type { Agent } from "http";

interface IDBlob {
    ip: string;
    if?: string;
    id: string;
    agent: Agent;

    d: {
        phone: string;
        imei: string;
        esn: string;
        meid: string;
        iccid: string;
        imsi: string;
    }
}

export {
    IDBlob
}
