/**
 *	8.2.0
 *	Generation date: 2021-03-29T06:25:04.887Z
 *	Client name: chartiq-library-trial
 *	Package Type: Technical Analysis AutoTrial
 *	License type: annual
 *	Expiration date: "2021-04-28"
 *	Domain lock: ["127.0.0.1","localhost","chartiq.com"]
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


import { CIQ, createTermStructureDataSegment } from "./termstructureRender.js";

let _css;
if (
	typeof define === "undefined" &&
	typeof module === "object" &&
	typeof require === "function"
) {
	_css = require("./termstructure.css");
} else if (typeof define === "function" && define.amd) {
	define(["./termstructure.css"], function (m) {
		_css = m;
	});
}

/**
 * Creates a term structure chart.
 *
 * ![Yield Curve](./img-Term-Structure.png)
 * <span class="figure-caption"><b>Figure.</b> Term structure chart with comparison and historical
 * curves, crosshairs, and heads up display.</span>
 *
 * A term structure compares the value of related financial instruments. For example, the U.S.
 * Treasury yield curve is a term structure that compares the interest rates of Treasury
 * securities that have different maturity dates (see image above).
 *
 * A term structure chart shows the different instruments on the x&#8209;axis &mdash; with either
 * uniform or scaled spacing &mdash; and the instrument values on the y&#8209;axis. A chart
 * consists of a main curve for a primary entity (such as the U.S. Treasury) and optional
 * comparison curves for other entities or historical curves for the primary entity. (Entities
 * create or provide instruments or serve as a means of relating instruments.)
 *
 * The chart supports daily data for historical points and intra-day data for the current date.
 * The chart expects data to be in `masterData`. If the `useQuotefeed` parameter is specified, the
 * chart leverages the quote feed to update `masterData` with the required date range. If for any
 * reason the requested date is not present in `masterData`, the chart attempts to find a nearby
 * point, such as a weekday if the requested date is a weekday. Otherwise, the chart displays an
 * error to the user. If using a quote feed, the chart sets the refresh interval to five seconds.
 *
 * Term structure charts support "live" dates and, for historical curves, relative dates (see
 * [setCurveDate]{@link CIQ.TermStructure#setCurveDate}).
 *
 * Term structure charts can be linked to time series charts for in-depth data analysis (see
 * {@link CIQ.UI.CurveEdit}).
 *
 * For more information on term structures, see the {@tutorial Term Structures Introduction}
 * tutorial.
 *
 * @param {object} params Configuration parameters.
 * @param {CIQ.ChartEngine} params.stx A reference to the chart engine.
 * @param {string} [params.spacingType="scaled"] Initial spacing type, either "scaled" or
 * 		"uniform".
 * @param {string} [params.dataField="yield"] Initial data field.
 * @param {string[]} [params.fieldsToFormatAsPercent=["yield"]] Fields for which values are
 * 		formatted as percents.
 * @param {boolean} [params.drawShading=true] Specifies whether to draw the chart background
 * 		shading which visually groups instruments.
 * @param {boolean} [params.useQuotefeed=true] Specifies whether the term structure should use
 * 		the quote feed to attempt to find any quotes not present in `masterData`.
 * @param {boolean} [params.showcaseFreshPoints=true] Specifies whether fresh data point updates
 * 		should be highlighted to call attention to the update. Data point updates are fresh if
 * 		they occur within the current time minus `params.pointFreshnessTimeout`.
 * @param {number} [params.pointFreshnessTimeout=10] The amount of time in minutes after which
 * 		data points go stale.
 * @param {boolean} [params.showUpdateAnimations=true] Specifies whether to animate changes to
 * 		data point values.
 * @param {boolean} [params.showUpdateStamp=true] Specifies whether an update time stamp should
 * 		appear when the mouse hovers over data points.
 * @param {boolean} [params.showUpdateStampSeconds=true] Specifies whether the update time
 * 		stamp should display seconds (see `params.showUpdateStamp`).
 * @param {number} [params.maxZoom=5] The maximum multiple to which the chart scales when
 * 		zooming. **Note:** Setting this number arbitrarily high does not enable arbitrary
 * 		zooming. Chart internals do not allow zooming beyond a (high) multiple based on the
 * 		computed maximum candle width.
 *
 * @constructor
 * @name CIQ.TermStructure
 * @since
 * - 7.3.0
 * - 7.4.0 Added the `showcaseFreshPoints`, `pointFreshnessTimeout`, `showUpdateAnimations`,
 * 		`showUpdateStamp`, `showUpdateStampSeconds`, and `maxZoom` parameters.
 */
