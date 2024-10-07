# uml295-rest

Alternative SMS REST API for UML295 modem.

### Why?

The correct way to interact with GSM modems is to use AT commands (and `gammu`?). However, UML295 (at least the one I have) has a very broken AT command support for SMS, and `gammu` failed to control it.

Fortunately, UML295 has a web interface that can be used to send and receive SMS. This project is a simple REST API that uses the interface and expose simple endpoints to send and receive SMS.

> [!IMPORTANT]
> If you're using multiple UML295 modems, you MUST assign different interface IP in `192.168.32.0/24` range and specify the interface IP in `.env` file.

> [!TIP]
> If you're not planning to use the modem for internet connection, you should remove default gateway/route from the modem interface for better performance.
