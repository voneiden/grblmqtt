/**
 GrblMQTT provides a minimalistic serial<->MQTT interface tailored for communicating with Grbl.
 Copyright (C) 2016 Matti Eiden

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const serialport = require("serialport");


class SerialClient {
    constructor(main) {
        this.main = main;
        // TODO serial connecting and handshake received states
        this.connected = false;
        this.port = null;

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.write = this.write.bind(this);

        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleData = this.handleData.bind(this);
    }

    write(message, realtime=false, logging=true) {
        if (this.port != null) {
            if (!realtime) {
                message += "\n";
            }
            if (logging) {
                console.log("<<", message, realtime == true ? "(realtime)" : "");
            }
            this.port.write(message, function(err) {
                if (err) {
                    console.error("ERROR:", err);
                }
            });

        }
        else {
            publishSerialStatus();
        }
    }

    open(message) {
        message = message.toString("utf8");
        console.log("Serial open", message);
        this.port = new serialport(message, {
            baudRate: 115200,
            parser: serialport.parsers.readline('\r\n')
        });
        this.port.on('open', this.handleOpen);
        this.port.on('error', this.handleError);
        this.port.on('close', this.handleClose);
        this.port.on('data', this.handleData);
    }

    close() {
        this.port.close();
    }

    list(message) {
        serialport.list(this.main.mqttClient.publishSerialList);
    }

    handleOpen() {
        this.main.mqttClient.publishSerialStatus();
    }

    handleError(error) {

    }

    handleClose() {
        this.port = null;
        this.connected = false;
        this.main.grblStatusPoller.stop();
        this.main.mqttClient.publishSerialStatus();
    }

    handleData(data) {
        if (!this.connected && data.indexOf("Grbl") === 0) {
            // TODO need to store grbl version information?
            this.main.grblStatusPoller.start();
            this.connected = true;
            this.main.mqttClient.publishSerialStatus();
        }
        this.main.mqttClient.publishMessage(data);
    }

}

module.exports = SerialClient;