CIQ.TermStructure = function (params) {
	if (!params || !params.stx) return;
	const stx = params.stx;
	const { layout } = stx;
	layout.candleWidth = 1; // initialize chart at base level zoom

	stx.termStructure = this;
	stx.plugins.termstructure = this;
	stx.allowScroll = true;
	stx.lineTravelSpacing = true;
	stx.maximumCandleWidth = params.maxZoom !== 0 ? params.maxZoom || 5 : 0;
	stx.controls.home = null; // currently only confuses things to have active
	stx.chart.defaultPlotField = "termStructure"; // ensure that methods in core respect `termStructure` as meaningful data field

	this.instrumentSpacing = {};
	this.stx = stx;
	this.subholder = stx.chart.panel.subholder; // area to absolute position updates on
	this.fieldsToFormatAsPercent = params.fieldsToFormatAsPercent || ["yield"];
	this.useQuotefeed = params.useQuotefeed !== false; // specifies to use quotefeed to try to fetch ticks not in masterData
	this.highlighted = { curve: null, instrument: null }; // remember the highlighted vertex point
	this.selectedPoints = [];
	this.showUpdateStampSeconds = params.showUpdateStampSeconds !== false;
	this.initialSettings = {
		spacingType: params.spacingType || "scaled",
		dataField: params.dataField || "yield",
		drawShading: params.drawShading !== false, // default to true
		showcaseFreshPoints: params.showcaseFreshPoints !== false, // default to true
		pointFreshnessTimeout: params.pointFreshnessTimeout || 10,
		showUpdateAnimations: params.showUpdateAnimations !== false,
		showUpdateStamp: params.showUpdateStamp !== false
	};
	this.currentDate = new Date(); // for checking for date rollover
	CIQ.ensureDefaults(layout, this.initialSettings);
	if (CIQ.UI) CIQ.UI.activatePluginUI(stx, "termstructure");

	// Keeps track of curves stored like so:
	// _main_curve: {
	// 	symbol: symbol,
	// 	Date: date,
	// },
	// [uuid] : { ... },
	this.curves = {};

	if (_css) {
		CIQ.addInternalStylesheet(_css, "termstructure.css");
		stx.clearStyles(); // clear out any cached shading values
		stx.draw();
	} else {
		const basePath = CIQ.ChartEngine.pluginBasePath + "termstructure/";
		CIQ.loadStylesheet(basePath + "termstructure.css", function () {
			stx.clearStyles(); // clear out any cached shading values
			stx.draw();
		});
	}

	stx.callbackListeners.curveChange = [];

	// Overwrite default zoomSet but make it reversible. No injection used because this is an override, not an augmentation,
	// and since there is no injection point an app dev might already be making use of.
	const coreZoomSet = CIQ.ChartEngine.prototype.zoomSet;
	CIQ.ChartEngine.prototype.zoomSet = function (...args) {
		if (this.termStructure) this.termStructure.zoomSet(...args);
		else coreZoomSet.call(this, ...args);
	};

	if (this.useQuotefeed) stx.quoteDriver.resetRefreshInterval(5);
	stx.container.classList.add("stx-crosshair-on"); // turn on crosshair by default

	stx.callbackListeners.curveEdit = []; // instantiate to enable listening for and dispatching curveEdit events

	// override default createDataSegment with term structure version
	stx.prepend("createDataSegment", createTermStructureDataSegment);

	stx.prepend("correctIfOffEdge", () => true); // disable default behavior

	stx.prepend("renderYAxis", function (chart) {
		// don't need to reassign priceFormatter on every renderYAxis
		chart.yAxis.priceFormatter = function (stx, panel, price) {
			let { dataField } = stx.layout;
			let { fieldsToFormatAsPercent: fieldsToFormat } = stx.termStructure;
			if (!fieldsToFormat.includes(dataField)) return price;
			return price.toFixed(stx.chart.decimalPlaces) + "%";
		};
	});

	const hud = new CIQ.TermStructure.HUD({ stx });
	const show = hud.show.bind(hud);
	const hide = hud.hide.bind(hud);
	this.hud = hud;

	stx.prepend("headsUpHR", () => {
		show();
		return true;
	});
	stx.append("handleMouseOut", hide);
	stx.addEventListener("layout", show);

	// Make sure main curve gets initialized
	stx.prepend("draw", function () {
		const { termStructure } = this;
		const currentDate = new Date();

		if (termStructure.currentDate.getDate() !== currentDate.getDate()) {
			const { curves } = termStructure;
			termStructure.currentDate = currentDate;
			let anyChanges = false;

			for (let i in curves) {
				let curve = curves[i];

				if (curve.live) {
					curve.Date = currentDate;
					anyChanges = true;
				}
			}

			if (anyChanges) {
				termStructure.recalculateRelativeDates({ noDraw: true });
				stx.dispatch("curveChange");
			}
		}

		if (!termStructure.curves._main_curve && stx.chart.symbol) {
			termStructure.setMainCurve(this.chart.symbol);
			return true; // setMainCurve will invoke draw, cancel this one
		}
	});

	stx.append("draw", () => this.animateUpdates()); // arrow for lexical scoping

	stx.append("updateChartData", function (
		appendQuotes,
		chart,
		{ secondarySeries }
	) {
		if (!chart) chart = this.chart;
		const mostRecent = Array.isArray(appendQuotes)
			? appendQuotes.slice(-1)[0]
			: appendQuotes; // in case single quote
		const { dataSegment, symbol: chartSymbol } = chart;
		const { dataField, showUpdateAnimations } = layout;
		const {
			curves,
			updates: previousUpdates,
			calculatedPoints,
			pointToQuoteMap
		} = this.termStructure;

		if (!showUpdateAnimations) return;

		let currentDateTime = new Date();
		let updateData = {};

		for (let curve in curves) {
			let points = calculatedPoints[curve];
			if (!points || !points.length) continue;
			let updates = Array(points.length).fill(0); // default case is no changes
			let { symbol, Date: dateObj } = curves[curve];

			// only worry about curves that match the update
			if (
				(!secondarySeries && symbol !== chartSymbol) ||
				(secondarySeries && symbol !== secondarySeries)
			)
				continue;

			// only worry about today's curves
			if (dateObj.toDateString() === currentDateTime.toDateString()) {
				let newData = mostRecent.termStructure;

				for (let i = 0; i < points.length; i++) {
					let { instrument, [curve]: oldValue } = dataSegment[
						pointToQuoteMap[curve][i]
					];
					if (!newData[instrument]) continue; // instrument does not apply to curve
					// let oldValue = dataSegment[i][curve];
					let newValue =
						newData[instrument][dataField].value ||
						newData[instrument][dataField]; // backwards compatible
					let difference = oldValue - newValue;

					if (difference < 0) updates[i] = 1;
					if (difference > 0) updates[i] = -1;
				}
			}

			updateData[curve] = updates;
		}

		this.termStructure.updates = Object.assign({}, previousUpdates, updateData);
	});

	stx.append("rightClickHighlighted", function () {
		const { curve, instrument } = this.termStructure.highlighted;
		if (curve && instrument) {
			this.dispatch("curveEdit", {});
		}
	});

	// make sure line style stays up to date with theme changes
	stx.addEventListener("theme", function () {
		for (let curve in this.termStructure.curves) {
			delete this.termStructure.curves[curve].desaturatedColor;
		}
		this.draw();
	});

	// ensure chart stays up to date with symbol changes
	stx.addEventListener("symbolChange", function ({ symbol, action }) {
		const { termStructure } = this;
		const { curves } = termStructure;
		if (curves._main_curve && action === "master") {
			termStructure.setMainCurve(
				symbol,
				!curves._main_curve.live && curves._main_curve.Date
			);
		}
	});

	stx.addEventListener("tap", function () {
		const { termStructure } = this;
		const { highlighted, selectedPoints } = termStructure;
		if (highlighted.curve && highlighted.instrument) {
			let anyRemoved = false;
			termStructure.selectedPoints = selectedPoints.filter(
				({ curve, instrument }) => {
					if (
						curve === highlighted.curve &&
						instrument === highlighted.instrument
					) {
						anyRemoved = true;
						return false;
					}
					return true;
				}
			);
			if (!anyRemoved)
				termStructure.selectedPoints.push(Object.assign({}, highlighted));
			this.draw();
		}
	});

	stx.addEventListener("symbolChange", function () {
		this.termStructure.recordCurves();
	});

	stx.addEventListener("symbolImport", function ({ symbol }) {
		const { termStructure, layout, chart } = this;
		const { curves } = layout;
		if (!curves) return;
		const { main, secondary } = curves;

		const isMainSymbol = symbol === chart.symbol;

		if (isMainSymbol) {
			termStructure.setCurveDate(main.Date, "_main_curve", {
				noRecord: true
			});
			if (main.color) {
				termStructure.modifyCurve("_main_curve", {
					color: main.color,
					noRecord: true
				});
			}
		}

		secondary.forEach((record) => {
			for (let id in termStructure.curves) {
				let existingCurve = termStructure.curves[id];
				// Due to the load order of importLayout only call addCurve once secondary symbols have been "symbolImport"ed
				if (isMainSymbol && existingCurve.symbol !== chart.symbol) return;
				if (
					record.symbol === symbol &&
					!(
						record.symbol === existingCurve.symbol &&
						record.Date === existingCurve.Date.toDateString()
					)
				) {
					termStructure.addCurve(record.symbol, record.Date, {
						color: record.color,
						noRecord: true
					});
				}
			}
		});

		// Make sure that unused series don't hang around
		const secondaryMatches = (series) => ({ symbol }) => series === symbol;

		for (let series in chart.series) {
			let seriesUsed = secondary.some(secondaryMatches(series));
			if (!seriesUsed) this.removeSeries(series);
		}
	});
};

/**
 * Copies the data of the current curve to the chart layout so that the curve information can
 * be reloaded from CIQ.ChartEngine.prototype.importLayout.
 *
 * @memberof CIQ.TermStructure
 * @private
 * @since 7.5.0
 */
CIQ.TermStructure.prototype.recordCurves = function () {
	const { layout } = this.stx;
	let curves = { main: {}, secondary: [] };

	for (let id in this.curves) {
		let curve = this.curves[id];
		let date = curve.live ? "live" : curve.Date.toDateString();

		if (id === "_main_curve") {
			curves.main.Date = date;
			curves.main.color = curve.color;
		} else {
			let secondaryCurve = {};
			secondaryCurve.symbol = curve.symbol;
			secondaryCurve.Date = curve.relativeDate || date;
			secondaryCurve.color = curve.color;
			curves.secondary.push(secondaryCurve);
		}
	}

	layout.curves = curves;
	this.stx.changeOccurred("layout");
};

/**
 * Determines whether the user has either tapped or moused over a data point and, if so,
 * includes in the return object the time stamp of the last update of the data point. Called
 * by {@link CIQ.ChartEngine#findHighlights}.
 *
 * @param {CIQ.ChartEngine} stx The chart engine instance.
 * @param {Boolean} isTap If true, indicates that the user tapped the screen on a touch device,
 * 		and thus a wider radius is used to determine which objects have been highlighted.
 * @param {Boolean} clearOnly Clears highlights when set to true.
 * @return {Object} Object that specifies boolean values for `somethingChanged`,
 * 		`anyHighlighted`, and `stickyArgs` properties.
 *
 * @memberof CIQ.TermStructure
 * @since 7.4.0
 */
