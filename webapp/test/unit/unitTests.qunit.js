/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"nlqualiturespcsandbox/sandbox-chart/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
