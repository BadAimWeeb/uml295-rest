declare global {
    namespace NodeJS {
        interface ProcessEnv {
            UML295_TARGET_ADDRESS?: string;
            UML295_INTERFACE?: string;
            /** Default to all bind (::) */
            REST_SERVER_IP?: string;
            /** Default to port 3000 */
            REST_SERVER_PORT?: string;
            /** 
             * Authentication credentials for client. This is not recommended for production, 
             * please use an external reverse proxy with authentication capabilities. 
             * 
             * USER:PASS format if set. 
             */
            CHALLENGE_AUTHENTICATION?: string;
        }
    }
}

export { }