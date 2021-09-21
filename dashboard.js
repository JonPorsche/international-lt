'use strict';

const minBrightness = 0.1;
const maxBrightness = 1.0;

function dashLights(electricOn) {
    const svgGaugeRpm1 = document.getElementById('gauge-rpm-1');
    const svgGaugeRpm2 = document.getElementById('gauge-rpm-2');
    const svgGaugeSpeed1 = document.getElementById('gauge-speed-1');
    const svgGaugeSpeed2 = document.getElementById('gauge-speed-2');
    const svgGaugeOilPressure = document.getElementById('gauge-oil-pressure');
    const svgGaugeAdblue = document.getElementById('gauge-adblue');
    const svgGaugeWaterTemp = document.getElementById('gauge-water-temperature');
    const svgGaugeAirPressure = document.getElementById('gauge-air-pressure');
    const svgGaugeAirPressure2 = document.getElementById('gauge-air-pressure-2');
    const svgGaugeFuel = document.getElementById('gauge-fuel');

    const colorOn1 = '#ff3636';
    const colorOn2 = '#ff0000';
    const colorOff1 = '#350b0b';
    const colorOff2 = '#670d0d';

    if (!electricOn) {
        svgGaugeRpm1.style.fill = colorOff1;
        svgGaugeRpm2.style.fill = colorOff2;
        svgGaugeSpeed1.style.fill = colorOff1;
        svgGaugeSpeed2.style.fill = colorOff2;
        svgGaugeOilPressure.style.fill = colorOff2;
        svgGaugeAdblue.style.fill = colorOff2;
        svgGaugeWaterTemp.style.fill = colorOff2;
        svgGaugeAirPressure.style.fill = colorOff2;
        svgGaugeAirPressure2.style.fill = colorOff2;
        svgGaugeFuel.style.fill = colorOff2;
        $('#scales-1').css('opacity', 0.3);
        $('#scales-2').css('opacity', 0.3);
        $('#scales-3').css('opacity', 0.3);
        $('#dash-computer').css('visibility', 'hidden');

    } else {
        svgGaugeRpm1.style.fill = colorOn1;
        svgGaugeRpm2.style.fill = colorOn2;
        svgGaugeSpeed1.style.fill = colorOn1;
        svgGaugeSpeed2.style.fill = colorOn2;
        svgGaugeOilPressure.style.fill = colorOn2;
        svgGaugeAdblue.style.fill = colorOn2;
        svgGaugeWaterTemp.style.fill = colorOn2;
        svgGaugeAirPressure.style.fill = colorOn2;
        svgGaugeAirPressure2.style.fill = colorOn2;
        svgGaugeFuel.style.fill = colorOn2;
        $('#scales-1').css('opacity', 1);
        $('#scales-2').css('opacity', 1);
        $('#scales-3').css('opacity', 1);
        $('#dash-computer').css('visibility', 'visible');

    }
}

function getBrightVariationFactor(timeScale){
    const brightGap = maxBrightness - minBrightness;
    const fps = 60;
    // console.log(`timeScale = ${timeScale} brightGap = ${brightGap}; Bright variation factor = ${brightVariationFactor}`);
    return brightGap / (60 / timeScale * 60 * fps);
}

function setBrightness(brightValue) {
    $('.bkg-elements').css('filter', `brightness(${brightValue})`);
}

/*  Changes the dashboard ilumination according to the current day hour.
    Affects only background images.
 */
function dashIlumination(hour, brightValue, variation) {
    if (hour >= 5 && hour < 8) {
        if(brightValue < maxBrightness) setBrightness(brightValue + variation);
    } else if (hour >= 8 && hour < 18) {
        if(brightValue != maxBrightness) setBrightness(maxBrightness);
    } else if (hour >= 18 && hour < 21) {
        if (brightValue > minBrightness) setBrightness(brightValue - variation);
        else setBrightness(minBrightness);
    } else if (hour >= 21 && hour < 5) {
        if(brightValue != minBrightness) setBrightness(minBrightness);
    }
}

Funbit.Ets.Telemetry.Dashboard.prototype.initialize = function (skinConfig, utils) {
    $.getScript(`skins/${skinConfig.name}/js/TelemetryManager.js`, function () {
        //
        // skinConfig - a copy of the skin configuration from config.json
        // utils - an object containing several utility functions (see skin tutorial for more information)
        //

        // this function is called before everything else,
        // so you may perform any DOM or resource initializations / image preloading here

        utils.preloadImages([
            'images/png/bkg-layer-0.png', 'images/png/bkg-layer-1.png', 'images/png/gauge-center-left.png',
            'images/png/gauge-center-right.png', 'images/png/gauge-center-shadows.png'
        ]);

        // return to menu by a click
        $(document).add('body').on('click', function () {
            window.history.back();
        });

        Funbit.Ets.Telemetry.Dashboard.prototype.filter = function (data, utils) {
            //
            // data - telemetry data JSON object
            // utils - an object containing several utility functions (see skin tutorial for more information)
            //

            // This filter is used to change telemetry data
            // before it is displayed on the dashboard.
            // You may convert km/h to mph, kilograms to tons, etc.

            // convert kilometers per hour to miles per hour
            data.truck.speedMph = data.truck.speed * 0.621371;

            // round truck speed
            data.truck.speedRounded = (Math.abs(data.truck.speed > 0
                ? Math.floor(data.truck.speed)
                : Math.round(data.truck.speed))) * 0.621371;

            // convert kg to t
            data.trailer.mass = (data.trailer.mass / 1000.0) + 't';
            // format odometer data as: 00000.0
            data.truck.odometer = utils.formatFloat(data.truck.odometer, 1);
            // convert gear to readable format
            data.truck.gear = data.truck.gear > 0 ? 'D' + data.truck.gear : (data.truck.gear < 0 ? 'R' : 'N');
            // convert rpm to rpm * 100
            data.truck.engineRpm = data.truck.engineRpm / 100;
            // return changed data to the core for rendering

            return data;
        };

        Funbit.Ets.Telemetry.Dashboard.prototype.render = function (data, utils) {
            //
            // data - same data object as in the filter function
            // utils - an object containing several utility functions (see skin tutorial for more information)
            //

            // we don't have anything custom to render in this skin,
            // but you may use jQuery here to update DOM or CSS

            dashLights(data.truck.electricOn);

            const brightness = $('.bkg-elements').css('filter');
            let regexp = '[\\d\\.]+';
            const brightValue = parseFloat(brightness.match(regexp));

            const gameTime = data.game.time;
            regexp = '\\b\\d+(?=[^\\d<]*:\\d+)';
            const hour = parseInt(gameTime.match(regexp));
            const variation = getBrightVariationFactor(data.game.timeScale);

            // Rounded just for debug output purposes
            const roundBrightValue = brightValue.toFixed(8);

            console.log(`Game time: ${gameTime}; Extracted hour: ${hour}; Brightness value: ${brightValue}`);
            document.getElementById("brightValue").textContent=roundBrightValue;
            document.getElementById("hour").textContent=hour;

            dashIlumination(hour, brightValue, variation);
        }
    });
}


