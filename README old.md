ttb-zwave
=========

A Zwave Node-RED node made for [TheThingBox](http://thethingbox.io/) project and [TimeSquAir](http://timesquair.io/).

## How to use Z-Wave

This documentation was made in order to provide a simple way to use [Z-wave](http://www.z-wave.com/) on your [ThingBox](http://thethingbox.io/) or your [TimeSquAir](http://timesquair.io/).

To do all further instructions you must have different things :

- A ThingBox (v1.8.0 and more) or a TimeSquAir (v0.0.5 and more)
- An [Aeon Labs Z-Stick S2](http://www.vesternet.com/downloads/dl/file/id/442/z_wave_aeon_labs_series_2_usb_controller_manual.pdf)
- Some Z-Wave sensors/acutators

### Creation of your Z-Wave network

Firstly, you have to create your Z-Wave network. Take your Aeon Labs Z-Stick S2 and all of your Z-Wave sensors/actuators on the same desk. 

Before any manipulation, you should check if your Z-Wave sensors/acuators have a battery inside. Indeed the majority of the devices works with battery(ies).

In this example the devices we used are :

- 1 Aeon Labs Z-Stick S2
- 2 Fibaro FGK 101 - 107

The next steps have to be executed in a very short interval.

1. Click on the Z-Stick's big button and the LED will blink slowly. Now your dongle has its inclusion mode activate
2. Take one of your Fibaro's door sensor and click 3 times on the external button in less than 1.5 seconds. The LED on the Z-Stick will blink fast during a network neighbor discovery and stay solid for 3 seconds to indicate successful inclusion of the sensor into the dongle's network. Then the dongle return to blinking slowly.
3. Take your second Fibaro's door sensor and repeat from the step 2. If your dongle stop to blinking at the end of step 2 repeat from step 1.

Now your Z-Wave network is set up. You have to configure your ThingBox/TimeSquAir.

------------

### Node-RED

In this part you have to go on your Node-RED web page via your favorite browser.

#### Installation of the node

To install the node you will use the `Import->Node` menu.

You have to write `ttb-zwave` in the form of this window. Click `OK` button, wait a moment for the installation and when the `Reboot` button can be clicked, click on it !

> The installation of the `ttb-zwave` node take more than 5 minutes so you have to wait until the end.

#### Creation of your flows

Now, refresh your web page and you will see the 3 new Z-Wave nodes in the palette at the `hardware` category. Drag and drop one `Z-Wave` node (the one without input and output) on your current workspace. 

Click on the `Activate` button and a new workspace called `Z-Wave` will be created if everything works correctly. In this workspace some `Z-Wave In` nodes are created. Their name represents the information that will be receive through MQTT.

Lastly, you are free to use them and planify your alerts.