CIQ.TermStructure.prototype.findHighlights = function (stx, isTap, clearOnly) {
	const { cx, cy, chart, layout, openDialog } = stx;
	const { dataSegment } = chart;
	const { showUpdateStamp } = layout;
	const {
		highlighted,
		instruments,
		calculatedPoints,
		curves,
		pointToQuoteMap
	} = this;
	const radius =
		stx.preferences[isTap ? "highlightsTapRadius" : "highlightsRadius"]; // 30:10
	let somethingChanged = false;
	let anyHighlighted = false;
	let stickyArgs = null;

	function intersects(cx, cy, px, py) {
		return (
			cx - radius <= px &&
			cx + radius >= px &&
			cy - radius <= py &&
			cy + radius >= py
		);
	}

	// make sure coordinates of highlighted point are in scope to get consistent positioning
	function positionerWithCoordinates(px, py) {
		// custom positioner will get called with engine as context
		return function stickyPositioner(m) {
			let top = py + 10;
			let left = px + 10;

			if (top + m.offsetHeight > this.chart.canvasHeight - this.xaxisHeight)
				top = py - m.offsetHeight - 10;
			if (left + m.offsetWidth > this.chart.canvasWidth)
				left = px - m.offsetWidth - 10;

			m.style.top = top + "px";
			m.style.left = left + "px";
		};
	}

	if (!clearOnly && openDialog === "") {
		let curveKeys = Object.keys(curves);
		for (let i = curveKeys.length - 1; i >= 0; i--) {
			let curve = curveKeys[i];
			let points = calculatedPoints[curve]; // Check more recently added curves first
			if (!points || !points.length) continue;
			for (let i = 0; i < points.length; i++) {
				let [px, py] = points[i];
				let { instrument } = dataSegment[pointToQuoteMap[curve][i]];

				if (intersects(cx, cy, px, py)) {
					anyHighlighted = true;
					if (
						curve !== highlighted.curve ||
						instrument !== highlighted.instrument
					) {
						somethingChanged = true;
						this.highlighted = { curve, instrument };

						let pointData = dataSegment[instruments.indexOf(instrument)];
						let timeStamp = pointData.timeStamps[curve];

						if (showUpdateStamp && timeStamp) {
							let message = this.formatTimeStamp(timeStamp);

							stickyArgs = {
								message,
								type: "termStructurePoint",
								noDelete: true,
								positioner: positionerWithCoordinates(px, py)
							};
						}
					}
					break;
				}
			}
			if (anyHighlighted) break;
		}
	}

	if (!anyHighlighted && highlighted.curve && highlighted.instrument) {
		this.highlighted = { curve: null, instrument: null };
		somethingChanged = true;
	}

	return { somethingChanged, anyHighlighted, stickyArgs };
};

/**
 * Formats a date and time for the time stamp that appears when the user's mouse hovers over a
 * data point on the chart. The time stamp shows the date and time when the data point was most
 * recently updated.
 *
 * Default formatting is "Updated YYYY-MM-dd HH:mm". Override this function to specify your own
 * date/time formatting.
 *
 * @param date A `Date` object or a value that can be accepted by the `Date` contructor
 * 		function.
 *
 * @memberof CIQ.TermStructure
 * @since 7.4.0
 *
 * @example
 * var dt = new Date(date);
 * return "Last update at: " + (dt.getMonth() + 1) + "/" + dt.getDate() + "/" + dt.getFullYear();
 */
CIQ.TermStructure.prototype.formatTimeStamp = function (date) {
	if (typeof date !== "object") date = new Date(date);
	const formatUnit = (unit) => ("0" + unit).slice(-2);

	let month = formatUnit(date.getMonth() + 1);
	let day = formatUnit(date.getDate());
	let year = date.getFullYear();
	let hour = formatUnit(date.getHours());
	let minute = formatUnit(date.getMinutes());
	let second = formatUnit(date.getSeconds());

	let baseText = `${this.stx.translateIf("Updated")} ${year}-${month}-${day}`;
	let UTCHour = date.getUTCHours();
	if (UTCHour === 0 && minute === "00") return baseText;
	let displaySeconds = this.showUpdateStampSeconds;
	let textWithTime = `${baseText} ${hour}:${minute}`;
	if (displaySeconds) textWithTime += `:${second}`;
	return textWithTime;
};

/**
 * Sorts term structure instruments by their names.
 *
 * Instrument names take the form "n Category", where "n" is a number and "Category" is one of
 * DY, WK, MO, YR, ST, MT, and LT (day, week, month, year, short term, medium term, and long
 * term, respectively); for example, 30 DY, 3 MO, 10 YR.
 *
 * Categories sort in the order shown above; DY is lower in the sort order than WK, which is
 * lower than MO, and so forth. Within categories, instruments are sorted by the numerical
 * portion of the instrument name.
 *
 * The current sorting implementation supports yield curves and other common financial
 * instruments. However, term structures can include a wide variety of instruments and
 * instrument naming conventions.
 *
 * Depending on the instruments you are working with, you may wish to replace this function
 * with your own custom sorting function. Expect the function to be called with an unsorted
 * list of all instruments (no duplicates) from all active curves. Return an array sorted
 * however you desire.
 *
 * @param {Array} instruments The instruments to be rendered.
 * @return {Array} The instruments in sorted order.
 *
 * @memberof CIQ.TermStructure
 * @static
 * @since 8.0.0
 */
CIQ.TermStructure.sortInstruments = function (instruments) {
	return instruments.sort((l, r) => {
		let weight = ["DY", "WK", "MO", "YR", "ST", "MT", "LT"];
		let l1 = l.split(" "),
			r1 = r.split(" ");
		let diff =
			weight.indexOf(l1[l1.length - 1]) - weight.indexOf(r1[r1.length - 1]);
		if (diff) return diff > 0 ? 1 : -1;

		if (isNaN(l1[0])) return 1;
		if (isNaN(r1[0])) return -1;
		if (Number(l1[0]) < Number(r1[0])) return -1;
		if (Number(r1[0]) < Number(l1[0])) return 1;
		return 0;
	});
};

/**
 * Zooms the chart in and out. Overrides the default {@link CIQ.ChartEngine#zoomSet} method.
 * Called in response to user interaction.
 *
 * @memberof CIQ.TermStructure
 * @since 7.4.0
 */
CIQ.TermStructure.prototype.zoomSet = function (newCandleWidth, chart) {
	const { stx, maxZoom } = this;
	const x = stx.cx;
	newCandleWidth = stx.constrainCandleWidth(newCandleWidth);
	CIQ.clearCanvas(stx.chart.tempCanvas, stx);
	if (newCandleWidth > maxZoom) newCandleWidth = maxZoom; // need better solution (that works better with ease machine)

	let points = this.calculatedPoints._main_curve; // just main curve for now
	let leftXBound = points[0][0];
	let rightXBound = points[points.length - 1][0];
	let curveTravel = rightXBound - leftXBound;
	let oldCandleWidth = stx.layout.candleWidth;
	let candleWidthDelta = newCandleWidth - oldCandleWidth;
	let originalTravel = curveTravel / oldCandleWidth; // aka travel with no zoom
	let previousTravel = originalTravel * oldCandleWidth; // aka travel with last zoom
	let newTravel = originalTravel * newCandleWidth;
	let travelDelta = newTravel - previousTravel;

	// three cases: mouse is left of curve, inside curve, or right of curve
	// if left: maintain left edge aka do nothing here (maintain micropixels)
	// if inside: keep curve relative to starting mouse position
	// if to right: maintain right edge (factor all travel delta into micropixels)
	if (candleWidthDelta) {
		if (x >= leftXBound && x <= rightXBound) {
			let relativePosition = x - leftXBound;
			let percentOfCurve = relativePosition / curveTravel;
			let pixelsToShift = travelDelta * percentOfCurve;
			if (candleWidthDelta) stx.micropixels -= pixelsToShift;
		} else if (x > rightXBound) {
			if (candleWidthDelta) stx.micropixels -= travelDelta;
		}
	}

	stx.setCandleWidth(newCandleWidth);
	chart.spanLock = false;
	stx.draw();
	stx.doDisplayCrosshairs();
	stx.updateChartAccessories();
	return true; // disable default behavior
};

