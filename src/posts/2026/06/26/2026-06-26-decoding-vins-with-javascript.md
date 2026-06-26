---
layout: post
title: "Decoding VINs with an API"
date: "2026-06-26T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/cat-car.jpg
permalink: /2026/06/26/decoding-vins-with-api
description: Creating an API to wrap an API to decode VIN numbers.
---

Today's post took a bit of a pivot. I decided to work on a demo idea I had created way back in March. As I worked on it, I ran into multiple roadblocks, and while that original idea for a demo may still see the light of the day, I figured I'd at least share something that *did* work. 

## What's a VIN?

A VIN is a vehicle identification number. It's a standard that [dates back to 1954](https://en.wikipedia.org/wiki/Vehicle_identification_number) and identifies a particular car by manufacturer, make, model, year, and a heck of a lot more. A VIN is 17 characters avoiding the letters O, I, U, and Q to avoid confusion with some numbers. 

You can break down a VIN into various [components](https://en.wikipedia.org/wiki/Vehicle_identification_number#Components) if you want - but would still need to know various lookup values, for example a manufacturer referred to as `1FT` maps to Ford Truck. 

## Decoding a VIN via API

As part of the demo that didn't quite make it, I needed to decode a VIN value. I had a commercial service in mind but it had a pretty limited free tier (50 calls). Turns out, the [National Highway Traffic Safety Administration](https://www.nhtsa.gov/) actually has a bunch of APIs, multiple of which work with VINs.

The [Vehicle API](https://vpic.nhtsa.dot.gov/api/) is free, with no limits (outside of not being a jerk), and requires no API keys at all. 

The one we want is the `Decode VIN Extended (flat format)` endpoint. Why "flat format"? The initial API returns information that very much looks like XML translated to JSON, which to be fair, it is, and while the data is all there, it's a bit ugly. The `flat format` makes it look quite a bit nicer. 

To use the API, simply include the VIN in the URL and ensure you add `?format=json`: <https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/3VV3B7AXXNM077525?format=json>

This returns:

```json
{
  "Count": 1,
  "Message": "Results returned successfully. NOTE: Any missing decoded values should be interpreted as NHTSA does not have data on the specific variable. Missing value should NOT be interpreted as an indication that a feature or technology is unavailable for a vehicle.",
  "SearchCriteria": "VIN(s): 3VV3B7AXXNM077525",
  "Results": [
    {
      "ABS": "Standard",
      "ActiveSafetySysNote": "",
      "AdaptiveCruiseControl": "Standard",
      "AdaptiveDrivingBeam": "Standard",
      "AdaptiveHeadlights": "",
      "AdditionalErrorText": "",
      "AirBagLocCurtain": "1st Row (Driver and Passenger)",
      "AirBagLocFront": "1st Row (Driver and Passenger)",
      "AirBagLocKnee": "",
      "AirBagLocSeatCushion": "",
      "AirBagLocSide": "1st Row (Driver and Passenger)",
      "AutoReverseSystem": "Standard",
      "AutomaticPedestrianAlertingSound": "",
      "AxleConfiguration": "",
      "Axles": "",
      "BasePrice": "",
      "BatteryA": "",
      "BatteryA_to": "",
      "BatteryCells": "",
      "BatteryInfo": "",
      "BatteryKWh": "",
      "BatteryKWh_to": "",
      "BatteryModules": "",
      "BatteryPacks": "",
      "BatteryType": "",
      "BatteryV": "",
      "BatteryV_to": "",
      "BedLengthIN": "",
      "BedType": "",
      "BlindSpotIntervention": "",
      "BlindSpotMon": "Standard",
      "BodyCabType": "",
      "BodyClass": "Sport Utility Vehicle [SUV]/Multipurpose Vehicle [MPV]",
      "BrakeSystemDesc": "",
      "BrakeSystemType": "",
      "BusFloorConfigType": "Not Applicable",
      "BusLength": "",
      "BusType": "Not Applicable",
      "CAN_AACN": "",
      "CIB": "Standard",
      "CashForClunkers": "",
      "ChargerLevel": "",
      "ChargerPowerKW": "",
      "CombinedBrakingSystem": "",
      "CoolingType": "",
      "CurbWeightLB": "",
      "CustomMotorcycleType": "Not Applicable",
      "DaytimeRunningLight": "Standard",
      "DestinationMarket": "",
      "DisplacementCC": "2000.0",
      "DisplacementCI": "122.04748818946",
      "DisplacementL": "2.0",
      "Doors": "",
      "DriveType": "",
      "DriverAssist": "",
      "DynamicBrakeSupport": "Standard",
      "EDR": "",
      "ESC": "Standard",
      "EVDriveUnit": "",
      "ElectrificationLevel": "",
      "EngineConfiguration": "",
      "EngineCycles": "",
      "EngineCylinders": "4",
      "EngineHP": "184",
      "EngineHP_to": "",
      "EngineKW": "",
      "EngineManufacturer": "Volkswagen",
      "EngineModel": "",
      "EntertainmentSystem": "",
      "ErrorCode": "0",
      "ErrorText": "0 - VIN decoded clean. Check Digit (9th position) is correct",
      "ForwardCollisionWarning": "Standard",
      "FuelInjectionType": "",
      "FuelTankMaterial": "",
      "FuelTankType": "",
      "FuelTypePrimary": "Gasoline",
      "FuelTypeSecondary": "",
      "GCWR": "",
      "GCWR_to": "",
      "GVWR": "Class 1D: 5,001 - 6,000 lb (2,268 - 2,722 kg)",
      "GVWR_to": "",
      "KeylessIgnition": "Standard",
      "LaneCenteringAssistance": "",
      "LaneDepartureWarning": "Standard",
      "LaneKeepSystem": "Standard",
      "LowerBeamHeadlampLightSource": "LED",
      "Make": "VOLKSWAGEN",
      "MakeID": "482",
      "Manufacturer": "VOLKSWAGEN DE MEXICO SA DE CV",
      "ManufacturerId": "16478",
      "Model": "Tiguan",
      "ModelID": "8151",
      "ModelYear": "2022",
      "MotorcycleChassisType": "Not Applicable",
      "MotorcycleSuspensionType": "Not Applicable",
      "NCSABodyType": "",
      "NCSAMake": "",
      "NCSAMapExcApprovedBy": "",
      "NCSAMapExcApprovedOn": "",
      "NCSAMappingException": "",
      "NCSAModel": "",
      "NCSANote": "",
      "NonLandUse": "",
      "Note": "",
      "OtherBusInfo": "",
      "OtherEngineInfo": "Test Group: NVGAJ02.0V3A / Emission Std.: Tier 3 BIN 30 LEV3 SULEV30",
      "OtherMotorcycleInfo": "",
      "OtherRestraintSystemInfo": "Seat Belt: Active-Dr/Pass / Advanced Front Airbags",
      "OtherTrailerInfo": "",
      "ParkAssist": "",
      "PedestrianAutomaticEmergencyBraking": "",
      "PlantCity": "PUEBLA",
      "PlantCompanyName": "",
      "PlantCountry": "MEXICO",
      "PlantState": "",
      "PossibleValues": "",
      "Pretensioner": "",
      "RearAutomaticEmergencyBraking": "Standard",
      "RearCrossTrafficAlert": "Standard",
      "RearVisibilitySystem": "Standard",
      "SAEAutomationLevel": "",
      "SAEAutomationLevel_to": "",
      "SeatBeltsAll": "Manual",
      "SeatRows": "2",
      "Seats": "5",
      "SemiautomaticHeadlampBeamSwitching": "Standard",
      "Series": "",
      "Series2": "",
      "SteeringLocation": "",
      "SuggestedVIN": "",
      "TPMS": "Indirect",
      "TopSpeedMPH": "",
      "TrackWidth": "",
      "TractionControl": "Standard",
      "TrailerBodyType": "Not Applicable",
      "TrailerLength": "",
      "TrailerType": "Not Applicable",
      "TransmissionSpeeds": "8",
      "TransmissionStyle": "Automatic",
      "Trim": "SE",
      "Trim2": "",
      "Turbo": "",
      "VIN": "3VV3B7AXXNM077525",
      "ValveTrainDesign": "",
      "VehicleDescriptor": "3VV3B7AX*NM",
      "VehicleType": "MULTIPURPOSE PASSENGER VEHICLE (MPV)",
      "WheelBaseLong": "",
      "WheelBaseShort": "",
      "WheelBaseType": "",
      "WheelSizeFront": "",
      "WheelSizeRear": "",
      "WheelieMitigation": "",
      "Wheels": "",
      "Windows": ""
    }
  ]
}
```

This is, indeed, my car and the data is spot on. If you pass an invalid VIN, the values for `ErrorCode` and `ErrorText` will include pertinent information. As an example, this [URL](https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/999999999993VV3B7AXXNM077525?format=json) with a messed up VIN gives:

```js
{ 
// All the usual keys
"ErrorCode": "1,7,400",
"ErrorText": "1 - Check Digit (9th position) does not calculate properly; 7 - Manufacturer is not registered with NHTSA for sale or importation in the U.S. for use on U.S roads; Please contact the manufacturer directly for more information; 400 - Invalid Characters Present",
 // more
}
```

Note that as I said in the code block, you still get *all* the other keys as well, so you need to check for `ErrorCode` being "0" (note that it's a string, not a number) before you can use the data. 

But - the API tries its best to decode as much as possible. So for example, if I remove one value from my VIN, I get an error ("6 - Incomplete VIN"), but it still returns the right make and model for my car. 

Depending on your particular need, you may not want to treat errors as a boolean state and see what you can get away with.

## Putting a Bow on It

Alright, so while this worked, I thought I'd make a quick trip to [Val Town](https://val.town) to build a slightly nicer API wrapper for this. My code would do two things:

* Return an object with two keys, `vehicle` and `error`.
* `vehicle` is the vehicle information result, just the first one, but with keys lowercased because there's no need to write more APIs the Microsoft way.
* `error` will check if `ErrorCode` isn't "0", and if so, will be populated with `ErrorText`.

In Val Town, I created a new val with a HTTP trigger. I look for the VIN in the URL, and if it's there, pass it to the NHTSA's API and shape the API as I described above. That's literally it.

```js
export default async function (req: Request): Promise<Response> {
  const url = new URL(req.url);
  const vin = url.searchParams.get("vin");

  if (!vin) {
    return new Response(
      JSON.stringify({ error: "Missing 'vin' query parameter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const vinreq = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`,
  );
  const data = await vinreq.json();

  const result = {
    vehicle: lowerCaseKeys(data.Results[0]),
    error: null,
  };

  if (data.Results[0].ErrorCode !== "0") {
    result.error = data.Results[0].ErrorText;
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
}

function lowerCaseKeys(obj) {
  const result = {};
  for (const key of Object.keys(obj)) {
    result[key.toLowerCase()] = obj[key];
  }
  return result;
}
```

This API is up and running at https://raymondcamden--a5e2f648718311f1ace11607ee4eb77e.web.val.run, and you can see the full Val here, <https://www.val.town/x/raymondcamden/vin-api>. 

## Quick Demo

I went to *another* code hosting service, Code Pen, to create a quick and simple demo. If you open your browser to <https://new-thunder-treefrog.codepen.app/>, you can enter a VIN, hit the button, and see the result dumped on screen. The entire Val Town integration was just a `fetch` call:

```js
let req = await fetch(`https://raymondcamden--a5e2f648718311f1ace11607ee4eb77e.web.val.run/?vin=${vin}`);
let result = await req.json();
```

Here's the CodePen itself if you want to fork, or run the demo here. 

<p class="codepen" data-theme-id="-2" data-height="600" data-pen-title="VIN API Tester" data-preview="true" data-version="2" data-default-tab="result" data-slug-hash="MYJvybX" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/editor/cfjedimaster/pen/019f0545-661f-7a5d-9000-89ba9b41fca3">
  VIN API Tester</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://public.codepenassets.com/embed/index.js"></script>

Photo by <a href="https://unsplash.com/@elisasch?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Elisa Schmidt</a> on <a href="https://unsplash.com/photos/cat-on-a-car-during-daytime-C2c4G3by4ZE?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      