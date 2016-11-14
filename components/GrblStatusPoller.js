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

module.exports = GrblStatusPoller;