/**
 * Calculates scaled spacing units. Because scaling the x-axis linearly with respect to time
 * can (depending on the term structure) result in a tight clustering of points near the
 * left-hand side of the chart, you may wish to "smooth" the differences. In the default
 * version, this has been done by calculating the time between the previous and current
 * instrument and raising that value to a 0.5 exponent.
 *
 * You may wish to replace this with your own scaling. To do so, simply overwrite this method
 * with your own version. It will be called with an array of instruments and should return an
 * object with each instrument as a key corresponding to a unit spacing value. The relative
 * differences between the units will be used to determine positioning along the x-axis. The
 * first instrument should have a unit spacing of 0.
 *
 * @param {Array} instruments An array of instruments for which the scaled spacing is
 * 		calculated.
 * @return {Object} An object containing the spacing units for the instruments.
 *
 * @memberof CIQ.TermStructure
 * @since 7.3.0
 */
CIQ.TermStructure.prototype.calculateScaledSpacingUnits = function (
	instruments
) {
	let spacingUnits = {};

	function calculateValue(instrument) {
		let [value, type] = instrument.split(" ");
		value = parseInt(value);
		if (type === "WK") value *= 7;
		if (type === "MO") value *= 30;
		if (type === "YR") value *= 30 * 12;
		if (isNaN(value)) {
			// instrument might be "Short-Term, "Mid-Term", "Long-Term" rather than X MO, X YR, etc
			if (instrument[0] == "S") value = 3 * 360;
			if (instrument[0] == "M") value = 9 * 360;
			if (instrument[0] == "L") value = 20 * 360;
		}
		return value;
	}

	for (let i = 0; i < instruments.length; i++) {
		let instrument = instruments[i];
		let previousInstrument = instruments[i - 1];
		// no spacing for first entry
		if (i === 0) {
			spacingUnits[instrument] = 0;
			continue;
		}

		let value = calculateValue(instrument) - calculateValue(previousInstrument);
		value += 10; // adding constant prior to square root transformation adds subtle weighting to lhs instruments
		value = Math.pow(value, 0.5);
		spacingUnits[instrument] = value;
	}

	return spacingUnits;
};

/**
 * Calculates instrument spacing. If the `TermStructure` instance has a `spacingType` of
 * "uniform", instruments are spaced uniformly. If `spacingType` is set to "scaled", the
 * spacing is calculated from the "spacing units" returned from calling
 * `[calculateScaledSpacingUnits]{@link CIQ.TermStructure#calculateScaledSpacingUnits}`.
 *
 * @param {Object} chart The chart engine.
 * @param {Array} instruments An array of instruments for which the spacing units are
 * 		calculated.
 * @param {Number} bufferPercent The percentage by which the available display width for
 * 		spacing instruments is reduced on both sides of the chart.
 * @return {Object} An object containing the instrument spacing and curve width.
 *
 * @memberof CIQ.TermStructure
 * @since 7.3.0
 */
CIQ.TermStructure.prototype.calculateInstrumentSpacing = function (
	chart,
	instruments,
	bufferPercent
) {
	let width = chart.width;
	let spacing = {};

	const type = this.stx.layout.spacingType;
	const zoom = this.stx.layout.candleWidth;

	spacing._curve_width = 0; // initialize aggregation value

	if (bufferPercent) {
		let buffer = width * bufferPercent;
		spacing._buffer = buffer;
		width = width - buffer * 2;
	}

	if (type === "uniform") {
		let candleWidth = width / (instruments.length - 1); // don't count first instrument
		for (let i = 0; i < instruments.length; i++) {
			let instrument = instruments[i];
			if (i === 0) spacing[instrument] = 0;
			else spacing[instrument] = candleWidth * zoom;
			spacing._curve_width += spacing[instrument];
		}
	}

	if (type === "scaled") {
		const treasurySpacingUnits = this.calculateScaledSpacingUnits(instruments);
		const totalUnits = Object.values(treasurySpacingUnits).reduce(
			(a, b) => a + b,
			0
		);

		for (let i = 0; i < instruments.length; i++) {
			let instrument = instruments[i];
			let spacingPercentage = treasurySpacingUnits[instrument] / totalUnits;
			spacing[instrument] = width * spacingPercentage * zoom;
			spacing._curve_width += spacing[instrument];
		}
	}

	return spacing;
};

/**
 * Returns the shading color for an instrument. Called once for each instrument (or instrument
 * shorthand) stored in `termStructure.instruments` (e.g., "1 MO", "2 MO", etc. for treasury
 * bills). By default, this method uses the canvasStyle` engine method to find a CSS class with
 * the name `stx_shading_` concatenated with the instrument or instrument shorthand with spaces
 * removed (e.g., `stx_shading_1MO`). As a result, shading styles can be defined in your
 * stylesheets.
 *
 * Feel free to override this method with your own color method. The shading renderer calls
 * `[getInstrumentShadingColor]{@link CIQ.TermStructure#getInstrumentShadingColor}` for each
 * instrument and expects an RBGA color to be returned.
 *
 * @param  {String} instrument The instrument identifier.
 * @return {String} A color code.
 *
 * @memberof CIQ.TermStructure
 * @since 7.3.0
 */
CIQ.TermStructure.prototype.getInstrumentShadingColor = function (instrument) {
	let { backgroundColor } = this.stx.canvasStyle(
		`stx_shading_${instrument.replace(" ", "")}`
	);
	return backgroundColor;
};

/**
 * Updates the date in the chart title with the time the most recent update was received.
 *
 * @memberof CIQ.TermStructure
 * @since 7.3.0
 */
CIQ.TermStructure.prototype.updateTitleDate = function () {
	const { Date: date, live } = this.curves._main_curve;
	const dateElement = document.querySelector(
		"cq-chart-title-date.ciq-chart-title-date"
	);
	const timeElement = document.querySelector(
		"cq-chart-title-date.ciq-chart-title-time"
	);
	// probably need to replace these with more to spec formatting later
	const formattedDate = date.toDateString();

	// check if day is same
	const showIntraday = formattedDate === new Date().toDateString();

	if (dateElement) dateElement.innerHTML = live ? "LATEST" : formattedDate;
	if (timeElement) {
		if (showIntraday) {
			// currently just displaying the time the update was processed, not when it originated
			timeElement.innerHTML = new Date().toLocaleTimeString();
			timeElement.style.visibility = "visible";
		} else {
			timeElement.style.visibility = "hidden";
		}
	}
};

/**
 * Animates chart updates.
 *
 * @memberof CIQ.TermStructure
 * @since 7.3.0
 */
CIQ.TermStructure.prototype.animateUpdates = function () {
	if (!this.stx.layout.showUpdateAnimations) return;
	if (!this.updates) return;
	if (!this.updateIcons) this.updateIcons = [];
	this.updateIcons.forEach((icon) => icon.remove());
	this.updateIcons = [];

	const { curves, calculatedPoints, updates } = this;

	let allPoints = [];
	let allUpdates = [];
	Object.keys(curves).forEach((curveId) => {
		let curvePoints = calculatedPoints[curveId];
		let curveUpdates = updates[curveId];
		if (!(curvePoints && curveUpdates)) return;
		allPoints = allPoints.concat(curvePoints);
		allUpdates = allUpdates.concat(curveUpdates);
	});

	const subHolder = this.subholder;
	const left = this.stx.chart.left;

	// on animation end, function to remove icon so we can keep track of active icons
	const removeIcon = (icon) => () => {
		this.updateIcons = this.updateIcons.filter((update) => update !== icon);
		icon.remove();
	};

	for (let i = 0; i < allPoints.length; i++) {
		let update = allUpdates[i];
		if (!update) continue; // covers both 0 and undefined
		let [x, y] = allPoints[i];
		x -= left; // reset to original spacing values
		let iconContainer = document.createElement("div");
		iconContainer.classList.add("ciq-termstructure-price-change-container");
		let icon = document.createElement("div");
		icon.classList.add("ciq-termstructure-price-change");
		icon.classList.add(`ciq-termstructure-price-${update > 0 ? "up" : "down"}`);
		icon.classList.add("ciq-no-share"); // don't share animation divs
		iconContainer.classList.add("ciq-no-share");
		iconContainer.style.top = y + "px";
		iconContainer.style.left = x + "px";

		icon.addEventListener("animationend", removeIcon(icon));

		iconContainer.appendChild(icon);
		subHolder.appendChild(iconContainer);
		this.updateIcons.push(iconContainer);
	}

	this.updates = null; // so each update only gets displayed once
};

