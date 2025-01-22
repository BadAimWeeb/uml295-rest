import express from 'express';
import compression from 'compression';
import { createServer } from 'http';
import { timingSafeEqual } from 'crypto';
import type { IDBlob } from './types.js';
import { getMessages } from './func/getMessages.js';
import { markReadMessage } from './func/markReadMessage.js';
import { deleteMessage } from './func/deleteMessage.js';
import sse, { type ISseResponse } from '@toverux/expresse';
import { sendMessage } from './func/sendMessage.js';

export function initServer(idBlob: IDBlob) {
    const IP = process.env.REST_SERVER_IP || '::';
    const PORT = process.env.REST_SERVER_PORT || '3000';

    const app = express();
    const server = createServer(app);

    const auth = app
        .use(compression())
        .use(express.json())
        .use(express.urlencoded({ extended: true }))
        .use((req, res, next) => {
            if (process.env.CHALLENGE_AUTHENTICATION) {
                // CHALLENGE_AUTHENTICATION is enabled and is in user:pass format
                const authHeader = req.headers.authorization;
                if (!authHeader) {
                    res.status(401).send('Unauthorized');
                    return;
                }

                const headerUserPass = Buffer.from(authHeader.split(' ')[1] ?? "", 'base64');
                const localUserPass = Buffer.from(process.env.CHALLENGE_AUTHENTICATION, 'utf-8');

                // safe compare
                if (!timingSafeEqual(headerUserPass, localUserPass)) {
                    res.status(401).send('Unauthorized');
                    return;
                }
            }

            next();
        });

    const rIDMapping = new Map<number, [Set<number>, Map<number, string>]>();
    const rIDTimeout = new Map<number, ReturnType<typeof setTimeout>>();
    let streamID = 0;

    auth
        .get('/message', async (_req, res) => {
            const messages = await getMessages(idBlob);
            res.json(messages);
        })
        .patch('/message/:messageID', async (req, res) => {
            const messageID = parseInt(req.params.messageID, 10);
            await markReadMessage(idBlob, messageID);
            res.json({ success: true });
        })
        .delete('/message/:messageID', async (req, res) => {
            const messageID = parseInt(req.params.messageID, 10);
            const messages = await getMessages(idBlob);

            let msg = messages.find((m) => m.id === messageID);
            if (!msg) {
                res.status(404).json({ success: false, error: 'Message not found' });
                return;
            }

            await deleteMessage(idBlob, messageID, msg.direction);
            res.json({ success: true });
        })
        .put('/message', async (req, res) => {
            let { to, message, smartEncodingMap } = req.body;
            if (!to || !message) {
                res.status(400).json({ success: false, error: 'Missing required fields' });
                return;
            }

            await sendMessage(idBlob, to, message, smartEncodingMap);
            res.json({ success: true });
        })
        .get('/message-stream', sse({ flushAfterWrite: true }),
            // @ts-expect-error
            async (req, res: ISseResponse) => {
                let messageId = parseInt(req.header('Last-Event-ID') ?? "", 10) || streamID++;

                const [seenMsgs, statusTrack] = rIDMapping.get(messageId) ?? [new Set<number>(), new Map<number, string>()];
                rIDMapping.set(messageId, [seenMsgs, statusTrack]);

                for (;;) {
                    if (res.closed) break;
                    clearInterval(rIDTimeout.get(messageId));

                    const messages = await getMessages(idBlob);
                    for (const msg of messages) {
                        if (seenMsgs.has(msg.id + (msg.timestamp << 8))) {
                            if (statusTrack.get(msg.id) !== msg.status) {
                                res.sse.event("status-change", JSON.stringify({
                                    id: msg.id,
                                    status: msg.status
                                }), messageId.toString());
                                statusTrack.set(msg.id, msg.status);
                            }

                            continue;
                        }

                        seenMsgs.add(msg.id + (msg.timestamp << 8));
                        res.sse.data(JSON.stringify({
                            id: msg.id,
                            direction: msg.direction,
                            from: msg.from,
                            to: msg.to,
                            timestamp: msg.timestamp,
                            subject: msg.subject,
                            body: msg.body,
                            status: msg.status,
                            error: msg.error
                        }), messageId.toString());

                        statusTrack.set(msg.id, msg.status);
                    }

                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }

                rIDTimeout.set(messageId, setTimeout(() => {
                    rIDMapping.delete(messageId);
                    rIDTimeout.delete(messageId);
                }, 300000));
            }
        );

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
}
