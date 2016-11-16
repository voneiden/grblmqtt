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
    constructor(main, interval=200, timeout=10000) {
        this.main = main;
        this.running = false;

        this.receivedUpdate = false;

        this.pollInterval = interval;
        this.intervalTimer = null;

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.poll = this.poll.bind(this);
    }

    start() {
        this.running = true;
        this.intervalTimer = global.setInterval(this.poll, this.pollInterval);
    }

    stop() {
        this.running = false;
        global.clearInterval(this.intervalTimer);
    }


    poll() {
        if (this.running) {
            this.main.serialClient.write("?", true, false);
            this.receivedUpdate = false;
        }
    }
}

module.exports = GrblStatusPoller;