/**
 * Removes all active update animations. Call this function to programmatically stop the
 * animations associated with data point updates.
 * See {@link CIQ.TermStructure#setUpdateAnimations}.
 *
 * @memberof CIQ.TermStructure
 * @since 7.4.0
 */
CIQ.TermStructure.prototype.cancelUpdateAnimations = function () {
	const { updateIcons } = this;
	if (!updateIcons) return;
	updateIcons.forEach((icon) => icon.remove());
	this.updateIcons = [];
};

/**
 * Sets the spacing type and triggers a redraw. Use this instead of setting the value manually.
 *
 * @param {String} type Spacing type, should be either "scaled" or "uniform". If this parameter
 * 		is undefined, the function returns without doing anything.
 *
 * @memberof CIQ.TermStructure
 * @since 7.3.0
 */
CIQ.TermStructure.prototype.setSpacingType = function (type) {
	if (!type) return;
	this.stx.layout.spacingType = type;
	this.stx.changeOccurred("layout");
	this.stx.draw();
};

/**
 * Sets the shading flag to the value of the `bool` parameter and triggers a redraw. Use this
 * function instead of setting the value manually.
 *
 * @param {Boolean} bool When true, a background color (shading) is drawn on the chart to
 * 		highlight horizontal sections of the graph; when false, the background color is not
 * 		drawn.
 *
 * @memberof CIQ.TermStructure
 * @since 7.3.0
 *
 * @example
 * var shadingCheckbox = topNode.querySelector(".ciq-checkbox-shading");
 * if (shadingCheckbox) {
 *     shadingCheckbox.registerCallback(function(value) {
 *         stx.termStructure.setShading.call(stx.termStructure, value);
 *         shadingCheckbox.classList.toggle("ciq-active");
 *      });
 *     shadingCheckbox.currentValue = true; // Initially set check box to checked.
 * }
 */
CIQ.TermStructure.prototype.setShading = function (bool) {
	this.stx.layout.drawShading = bool;
	this.stx.changeOccurred("layout");
	this.stx.draw();
};

/**
 * Sets the data field for which values are plotted on the y-axis of the term structure and
 * then triggers a redraw of the chart. Use this function instead of setting the data field
 * manually. See {@link CIQ.UI.Layout#setDataField}.
 *
 * @param {String} field Defines the type of values plotted on the y-axis of the term structure
 * 		graph; for example, instrument yield or volatility.
 *
 * @memberof CIQ.TermStructure
 * @since 7.3.0
 */
CIQ.TermStructure.prototype.setDataField = function (field) {
	this.stx.layout.dataField = field;
	this.stx.changeOccurred("layout");
	this.stx.draw();
};

/**
 * Sets the value of the chart engine layout parameter (see {@link CIQ.ChartEngine}) that
 * indicates whether or not to highlight fresh data points.
 *
 * @param {Boolean} value If true, highlight fresh data points; otherwise, do not highlight
 * 		fresh data points.
 *
 * @memberof CIQ.TermStructure
 * @since 7.4.0
 */
CIQ.TermStructure.prototype.setShowcaseFreshPoints = function (value) {
	this.stx.layout.showcaseFreshPoints = value;
	this.stx.changeOccurred("layout");
	this.stx.draw();
};

/**
 * Sets the value of the chart engine layout parameter (see {@link CIQ.ChartEngine}) that
 * specifies the amount of time after which data points go stale.
 *
 * @param {Number} number The number of minutes for the time out.
 *
 * @memberof CIQ.TermStructure
 * @since 7.4.0
 */
CIQ.TermStructure.prototype.setPointFreshnessTimeout = function (number) {
	this.stx.layout.pointFreshnessTimeout = number;
	this.stx.changeOccurred("layout");
	this.stx.draw();
};

/**
 * Sets the value of the chart engine layout parameter (see {@link CIQ.ChartEngine}) that
 * specifies whether to animate changes to data point values.
 *
 * @param {Boolean} value If true, animate changes; otherwise, do not animate changes.
 *
 * @memberof CIQ.TermStructure
 * @since 7.4.0
 */
CIQ.TermStructure.prototype.setUpdateAnimations = function (value) {
	if (value === false) this.cancelUpdateAnimations();
	this.stx.layout.showUpdateAnimations = value;
	this.stx.changeOccurred("layout");
	this.stx.draw();
};

/**
 * Sets the value of the chart engine layout parameter (see {@link CIQ.ChartEngine}) that
 * specifies whether the update time stamp should appear for data points the user has tapped
 * or moused over.
 *
 * @param {Boolean} value If true, show the time stamp; otherwise, do not show the time stamp.
 *
 * @memberof CIQ.TermStructure
 * @since 7.4.0
 */
CIQ.TermStructure.prototype.setShowUpdateStamp = function (value) {
	this.stx.layout.showUpdateStamp = value;
	this.stx.changeOccurred("layout");
	this.stx.draw();
};

/**
 * Deselects all data points that have been selected on a curve. Typically, data points are
 * selected to show curve spreads (see {@link CIQ.ChartEngine#drawTermStructureSpreads}).
 *
 * Called whenever a curve is removed or substantively modified; for example, when a new date
 * is selected for the curve.
 *
 * Defaults to the main curve.
 *
 * @param {String} [curveId="_main_curve"] Identifies the curve for which points are delected.
 * 		If not specified, points are deselected on the main curve.
 *
 * @memberof CIQ.TermStructure
 * @since 7.5.0
 */
CIQ.TermStructure.prototype.deselectCurvePoints = function (
	curveId = "_main_curve"
) {
	const { selectedPoints } = this;
	this.selectedPoints = selectedPoints.filter(({ curve }) => curve !== curveId);
};

/**
 * Sets the date for which a term structure curve is drawn. If the value specified in `date` is
 * not found in `masterData` and, if `useQuotefeed` is set in this term structure, the function
 * attempts to use the quote feed to load the requested date.
 *
 * For term structures that have multiple curves, the date is applied to the main curve if a
 * value is not specified in `curve`.
 *
 * @param {Date|string|object} date The date for which the term structure curve is created. Can be a
 * 		<a href="https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/date" target="_blank">
 * 		Date</a> object, a string acceptable by the
 * 		<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse" target="_blank">
 * 		Date.parse()</a> method, an object that represents a relative date (for example,
 * 		`{ timeUnit: "day", multiplier: -1 }`, see `timeUnit` and `multiplier` below), or the
 * 		value "live", which specifies the current date.
 * 		<p>When a term structure is "live", the chart can be reloaded at a later date and the term
 * 		structure will be reconstructed for that date (the current date) regardless of when the
 * 		term structure was created.
 * 		<p>Relative dates apply to historical curves, which are primary entity curves created for
 * 		dates in the past.
 * @param {string} [date.timeUnit] Unit of time by which a relative date is offset from the date
 * 		of the main curve. See
 * 		[calculateRelativeDate]{@link CIQ.TermStructure.calculateRelativeDate} for valid values.
 * @param {number} [date.multiplier] Number of time units a relative date is offset from the date
 * 		of the main curve. A negative number offsets the date into the past; a positive number,
 * 		the future. Zero locks the date of the secondary curve to the date of the main curve.
 * @param {string} [curve] Identifies the curve to which `date` applies. If this parameter is not
 * 		provided, defaults to the main term structure curve.
 * @param {object} [params={}] Curve specifications.
 * @param {boolean} [params.noRecord] When true, prevents recording of the curve data to the chart
 * 		layout, {@link CIQ.ChartEngine#layout}. This parameter is set to true when importing
 * 		curves (for example, when reloading the chart), which prevents the state of the curve
 * 		midway through loading from becoming the new source of layout data.
 * @param {boolean} [params.noDraw] When true, prevents the chart from being redrawn when the
 * 		curve date is set.
 *
 * @memberof CIQ.TermStructure
 * @since
 * - 7.3.0
 * - 7.5.0 Added `params` and `params.noRecord` parameters.
 * - 8.2.0 Added `params.noDraw` parameter. Added `date.timeUnit` and `date.multiplier` parameters
 * 		to enable relative dates. Added support for the value "live" when `date` is a string to
 * 		enable specification of the current date.
 *
 * @example
 *  var datepicker = topNode.querySelector("cq-datepicker");
 *  if (datepicker && stx.termStructure) {
 *      datepicker.registerCallback(function(date) {
 *          stx.termStructure.setCurveDate(date);
 *      });
 *  }
 */
