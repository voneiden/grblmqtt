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


const mqtt = require("mqtt");

class MqttClient {
    constructor(main) {
        this.main = main;
        this.mqttClient = null;
        this.serialClient = null;

        this.connect = this.connect.bind(this);
        this.publishSerialStatus = this.publishSerialStatus.bind(this);
        this.publishSerialList = this.publishSerialList.bind(this);
        this.publishMessage = this.publishMessage.bind(this);

        this.onConnect = this.onConnect.bind(this);
        this.onError = this.onError.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onMessage = this.onMessage.bind(this);
    }

    connect(mqttUrl="localhost:1883") {
        console.log("Connecting MqttClient..");
        this.mqttClient = mqtt.connect("mqtt://" + mqttUrl);
        this.mqttClient.on("connect", this.onConnect);
        this.mqttClient.on("error", this.onError);
        this.mqttClient.on("close", this.onClose);
        this.mqttClient.on("message", this.onMessage);
    }

    publishSerialStatus() {
        this.mqttClient.publish("grbl/serial/status/response", this.main.serialClient.connected ? "1" : "0");
    }

    publishSerialList(error, ports) {
        var response = {
            error: error,
            ports: ports
        };
        this.mqttClient.publish("grbl/serial/list/response", JSON.stringify(response));
    }

    publishMessage(message) {
        //message = message.replace("\r", "");
        if (message.length) {
            if (message[0] == "<" && !this.main.grblStatusPoller.receivedUpdate) {
                this.main.grblStatusPoller.receivedUpdate = true;
                this.mqttClient.publish("grbl/status", message);
            }
            else {
                //console.log("PUBLISH MESSAGE:" + message, message.length);
                console.log(">>", message);
                this.mqttClient.publish("grbl/out", message);
            }
        }
    }



    onConnect() {
        console.log("MqttClient connected");
        this.mqttClient.subscribe("grbl/in/+");
        this.mqttClient.subscribe("grbl/serial/+");
    }
    onError() {

    }
    onClose() {

    }
    onMessage(topic, message, packet) {
        topic = topic.split("/");

        switch (topic[0]) {
            case "grbl":
                switch (topic[1]) {
                    case "serial":
                        switch (topic[2]) {
                            case "open":
                                this.main.serialClient.open(message);
                                break;

                            case "close":
                                this.main.serialClient.close(message);
                                break;

                            case "list":
                                this.main.serialClient.list(message);
                                break;

                            case "status":
                                this.publishSerialStatus();
                                break;
                        }
                        break;

                    case "in":
                        switch (topic[2]) {
                            case "message":
                                this.main.serialClient.write(message);
                                break;

                            case "realtime":
                                this.main.serialClient.write(message, true);
                                break;
                        }
                        break;

                }
                break;
        }
    }
}


module.exports = MqttClient;