/**
 *	8.2.0
 *	Generation date: 2021-03-01T14:52:45.664Z
 *	Client name: feel option
 *	Package Type: Technical Analysis 8.2
 *	License type: trial
 *	Expiration date: "2021/04/01"
 *	iFrame lock: true
 */

/***********************************************************
 * Copyright by ChartIQ, Inc.
 * Licensed under the ChartIQ, Inc. Developer License Agreement https://www.chartiq.com/developer-license-agreement
*************************************************************/
/*************************************** DO NOT MAKE CHANGES TO THIS LIBRARY FILE!! **************************************/
/* If you wish to overwrite default functionality, create a separate file with a copy of the methods you are overwriting */
/* and load that file right after the library has been loaded, but before the chart engine is instantiated.              */
/* Directly modifying library files will prevent upgrades and the ability for ChartIQ to support your solution.          */
/*************************************************************************************************************************/
/* eslint-disable no-extra-parens */


////////////////////////////////////////////////////////////////////////////////////////////
//
// ChartIQ Study Calculator Module Detailed Example
//
// Demonstrates running ChartIQ studies in Node.js. Uses ES6 module import syntax.
//
// To run this example:
// 1. Extract the contents of your zipped ChartIQ library package
// 2. Adjust the path to the tarball from the extracted library package (.tgz file)
//    in the dependencies section of the package.json in the chartiq/modules/studycalc directory
// 3. Run the following commands from the chartiq/modules/studycalc directory:
//    - "npm install" to install the ChartIQ library
//    - "npm run detailed" to run this file (detailedExample.js) in Node.js
//
//    On Node.js versions prior to v13 (which do not support ES6 import syntax), run:
//    - "npm run detailed:old"
//
////////////////////////////////////////////////////////////////////////////////////////////

// import your chartiq charting license here (license should not be domain locked)
import { CIQ as ciq } from "chartiq/js/advanced.js";
// optionally import a market definition (for those studies that use it)
import "chartiq/examples/markets/marketDefinitionsSample.js";
// import the StudyCalculator
import StudyCalculator from "chartiq/modules/studycalc/study-calculator.js";

// import sample data
import sampledata from "chartiq/examples/data/STX_SAMPLE_5MIN.js";

for (var bar = 0; bar < sampledata.length; bar++) {
	var record = sampledata[bar];
	record.DT = new Date(record.Date);
	record.SPY = record.Close + Math.random() - 0.5; // For comparison studies
}

// Instantiate a StudyCalculator instance
var studyCalculator = new StudyCalculator(ciq, {
	interval: 5,
	symbolObject: { symbol: "IBM" }
});

// Add Studies to fetch into the calculator, here we fetch 'em all with default inputs
// except for correlation which requires input
for (var libraryEntry in ciq.Studies.studyLibrary) {
	var inputs = null;
	if (libraryEntry == "correl") inputs = { "Compare To": "SPY", Period: 14 };
	studyCalculator.addStudy(libraryEntry, inputs);
}

// Simulate calculating studies upon receiving data 25 bars at a time
var RECORDS_TO_FETCH = 25;
for (
	var lastIndex = 0;
	lastIndex < sampledata.length;
	lastIndex += RECORDS_TO_FETCH
) {
	var newlyFetchedRecords = sampledata.slice(
		lastIndex,
		lastIndex + RECORDS_TO_FETCH
	);
	studyCalculator.addData(newlyFetchedRecords);
	studyCalculator.calculate();
	// output the errors to the console
	/*
	var errors=studyCalculator.getErrors();
	for(var e in errors) console.log(errors[e]);
	*/
}

// Output calculation results to console.
var TEST_RESULT_RECORD = 500; // let's output the 500th record of the results
var results = studyCalculator.getResults(TEST_RESULT_RECORD);
for (var f in results) console.log(f + ":" + results[f]);