CIQ.TermStructure.prototype.setCurveDate = function (date, curve, params = {}) {
	const { noRecord, noDraw } = params;
	const termStructure = this;
	const { curves, stx } = termStructure;
	const { masterData } = stx;
	const isMainCurve = !curve || curve === "_main_curve";
	const isLive = date === "live";
	const { timeUnit, multiplier } = date;
	const isRelativeDate = (multiplier || multiplier === 0) && timeUnit;

	if (isLive) {
		date = new Date();
	} else if (isRelativeDate) {
		date = CIQ.TermStructure.calculateRelativeDate({
			timeUnit,
			multiplier,
			reference: curves._main_curve.Date
		});
	} else {
		date = new Date(date.valueOf());
	}

	const updateDate = () => {
		if (isMainCurve) {
			curves._main_curve.Date = date;
			curves._main_curve.live = isLive;
			this.recalculateRelativeDates();
		} else {
			curves[curve].Date = date;
			curves[curve].live = isLive;
		}

		if (isRelativeDate) curves[curve].relativeDate = { timeUnit, multiplier };

		termStructure.deselectCurvePoints(curve);
		if (!noRecord) termStructure.recordCurves();
		if (!noDraw) stx.draw();
		stx.dispatch("curveChange");
		stx.changeOccurred("layout");
	};

	// if something is wrong with masterData warn and don't do anything
	// if date isn't in masterData try to fetch it before switching values
	if (!(masterData && masterData[0] && masterData[0].DT)) {
		console.warn(
			"Cannot set curve date. `masterData` is missing or malformed."
		);
		return;
	} else if (
		this.useQuotefeed &&
		date.getTime() < this.stx.chart.masterData[0].DT.getTime()
	) {
		stx.setRange(
			{ dtLeft: date, periodicity: { period: 1, timeUnit: "day" } },
			function () {
				updateDate();
			}
		);
	} else {
		updateDate();
	}
};

/**
 * Used internally to set the main curve for the term structure chart. Called as an injection
 * on `symbolChange` events and as an injection on the draw loop (if `_main_curve` is not set).
 *
 * This method should rarely if ever be called directly.
 *
 * @param {string} symbol The main curve symbol. Set to whatever the main symbol is.
 * @param {string} date Date to use for the main curve. If no date is specified, the current date
 * 		is used, and the curve is set to "live", meaning the date rolls over into the next day as
 * 		the time changes.
 *
 * @memberof CIQ.TermStructure
 * @private
 * @since
 * - 7.3.0
 * - 8.2.0 Added support for relative and "live" dates.
 */
CIQ.TermStructure.prototype.setMainCurve = function (symbol, date) {
	this.curves = {
		_main_curve: {
			symbol: symbol,
			Date: date ? new Date(date) : new Date(),
			live: !date
		}
	};
	this.recalculateRelativeDates();
	this.stx.draw();
};

/**
 * Calculates a date relative to a reference date. For example, calculates the date that is 10
 * days prior to the current date.
 *
 * @param {object} params Function parameters.
 * @param {Date} params.reference The date from which the relative date is calculated.
 * @param {string} params.timeUnit The unit of time by which the relative date is offset from the
 * 		reference date. Must be "day", "week", "month", or "year".
 * @param {number} params.multiplier The number of time units the relative date is offset from the
 * 		reference date. A negative number offsets the date into the past; for example, -10
 * 		specifies a date 10 time units (days, weeks, months, or years) in the past. A positive
 * 		number offsets the date into the future; for example, 2 specifies a date two days, weeks,
 * 		months, or years in the future. Zero makes the relative date the same as the reference
 * 		date regardless of time unit.
 * @return {Date} The calculated relative date.
 *
 * @memberof CIQ.TermStructure
 * @static
 * @since 8.2.0
 */
CIQ.TermStructure.calculateRelativeDate = function ({
	reference,
	timeUnit,
	multiplier
}) {
	const date = new Date(reference);
	if (timeUnit === "day") date.setDate(date.getDate() + multiplier);
	if (timeUnit === "week") date.setDate(date.getDate() + multiplier * 7);
	if (timeUnit === "month") date.setMonth(date.getMonth() + multiplier);
	if (timeUnit === "year") date.setFullYear(date.getFullYear() + multiplier);
	return date;
};

/**
 * Adds a secondary curve to the term structure chart.
 *
 * @param {string} symbol Market symbol that identifies the instrument depicted by the secondary
 * 		curve.
 * @param {Date|string|object} date Date for the secondary curve. Can be a
 * 		<a href="https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/date"
 * 		target="_blank"> Date</a> object, a string acceptable by the
 * 		<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse"
 * 		target="_blank"> Date.parse()</a> method, an object that represents a relative date (for
 * 		example, `{ timeUnit: "day", multiplier: -1 }`, see `timeUnit` and `multiplier` below), or
 * 		the value "live", which specifies the current date.
 * 		<p>When a term structure is "live", the chart can be reloaded at a later date and the
 * 		term structure will be reconstructed for that date (the current date) regardless of when
 * 		the term structure was created.
 * 		<p>Relative dates apply to historical curves, which are primary entity curves created for
 * 		dates in the past.
 * @param {string} [date.timeUnit] Unit of time by which a relative date is offset from the date
 * 		of the main curve. See
 * 		[calculateRelativeDate]{@link CIQ.TermStructure.calculateRelativeDate} for valid values.
 * @param {number} [date.multiplier] Number of time units a relative date is offset from the date
 * 		of the main curve. A negative number offsets the date into the past; a positive number,
 * 		the future. Zero locks the date of the secondary curve to the date of the main curve.
 * @param {object} params Specifications for the secondary curve.
 * @param {string} [params.color] Color of the secondary curve. Must be an RGB, RBGA, or
 * 		six&#8209;digit hexadecimal color number; for example, "rgb(255, 255, 255)",
 * 		"rgba(255, 255, 255, 0.5)", or "#FFFFFF".
 * 		<p>**Note:** Three&#8209;digit hexadecimal color numbers and CSS color keywords, such as
 * 		"white", are not valid.
 * @param {boolean} [params.noRecord] When true, prevents recording of the secondary curve
 * 		data to the chart layout, {@link CIQ.ChartEngine#layout}. This parameter is set to true
 * 		when importing curves (for example, when reloading a chart that has secondary curves),
 * 		which prevents the state of the curve midway through loading from becoming the new source
 * 		of layout data.
 * @param {function} [cb] Function called when the curve has been added to the chart and the data
 * 		for the curve is available.
 *
 * @memberof CIQ.TermStructure
 * @since
 * - 7.5.0
 * - 8.2.0 Added `date.timeUnit` and `date.multiplier` parameters to enable relative dates. Added
 * 		support for the value "live" when `date` is a string to enable specification of the
 * 		current date.
 */
CIQ.TermStructure.prototype.addCurve = function (symbol, date, params, cb) {
	const { stx, curves } = this;
	const { color, noRecord } = params;
	const isLive = date === "live";
	const { timeUnit, multiplier } = date;
	const isRelativeDate = (multiplier || multiplier === 0) && timeUnit;

	if (isLive) {
		date = new Date();
	} else if (isRelativeDate) {
		date = CIQ.TermStructure.calculateRelativeDate({
			timeUnit,
			multiplier,
			reference: curves._main_curve.Date
		});
	} else {
		date = new Date(date.valueOf());
	}

	for (let i in curves) {
		let curve = curves[i];
		if (
			curve.symbol === symbol &&
			curve.Date.toDateString() === date.toDateString()
		) {
			return; // don't add duplicate curves
		}
	}

	let newId = CIQ.uniqueID();
	this.curves[newId] = {
		symbol,
		color,
		Date: date,
		loading: true,
		live: isLive
	};
	if (isRelativeDate) {
		this.curves[newId].relativeDate = { timeUnit, multiplier };
	}

	const dataPresent = () => {
		this.curves[newId].loading = false;
		this.setCurveDate(isLive ? "live" : date, newId, { noRecord });
		stx.createDataSet(); // make sure new series makes it into dataSet immediately
		stx.draw();
		if (cb) cb();
	};

	if (
		symbol !== curves._main_curve.symbol &&
		Object.keys(stx.chart.series).indexOf(symbol) === -1
	) {
		stx.addSeries(symbol, {}, dataPresent);
	} else {
		dataPresent();
	}
};

