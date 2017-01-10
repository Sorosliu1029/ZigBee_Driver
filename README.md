# ZigBee Driver for Ruff

Implement ZigBee driver for ZigBee Home-automation profile.
Could control ZigBee light with ZigBee switch.

## Supported Engines

* Ruff: 1.6.0

## Installing

Execute following command and enter a **supported model** to install.

```sh
# Please replace `<device-id>` with a proper ID.
# And this will be what you are going to query while `$('#<device-id>')`.
rap device add <device-id>

# Then enter a supported model, for example:
# ? model: {zigbee}
```

Other possible steps involved if any.

## Usage

Here is the basic usage of this driver.

```js
$('#<device-id>').startup();
$('#<device-id>').setToggleLight();
```

## API References

### Methods

#### `startup()`

Start up ZigBee network.

#### `setTurnLightOn()`

Enable turning-light-on function by setting an event listener.

#### `setTurnLightOff()`

Enable turning-light-off function by setting an event listener.

#### `setToggleLight()`

Enable toggling-light function by setting an event listener.

#### `resetDeviceList()`

Remove all saved device.

## FAQ
1. How to configure router board?

    Because there is no GPIO and other interfaces on common routers, so we need to configure `ruff_modules/ruff-mbd-v1/board.json` to the following json content:

    ```json
    {
        "version": "2.0",
        "id": "ruff-mbd-v1",
        "model": "ruff-mbd-v1",
        "preloads": {
            "uart-0": "uart-0/uart"
        },
        "outputs": {
            "uart-0": "uart-0/uart",
            "gnd-0": "ground/gnd-0",
            "vdd-0": "power/vdd-0"
        },
        "devices": [
            {
                "id": "ground",
                "outputs": {
                    "gnd-0": {
                        "type": "ground"
                    }
                }
            },
            {
                "id": "power",
                "outputs": {
                    "vdd-0": {
                        "type": "power",
                        "args": {
                            "voltage": "3.3v"
                        }
                    }
                }
            },
            {
                "id": "uart-0",
                "model": "ruff-sys-uart",
                "driver": "sys-uart",
                "inputs": {
                    "device": {
                        "type": "string",
                        "args": {
                            "path": "/dev/ttyUSB0"
                        }
                    }
                },
                "outputs": {
                    "uart" : {
                        "type":"uart"
                    }
                }
            }
        ]
}
```

## Contributing

Contributions to this project are warmly welcome. But before you open a pull request, please make sure your changes are passing code linting and tests.

You will need the latest [Ruff SDK](https://ruff.io/) to install rap dependencies and then to run tests.

### Installing Dependencies

```sh
npm install
rap install
```

### Running Tests

```sh
npm test
```

## License

The MIT License (MIT)

Copyright (c) 2017 Soros Liu.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

