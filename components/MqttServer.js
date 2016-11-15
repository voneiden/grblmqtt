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

const mosca = require("mosca");


class MqttServer {
    constructor(main) {
        this.main = main;
        this.server = null
    }

    start(websocketPort=1886) {
        let config = {
            http: {
                port: websocketPort,
                bundle: true,
                static: './'
            },
            logger: {
                level: 'error'
            }
        };
        this.server = new mosca.Server(config);

    }
}


module.exports = MqttServer;