/**
 * Recalculates any relative dates if necessary; for example, when the main curve date has
 * changed.
 *
 * @param {object} [params] Function parameters.
 * @param {boolean} [params.noDraw] When true, prevents the chart from being redrawn when the
 * 		the dates are recalculated.
 *
 * @memberof CIQ.TermStructure
 * @since 8.2.0
 */
CIQ.TermStructure.prototype.recalculateRelativeDates = function ({
	noDraw
} = {}) {
	const { curves } = this;

	for (let id in curves) {
		const { relativeDate: prevRelativeDate, Date: dateObj } = curves[id];
		if (!prevRelativeDate || id === "_main_curve") continue;

		const { timeUnit, multiplier } = prevRelativeDate;
		const newRelativeDate = CIQ.TermStructure.calculateRelativeDate({
			timeUnit,
			multiplier,
			reference: curves._main_curve.Date
		});

		if (dateObj.getTime() !== newRelativeDate.getTime()) {
			this.setCurveDate(newRelativeDate, id, { noDraw });
		}
	}
};

/**
 * Removes a secondary curve from the term structure chart.
 *
 * @param {String} [curveId] Identifies the curve to be removed. If the parameter is undefined
 * 		or identifies the main curve, this function returns without doing anything.
 *
 * @memberof CIQ.TermStructure
 * @since 7.5.0
 */
CIQ.TermStructure.prototype.removeCurve = function (curveId) {
	if (!curveId || curveId === "_main_curve") return;
	const { stx, curves } = this;
	let curveSymbol = curves[curveId].symbol;
	let preserveSeries = false;

	for (let i in curves) {
		let curve = curves[i];
		if (i !== curveId && curve.symbol === curveSymbol) {
			preserveSeries = true;
		}
	}

	if (!preserveSeries) stx.removeSeries(curveSymbol);
	delete this.curves[curveId];
	this.deselectCurvePoints(curveId);
	this.recordCurves();
	stx.draw();
	stx.changeOccurred("layout");
};

/**
 * Modifies a curve on the term structure chart.
 *
 * @param {string} curveId Identifies the curve to be modified.
 * @param {object} [params] Parameters that specify curve modifications. If this parameter is
 * 		undefined, the function returns without doing anything.
 * @param {string} [params.color] A new color to apply to the curve. Must be an RGB, RBGA, or
 * 		six&#8209;digit hexadecimal color number; for example, "rgb(255, 255, 255)",
 * 		"rgba(255, 255, 255, 0.5)", or "#FFFFFF".
 * 		<p>**Note:** Three&#8209;digit hexadecimal color numbers and CSS color keywords, such as
 * 		"white", are not valid.
 * @param {boolean} [params.noRecord] When true, prevents recording of the curve modifications to
 * 		the chart layout, {@link CIQ.ChartEngine#layout}.
 *
 * @memberof CIQ.TermStructure
 * @since
 * - 7.5.0
 * - 8.2.0 Added `params.noRecord`.
 */
CIQ.TermStructure.prototype.modifyCurve = function (curveId, params) {
	if (!params) return;
	const { curves, stx } = this;
	const { color, noRecord } = params;
	if (!color) return;
	const curveToModify = curves[curveId];
	if (!curveToModify) return;
	curveToModify.color = color;
	curveToModify.desaturatedColor = null; // ensure it will get recalculated in draw method
	if (!noRecord) this.recordCurves();
	stx.draw();
	stx.changeOccurred("layout");
};

/**
 * Creates a heads up display (HUD) of term structure data for the data point selected by the term
 * structure crosshairs.
 *
 * @param {object} params Constructor parameters.
 * @param {CIQ.ChartEngine} params.stx A reference to the chart engine.
 *
 * @name CIQ.TermStructure.HUD
 * @class
 * @since 8.2.0
 */
class HUD {
	constructor({ stx }) {
		this.stx = stx;
		this.title = stx.container.querySelector("cq-chart-title");
		this.el = this.getContainer(stx.container);
	}

	/**
	 * Shows the heads up display.
	 *
	 * @alias show
	 * @memberof CIQ.TermStructure.HUD#
	 * @since 8.2.0
	 */
	show() {
		const { stx } = this;
		if (!stx.layout.headsUp || !stx.layout.headsUp.termstructure) {
			this.hide();
			return;
		}

		const content = this.getContent(stx);

		if (content) {
			Object.assign(this.el.style, {
				left: this.title.offsetWidth + 40 + "px"
			});
			this.render(content, this.el);
		} else {
			this.hide();
		}
	}

	/**
	 * Hides the heads up display.
	 *
	 * @alias hide
	 * @memberof CIQ.TermStructure.HUD#
	 * @since 8.2.0
	 */
	hide() {
		if (this.el) this.el.style.display = "none";
	}

	/**
	 * Renders the heads up display as HTML.
	 *
	 * @param {object} content The data that constitutes the heads up display. See
	 * 		[getContent]{@link CIQ.TermStructure.HUD#getContent}.
	 * @param {string} content.dataField The data element, such as yield, on which the term
	 * 		structure is based.
	 * @param {string} content.symbol The market symbol of the entity for which the term structure
	 * 		is constructed; for example, "US-T BENCHMARK" for the U.S. Treasury yield curve.
	 * @param {string} content.color The color of the swatch in the HUD for the main curve. Can be
	 * 		any of the forms supported by the
	 * 		<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/color_value"
	 * 		target="_blank"> CSS color data type</a>.
	 * @param {string} content.term The term (data point or instrument) of the term structure
	 * 		(such as 6&nbsp;MO or 1&nbsp;YR for the yield curve) for which information is
	 * 		displayed in the HUD.
	 * @param {Date} content.date The date for which the main curve of the term structure is
	 * 		graphed.
	 * @param {boolean} content.live Indicates whether the term structure applies to the current
	 * 		date. When true, the chart can be reloaded at a later date and the term structure will
	 * 		be reconstructed for that date (the current date) regardless of when the term
	 * 		structure was created.
	 * @param {object} content.mainData Data for the main curve for the term specified by
	 * 		`content.term` (see above); for example, yield, bid, ask, and mid for a yield curve
	 * 		term structure.
	 * @param {object[]} content.secondary Data for the term structure secondary curves
	 * 		(comparison and historical curves) for the term specified by `content.term` (see
	 * 		above). Each object in the array represents a secondary curve and has the properties
	 * 		below.
	 * @param {string} content.secondary.color The color of the swatch in the HUD for the
	 * 		secondary curve. Can be any of the forms supported by the
	 * 		<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/color_value"
	 * 		target="_blank"> CSS color data type</a>.
	 * @param {string} content.secondary.date If the curve is an entity (or comparison) curve, the
	 * 		date of the curve. If the curve is an historical curve, the reference date for the
	 * 		relative date of the curve. Equal to the date of the main curve.
	 * @param {object} content.secondary.relativeDate A time unit and multiplier that specifies
	 * 		a date relative to the date of the main curve (see
	 * 		{@link CIQ.TermStructure.calculateRelativeDate}).
	 * @param {string} [content.secondary.relativeDate.timeUnit] Unit of time by which a relative
	 * 		date is offset from the date of the main curve.
	 * @param {number} [content.secondary.relativeDate.multiplier] Number of time units a relative
	 * 		date is offset from the date of the main curve.
	 * @param {string} content.secondary.symbol The symbol of the entity for which the term
	 * 		structure represented by the secondary curve is constructed.
	 * @param {string} content.secondary.value The value for the secondary curve for the term
	 * 		specified by `content.term` (see above).
	 * @param {string[]} [content.fieldsToFormatAsPercent=[]] The data fields (see
	 * 		`content.mainData`) formatted as percentages in the heads up display.
	 * @param {number} [content.decimalPlaces=2] The number of digits to display after the decimal
	 * 		place for the data fields specified in `content.fieldsToFormatAsPercent`. Numbers are
	 * 		padded with zeros if necessary.
	 * @param {HTMLElement} el The DOM element that contains the rendered content of the
	 * 		heads up display.
	 *
	 * @alias render
	 * @memberof CIQ.TermStructure.HUD#
	 * @since 8.2.0
	 */
	render(content, el) {
		const {
			dataField,
			symbol,
			color,
			term,
			date,
			live,
			mainData,
			secondary,
			fieldsToFormatAsPercent = [],
			decimalPlaces = 2
		} = content;

		const formatDate = (dt) => CIQ.dateToStr(dt, "MM/dd/YYYY");
		const usePercent = fieldsToFormatAsPercent.includes(dataField) ? "%" : "";

		const curveField = ({
			date,
			symbol,
			value,
			color,
			isMain,
			relativeDate: { timeUnit, multiplier } = {}
		}) => {
			if (!value && value !== 0) return "";
			const displayDate =
				(live && isMain) || (live && multiplier === 0)
					? this.latestLabel || "LATEST"
					: multiplier && timeUnit
					? this.getRelativeDateLabel(multiplier, timeUnit)
					: formatDate(date);

			return `<tr class="ciq-curve-field">
					<td>
					<div style="background-color: ${color}"></div>
					<b>${symbol}</b>
					${displayDate}
					</td>
					<td>${value === undefined ? "" : value.toFixed(decimalPlaces) + usePercent}</td>
				</tr>
			`;
		};

		const fields = secondary.length
			? []
			: Object.entries(mainData || {})
					.filter(([name]) => name !== dataField)
					.map(([name, obj]) => {
						const usePercent = fieldsToFormatAsPercent.includes(name)
							? "%"
							: "";
						return `
					<tr class="ciq-info-field">
						<td>${CIQ.capitalize(name)}</td>
						<td>${obj.value.toFixed(decimalPlaces)}${usePercent}</td>
					</tr>
				`;
					})
					.join("");
		const otherCurves = secondary.map(curveField).join("");
		const value = ((mainData || {})[dataField] || {}).value;
		el.innerHTML = `
			<strong>${term} - ${CIQ.capitalize(dataField)}</strong>
			<table>
			${curveField({ date, symbol, value, color, isMain: true })}
			${fields}
			${otherCurves}
			</table>
		`;
		if (el) el.style.display = "block";
	}

