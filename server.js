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


var mosca = require("mosca");
var server = new mosca.Server({
    http: {
        port: 1886,
        bundle: true,
        static: './'
    },
    logger: {
        level: 'error'
    }
});


var mqtt = require("mqtt");
var serialport = require("serialport");
var port = null;

var mqttUrl = "localhost:1883";


var mqttclient = mqtt.connect("mqtt://" + mqttUrl);
mqttclient.on("connect", onMqttConnect);
mqttclient.on("error", onMqttError);
mqttclient.on("close", onMqttClose);
mqttclient.on("message", onMqttMessage);



function onMqttConnect() {
    mqttclient.subscribe("grbl/in/+");
    mqttclient.subscribe("grbl/serial/+");
}

function onMqttError() {

}

function onMqttClose() {

}



function onMqttMessage(topic, message, packet) {
    topic = topic.split("/");
    //message = message.toString("utf8");

    switch (topic[0]) {
        case "grbl":
            switch (topic[1]) {
                case "serial":
                    switch (topic[2]) {
                        case "open":
                            serialOpen(message);
                            break;

                        case "close":
                            serialClose(message);
                            break;

                        case "list":
                            serialList(message);
                            break;

                        case "status":
                            publishSerialStatus();
                            break;
                    }
                    break;

                case "in":
                    switch (topic[2]) {
                        case "message":
                            proxyToGrbl(message);
                            break;

                        case "realtime":
                            proxyToGrbl(message, true);
                            break;
                    }
                    break;

            }
            break;
    }
}


function proxyToGrbl(message, realtime) {
    if (port != null) {
        if (!realtime) {
            message += "\n";
        }
        console.log("<<", message, realtime == true ? "(realtime)" : "");
        port.write(message, function(err) {
            if (err) {
                console.error("ERROR:", err);
            }
        });

    }
    else {
        publishSerialStatus();
    }
}

class GrblStatusPoller {
    constructor(interval=200, timeout=10000) {
        this.running = false;
        this.receivedUpdate = null;
        this.missingOkCount = 0;


        this.pollInterval = interval;
        this.timeoutTime = timeout;
        this.timeoutTimer = null;

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.prepareNextPoll = this.prepareNextPoll.bind(this);
        this.poll = this.poll.bind(this);
        this.poll2 = this.poll2.bind(this);

        this.statusReceived = this.statusReceived.bind(this);
        this.okReceived = this.okReceived.bind(this);
    }

    start() {
        this.running = true;
        this.prepareNextPoll();
    }

    stop() {
        this.running = false;
    }

    prepareNextPoll() {
        console.log("Prepare next poll");
        global.clearTimeout(this.timeoutTimer);
        global.setTimeout(this.poll, this.pollInterval);
    }

    statusReceived() {
        this.receivedUpdate = true;
        this.missingOkCount += 1;
        this.prepareNextPoll();
    }

    okReceived() {
        this.missingOkCount -= 1;
    }

    poll2() {
        console.warn("Timeout occured");
        this.poll();
    }
    poll() {
        console.log("poll");
        global.clearTimeout(this.timeoutTimer);

        if (this.running) {
            port.write("?\n");
            this.receivedUpdate = false;
            this.receivedOk = false;
            this.timeoutTimer = global.setTimeout(this.poll2, this.timeoutTime);
        }
    }
}

function serialOpen(message) {
    message = message.toString("utf8");
    console.log("Serial open", message);
    port = new serialport(message, {
        baudRate: 115200,
        parser: serialport.parsers.readline('\r\n')
    });
    port.on('open', handleSerialOpen);
    port.on('error', handleSerialError);
    port.on('close', handleSerialClose);
    port.on('data', handleSerialData);

}

function publishSerialStatus() {
    mqttclient.publish("grbl/serial/status/response", port == null ? "0" : "1");
}


var skipOk = false;
function publishMessage(message) {
    //message = message.replace("\r", "");
    if (message.length) {
        if (message[0] == "<" && !grblStatusPoller.receivedUpdate) {
            grblStatusPoller.statusReceived();
            console.log(">> STATUS");
            mqttclient.publish("grbl/status", message);
        }
        else if (grblStatusPoller.missingOkCount > 0 && message == "ok") {
            grblStatusPoller.okReceived();
        }
        else {
            //console.log("PUBLISH MESSAGE:" + message, message.length);
            console.log(">>", message);
            mqttclient.publish("grbl/out", message);
        }
    }
}

var grblStatusPoller = new GrblStatusPoller();
function handleSerialOpen() {
    publishSerialStatus();
}

function handleSerialError(error) {

}

function handleSerialClose() {
    port = null;
    grblStatusPoller.stop();
    publishSerialStatus();
}
let grblLine = null;
function handleSerialData(data) {
    if (grblLine == null && data.indexOf("Grbl") === 0) {
        grblLine = data;
        grblStatusPoller.start();
    }
    publishMessage(data);
}


function serialClose(message) {

}

function serialList(message) {
    serialport.list(publishSerialList);
}

function publishSerialList(error, ports) {
    var response = {
        error: error,
        ports: ports
    };
    mqttclient.publish("grbl/serial/list/response", JSON.stringify(response));
}