import express from 'express';
import { createServer } from 'http';
import { timingSafeEqual } from 'crypto';
import type { IDBlob } from './types.js';
import { getMessages } from './func/getMessages.js';

export function initServer(idBlob: IDBlob) {
    const IP = process.env.REST_SERVER_IP || '::';
    const PORT = process.env.REST_SERVER_PORT || '3000';

    const app = express();
    const server = createServer(app);

    const auth = app
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

    auth
        .get('/message', async (_req, res) => {
            const messages = await getMessages(idBlob);
            res.json(messages);
        });
    //TODO

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