	/**
	 * Returns a label for a date that is relative to the date of the main curve.
	 *
	 * Override this method in a subclass of {@link CIQ.TermStructure.HUD} or in the `postInstall`
	 * function of the `termStructure` property of the chart configuration object (see the example
	 * below).
	 *
	 * @param {string} timeUnit Unit of time by which a relative date is offset from the date of
	 * 		the main curve. See {@link CIQ.TermStructure.calculateRelativeDate} for valid values.
	 * @param {number} multiplier Number of time units a relative date is offset from the date of
	 * 		the main curve. A negative number offsets the date into the past; a positive number,
	 * 		the future. Zero locks the date of the historical curve to the date of the main curve.
	 * @return {string} A string composed of the multiplier and time unit; for example, "-1 MONTH".
	 *
	 * @alias getRelativeDateLabel
	 * @memberof CIQ.TermStructure.HUD#
	 * @since 8.2.0
	 *
	 * @example <caption>Customize the term structure <code>postInstall</code> function of the
	 * chart configuration object. See the {@tutorial Chart Configuration} tutorial.</caption>
	 * termStructure: {
	 *     postInstall ({ uiContext, extension }) {
	 *         // Change the relative label display for all time units; for example, from "-1 MONTH" to "1 Month Ago".
	 *         extension.hud.getRelativeDateLabel = (multiplier, timeUnit) =>
	 *             Math.abs(multiplier) +
	 *             " " +
	 *             CIQ.capitalize(timeUnit) + (Math.abs(multiplier) > 1 ? "s" : "") +
	 *             " Ago";
	 *     }
	 * }
	 */
	getRelativeDateLabel(multiplier, timeUnit) {
		return `${multiplier} ${timeUnit.toUpperCase()}`;
	}

	/**
	 * Extracts content from the chart engine for the heads up display.
	 *
	 * @param {CIQ.ChartEngine} stx A reference to the chart engine.
	 * @return {object} Contains the data for the heads up display.
	 *
	 * @alias getContent
	 * @memberof CIQ.TermStructure.HUD#
	 * @since 8.2.0
	 */
	getContent(stx) {
		const {
			cx,
			cy,
			chart: { left, right, top, bottom, dataSet, dataSegment, decimalPlaces },
			insideChart,
			termStructure: {
				cx: tscx,
				cy: tscy,
				curves,
				calculatedPoints,
				pointToQuoteMap,
				instruments,
				fieldsToFormatAsPercent
			}
		} = stx;

		const x = cx !== undefined ? cx : tscx;
		const y = cy !== undefined ? cy : tscy;
		if (!insideChart || x < left || x > right || y < top || y > bottom) {
			return;
		}

		// closest horizontally, take into account possibility of points not shared among all curves
		let closest = { quoteIndex: null, xDistance: null };
		let curveKeys = Object.keys(curves);
		for (let i = 0; i < curveKeys.length; i++) {
			let curve = curveKeys[i];
			let points = calculatedPoints[curve];
			if (!points || !points.length) continue;
			for (let j = 0; j < points.length; j++) {
				let xVal = points[j][0];
				let distance = Math.abs(xVal - x);
				if (closest.xDistance === null || distance < closest.xDistance) {
					// if curve points change pointToQuoteMap may momentarily be out of date
					// if no index is found, use 0 to prevent crashing. Correct value will likely
					// be available on the next iteration of this function
					closest.quoteIndex = pointToQuoteMap[curve][j] || 0;
					closest.xDistance = distance;
				}
			}
		}

		const {
			Date: date,
			live,
			symbol,
			color = stx.defaultColor
		} = curves._main_curve;
		const term = instruments[closest.quoteIndex];

		// rewinding as necessary is done for `dataField` for all curves in createTermStructureDataSegment
		// here we only display the rest of the data if there is no comparison, so we only worry about main curve
		let tickIndex = Math.min(stx.tickFromDate(date), dataSet.length - 1);
		let tick;
		do {
			tick = stx.chart.dataSet[tickIndex];
			tickIndex--;
		} while (tick && !tick.termStructure);

		const mainData = tick && tick.termStructure[term];
		const secondary = Object.entries(curves)
			.filter(([name]) => name !== "_main_curve")
			.map(([name, { symbol, Date: date, color, relativeDate }]) => {
				const value = dataSegment[closest.quoteIndex][name];
				return { date, relativeDate, symbol, value, color };
			});

		return {
			dataField: stx.layout.dataField,
			term,
			date,
			live,
			symbol,
			color,
			mainData,
			secondary,
			fieldsToFormatAsPercent,
			usePercent: stx.termStructure.fieldsToFormatAsPercent,
			decimalPlaces
		};
	}

	/**
	 * Gets the DOM element within `container` that contains the heads up display. If an element
	 * does not exist, creates one within `container`.
	 *
	 * @param {HTMLElement} container The DOM element that contains the chart. The heads up
	 * 		display container is a sub-element of this element.
	 * @return {HTMLElement} The DOM element that contains the heads up display.
	 *
	 * @alias getContainer
	 * @memberof CIQ.TermStructure.HUD#
	 * @since 8.2.0
	 */
	getContainer(container) {
		let el = container.querySelector("cq-hud-termstructure");
		if (el) return el;

		const holder = container.querySelector(".stx-subholder");
		el = document.createElement("cq-hud-termstructure");
		if (this.title) {
			this.title.after(el);
		} else {
			holder.append(el);
		}
		Object.assign(el.style, { position: "absolute", top: 0, padding: "8px" });
		return el;
	}
}

CIQ.TermStructure.HUD = HUD;
