GrblMQTT
========

GrblMQTT provides a minimalistic serial<->MQTT interface to grbl.


MQTT API Topics 
---------------

Endpoints for frontend clients to publish to

| Topic              | Description                                                       | Message        |
|--------------------|-------------------------------------------------------------------|----------------|
| grbl/serial/list   | Publish to request a list of serial ports                         | None           |
| grbl/serial/open   | Publish to open port                                              | Port name      |
| grbl/serial/close  | Publish to close port                                             | None           |
| grbl/serial/status | Publish to request a serial status report                         | None           |
| grbl/in/message    | Publish to send normal message to grlb (CRLF added automatically) | Ex: G1 X10 Y10 |
| grbl/in/realtime   | Publish to send realtime message to grbl                          | Ex: ?          |

Endpoints for frontend clients to subscribe to

| Topic                       | Description                                               | Message    |
|-----------------------------|-----------------------------------------------------------|------------|
| grbl/serial/list/response   | Response contains JSON object containing port information | Ex: TODO   |
| grbl/serial/status/response | Response contains 0 or 1 (serial open)                    | Ex: 1      |
| grbl/out                    | Response contains message sent out by grbl (string)       | Ex: ok     |
| grbl/status                 | Periodically publishing grbl status line                  | Ex: <TODO> |



