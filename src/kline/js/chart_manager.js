import {Control} from './control'
import {Chart} from './chart'
import * as indicators from './indicators'
import * as ranges from './ranges'
import * as templates from './templates'
import * as data_sources from './data_sources'
import {ChartSettings} from './chart_settings'
import * as data_providers from './data_providers'
import * as themes from './themes'
import * as plotters from './plotters'
import * as areas from './areas'
import {Util} from './util'


export class ChartManager {

    static DrawingTool = {
        Cursor: 0,
        CrossCursor: 1,
        DrawLines: 2,
        DrawFibRetrace: 3,
        DrawFibFans: 4,
        SegLine: 5,
        StraightLine: 6,
        ArrowLine: 7,
        RayLine: 8,
        HoriStraightLine: 9,
        HoriRayLine: 10,
        HoriSegLine: 11,
        VertiStraightLine: 12,
        PriceLine: 13,
        BiParallelLine: 14,
        BiParallelRayLine: 15,
        TriParallelLine: 16,
        BandLine: 17
    };

    static created = false;
    static instance = null;

    constructor() {
        this._dataSources = {};
        this._dataProviders = {};
        this._frames = {};
        this._areas = {};
        this._timelines = {};
        this._ranges = {};
        this._plotters = {};
        this._themes = {};
        this._dsChartStyle = {};
        this._dragStarted = false;
        this._oldX = 0;
        this._fakeIndicators = {};
        this._captureMouseWheelDirectly = true;
        this._chart = {};
        this._chart.defaultFrame = new Chart();
        this._drawingTool = ChartManager.DrawingTool["CrossCursor"];
        this._beforeDrawingTool = this._drawingTool;
        this._language = "zh-cn";
        this._mainCanvas = null;
        this._overlayCanvas = null;
        this._mainContext = null;
        this._overlayContext = null;

        if (!ChartManager.created) {
            ChartManager.instance = this;
            ChartManager.created = true;
        }
        return ChartManager.instance;
    }


    bindCanvas(layer, canvas) {
        if (layer === "main") {
            this._mainCanvas = canvas;
            this._mainContext = canvas.getContext("2d");
        } else if (layer === "overlay") {
            this._overlayCanvas = canvas;
            this._overlayContext = canvas.getContext("2d");
            if (this._captureMouseWheelDirectly) {
                $(this._overlayCanvas).bind('mousewheel', Control.mouseWheel);
            }
        }
    }

    // 核心方法, 绘制视图
    redraw(layer = "All") {
        if (layer === "All" || layer === "MainCanvas") {
            this.layout(this._mainContext, "frame0", 0, 0, this._mainCanvas.width, this._mainCanvas.height);
            this.drawMain("frame0", this._mainContext);
        }
        if (layer === "All" || layer === "OverlayCanvas") {
            this._overlayContext.clearRect(0, 0, this._overlayCanvas.width, this._overlayCanvas.height);
            this.drawOverlay("frame0", this._overlayContext);
        }
    }

    // 核心方法, 调整各个area的大小 与 位置
    layout(context, frameName, left, top, right, bottom) {
        let frame = this.getFrame(frameName);
        frame.measure(context, right - left, bottom - top);
        frame.layout(left, top, right, bottom);
        for (let n in this._timelines) {
            let e = this._timelines[n];
            if (e.getFrameName() === frameName)
                e.onLayout();
        }
        for (let n in this._dataSources) {
            if (n.substring(0, frameName.length) === frameName)
                this.updateRange(n);
        }
    }

    getCaptureMouseWheelDirectly() {
        return this._captureMouseWheelDirectly;
    }

    setCaptureMouseWheelDirectly(v) {
        this._captureMouseWheelDirectly = v;
        if (v)
            $(this._overlayCanvas).bind('mousewheel', Control.mouseWheel);
        else
            $(this._overlayCanvas).unbind('mousewheel');
    }

    getChart(nouseParam) {
        return this._chart["defaultFrame"];
    }

    init() {
        delete this._ranges['frame0.k0.indic1'];
        delete this._ranges['frame0.k0.indic1Range'];
        delete this._areas['frame0.k0.indic1'];
        delete this._areas['frame0.k0.indic1Range'];
        templates.DefaultTemplate.loadTemplate("frame0.k0", "");
        this.redraw('All', true);
    }

    setCurrentDrawingTool(paramTool) {
        this._drawingTool = ChartManager.DrawingTool[paramTool];
        this.setRunningMode(this._drawingTool);
    }

    getLanguage() {
        return this._language;
    }

    setLanguage(lang) {
        this._language = lang;
    }

    setThemeName(frameName, themeName) {
        if (themeName === undefined)
            themeName = "Dark";
        let theme;
        switch (themeName) {
            case "Light":
                theme = new themes.LightTheme();
                break;
            default:
                themeName = "Dark";
                theme = new themes.DarkTheme();
                break;
        }
        this._themeName = themeName;
        this.setTheme(frameName, theme);
    }

    getChartStyle(dsName) {
        let chartStyle = this._dsChartStyle[dsName];
        if (chartStyle === undefined)
            return "CandleStick";
        return chartStyle;
    }

    setChartStyle(dsName, style) {
        if (this._dsChartStyle[dsName] === style)
            return;
        let areaName = dsName + ".main";
        let dpName = areaName + ".main";
        let plotterName = areaName + ".main";
        let dp, plotter;
        switch (style) {
            case "CandleStick":
            case "CandleStickHLC":
            case "OHLC":
                dp = this.getDataProvider(dpName);
                if (dp === undefined || !Util.isInstance(dp, data_providers.MainDataProvider)) {
                    dp = new data_providers.MainDataProvider(dpName);
                    this.setDataProvider(dpName, dp);
                    dp.updateData();
                }
                this.setMainIndicator(dsName, ChartSettings.get().charts.mIndic);
                switch (style) {
                    case "CandleStick":
                        plotter = new plotters.CandlestickPlotter(plotterName);
                        break;
                    case "CandleStickHLC":
                        plotter = new plotters.CandlestickHLCPlotter(plotterName);
                        break;
                    case "OHLC":
                        plotter = new plotters.OHLCPlotter(plotterName);
                        break;
                }
                this.setPlotter(plotterName, plotter);
                plotter = new plotters.MinMaxPlotter(areaName + ".decoration");
                this.setPlotter(plotter.getName(), plotter);
                break;
            case "Line":
                dp = new data_providers.IndicatorDataProvider(dpName);
                this.setDataProvider(dp.getName(), dp);
                dp.setIndicator(new indicators.HLCIndicator());
                this.removeMainIndicator(dsName);
                plotter = new plotters.IndicatorPlotter(plotterName);
                this.setPlotter(plotterName, plotter);
                this.removePlotter(areaName + ".decoration");
                break;
        }
        this._dsChartStyle[dsName] = style;
    }

    setNormalMode() {
        this._drawingTool = this._beforeDrawingTool;
        $(".chart_dropdown_data").removeClass("chart_dropdown-hover");
        $("#chart_toolpanel .chart_toolpanel_button").removeClass("selected");
        $("#chart_CrossCursor").parent().addClass("selected");
        if (this._drawingTool === ChartManager.DrawingTool.Cursor) {
            this.showCursor();
            $("#mode a").removeClass("selected");
            $("#chart_toolpanel .chart_toolpanel_button").removeClass("selected");
            $("#chart_Cursor").parent().addClass("selected");
        } else {
            this.hideCursor();
        }
    }

    setRunningMode(mode) {
    }

    setCurrentDataSource(dsName, dsAlias) {
        let cached = new data_sources.MainDataSource(dsAlias);
        this.setDataSource(dsName, cached, true);
    }

    getDataSource(name) {
        return this._dataSources[name];
    }

    setDataSource(name, ds, forceRefresh) {
        this._dataSources[name] = ds;
        if (forceRefresh) {
            this.updateData(name, null);
        }
    }

    getDataProvider(name) {
        return this._dataProviders[name];
    }

    setDataProvider(name, dp) {
        this._dataProviders[name] = dp;
    }

    removeDataProvider(name) {
        delete this._dataProviders[name];
    }

    getFrame(name) {
        return this._frames[name];
    }

    setFrame(name, frame) {
        this._frames[name] = frame;
    }

    removeFrame(name) {
        delete this._frames[name];
    }

    getArea(name) {
        return this._areas[name];
    }

    setArea(name, area) {
        this._areas[name] = area;
    }

    removeArea(name) {
        delete this._areas[name];
    }

    getTimeline(name) {
        return this._timelines[name];
    }

    setTimeline(name, timeline) {
        this._timelines[name] = timeline;
    }

    removeTimeline(name) {
        delete this._timelines[name];
    }

    getRange(name) {
        return this._ranges[name];
    }

    setRange(name, range) {
        this._ranges[name] = range;
    }

    removeRange(name) {
        delete this._ranges[name];
    }

    getPlotter(name) {
        return this._plotters[name];
    }

    setPlotter(name, plotter) {
        this._plotters[name] = plotter;
    }

    removePlotter(name) {
        delete this._plotters[name];
    }

    getTheme(name) {
        return this._themes[name];
    }

    setTheme(name, theme) {
        this._themes[name] = theme;
    }

    drawArea(context, area, plotterNames) {
        let areaName = area.getNameObject().getCompAt(2);
        if (areaName === "timeline") {
            if (area.getHeight() < 20)
                return;
        } else {
            if (area.getHeight() < 30)
                return;
        }
        if (area.getWidth() < 30)
            return;
        areaName = area.getName();
        let plotter;
        let i, cnt = plotterNames.length;
        for (i = 0; i < cnt; i++) {
            plotter = this._plotters[areaName + plotterNames[i]];
            if (plotter !== undefined)
                plotter.Draw(context);
        }
    }

    drawAreaMain(context, area) {
        let ds = this._dataSources[area.getDataSourceName()];
        let plotterNames;
        if (ds.getDataCount() < 1)
            plotterNames = [".background"];
        else
            plotterNames = [".background", ".grid", ".main", ".secondary"];
        this.drawArea(context, area, plotterNames);
    }

    drawAreaOverlay(context, area) {
        let ds = this._dataSources[area.getDataSourceName()];
        let plotterNames;
        if (ds.getDataCount() < 1)
            plotterNames = [".selection"];
        else
            plotterNames = [".decoration", ".selection", ".info", ".tool"];
        this.drawArea(context, area, plotterNames);
    }

    drawMain(frameName, context) {
        for (let it in this._areas) {
            if (this._areas[it].getFrameName() === frameName && !Util.isInstance(this._areas[it], areas.ChartAreaGroup))
                this.drawAreaMain(context, this._areas[it]);
        }
    }

    drawOverlay(frameName, context) {
        for (let n in this._areas) {
            let area = this._areas[n];
            if (Util.isInstance(area, areas.ChartAreaGroup))
                if (area.getFrameName() === frameName) {
                    area.drawGrid(context);
                }
        }
        for (let n in this._areas) {
            let area = this._areas[n];
            if (Util.isInstance(area, areas.ChartAreaGroup) === false)
                if (area.getFrameName() === frameName) {
                    this.drawAreaOverlay(context, area);
                }
        }
    }

    updateData(dsName, data) {
        let ds = this.getDataSource(dsName);
        if (ds === undefined || ds === null) {
            return;
        }
        if (data !== undefined && data !== null) {
            if (!ds.update(data)) {
                return false;
            }
            if (ds.getUpdateMode() === data_sources.DataSource.UpdateMode.DoNothing)
                return true;
        } else {
            ds.setUpdateMode(data_sources.DataSource.UpdateMode.Refresh);
        }
        let timeline = this.getTimeline(dsName);
        if (timeline !== undefined && timeline !== null) {
            timeline.update();
        }
        if (ds.getDataCount() < 1) {
            return true;
        }
        let dpNames = [".main", ".secondary"];
        let area, areaName;
        for (let n in this._areas) {
            area = this._areas[n];
            if (Util.isInstance(area, areas.ChartAreaGroup)) {
                continue;
            }
            if (area.getDataSourceName() !== dsName) {
                continue;
            }
            areaName = area.getName();
            for (let i = 0; i < dpNames.length; i++) {
                let dp = this.getDataProvider(areaName + dpNames[i]);
                if (dp !== undefined && dp !== null) {
                    dp.updateData();
                }
            }
        }
        return true;
    }

    updateRange(dsName) {
        let ds = this.getDataSource(dsName);
        if (ds.getDataCount() < 1) {
            return;
        }
        let dpNames = [".main", ".secondary"];
        let area, areaName;
        for (let n in this._areas) {
            area = this._areas[n];
            if (Util.isInstance(area, areas.ChartAreaGroup))
                continue;
            if (area.getDataSourceName() !== dsName)
                continue;
            areaName = area.getName();
            for (let i = 0; i < dpNames.length; i++) {
                let dp = this.getDataProvider(areaName + dpNames[i]);
                if (dp !== undefined && dp !== null) {
                    dp.updateRange();
                }
            }
            let timeline = this.getTimeline(dsName);
            if (timeline !== undefined && timeline.getMaxItemCount() > 0) {
                let range = this.getRange(areaName);
                if (range !== undefined && range !== null) {
                    range.update();
                }
            }
        }
    }

    SelectRange(pArea, y) {
        for (let ee in this._ranges) {
            let _1 = this._ranges[ee].getAreaName();
            let _2 = pArea.getName();
            if (_1 === _2)
                this._ranges[ee].selectAt(y);
            else
                this._ranges[ee].unselect();
        }
    }

    scale(s) {
        let dsName = 'frame0.k0';
        let timeline = this.getTimeline(dsName);
        if (timeline) {
            timeline.scale(s);
            this.updateRange(dsName);
        }
    }

    showCursor(cursor) {
        if (cursor === undefined)
            cursor = 'default';
        this._mainCanvas.style.cursor = cursor;
        this._overlayCanvas.style.cursor = cursor;
    }

    hideCursor() {
        this._mainCanvas.style.cursor = 'none';
        this._overlayCanvas.style.cursor = 'none';
    }

    showCrossCursor(area, x, y) {
        let e = this.getRange(area.getName());
        if (e !== undefined) {
            e.selectAt(y);
            e = this.getTimeline(area.getDataSourceName());
            if (e !== undefined)
                if (e.selectAt(x))
                    return true;
        }
        return false;
    }

    hideCrossCursor(exceptTimeline) {
        if (exceptTimeline !== null && exceptTimeline !== undefined) {
            for (let n in this._timelines) {
                let e = this._timelines[n];
                if (e !== exceptTimeline) {
                    e.unselect();
                }
            }
        } else {
            for (let n in this._timelines)
                this._timelines[n].unselect();
        }
        for (let n in this._ranges)
            this._ranges[n].unselect();
    }

    onMouseMove(frameName, x, y, drag) {
        let frame = this.getFrame(frameName);
        this.hideCrossCursor();
        if (this._capturingMouseArea) {
            this._capturingMouseArea.onMouseMove(x, y);
            return;
        }
        let _areas = frame.contains(x, y);
        if (_areas === null)
            return;
        let a, i, cnt = _areas.length;
        for (i = cnt - 1; i >= 0; i--) {
            a = _areas[i];
            a = a.onMouseMove(x, y);
            if (a !== null) {
                if (!Util.isInstance(a, areas.ChartAreaGroup)) {
                    frame.highlight(a);
                }
                return;
            }
        }
    }

    onMouseLeave(frameName, x, y, move) {
        let frame = this.getFrame(frameName);
        if (frame === undefined)
            return;
        this.hideCrossCursor();
        if (this._capturingMouseArea) {
            this._capturingMouseArea.onMouseLeave(x, y);
            this._capturingMouseArea = null;
        }
        this._dragStarted = false;
    }

    onMouseDown(frameName, x, y) {
        let frame = this.getFrame(frameName);
        if (frame === undefined)
            return;
        let areas = frame.contains(x, y);
        if (areas === null)
            return;
        let a, i, cnt = areas.length;
        for (i = cnt - 1; i >= 0; i--) {
            a = areas[i];
            a = a.onMouseDown(x, y);
            if (a !== null) {
                this._capturingMouseArea = a;
                return;
            }
        }
    }

    onMouseUp(frameName, x, y) {
        let frame = this.getFrame(frameName);
        if (frame === undefined)
            return;
        if (this._capturingMouseArea) {
            if (this._capturingMouseArea.onMouseUp(x, y) === null && this._dragStarted === false) {
                if (this._selectedFrame !== null && this._selectedFrame !== undefined && this._selectedFrame !== frame)
                    this._selectedFrame.select(null);
                if (this._capturingMouseArea.isSelected()) {
                    if (!this._captureMouseWheelDirectly)
                        $(this._overlayCanvas).unbind('mousewheel');
                    frame.select(null);
                    this._selectedFrame = null;
                } else {
                    if (this._selectedFrame !== frame)
                        if (!this._captureMouseWheelDirectly)
                            $(this._overlayCanvas).bind('mousewheel', Control.mouseWheel);
                    frame.select(this._capturingMouseArea);
                    this._selectedFrame = frame;
                }
            }
            this._capturingMouseArea = null;
            this._dragStarted = false;
        }
    }

    deleteToolObject() {
    }

    createIndicatorAndRange(areaName, indicName, notLoadSettings) {
        let indic, range;
        switch (indicName) {
            case "MA":
                indic = new indicators.MAIndicator();
                range = new ranges.PositiveRange(areaName);
                break;
            case "EMA":
                indic = new indicators.EMAIndicator();
                range = new ranges.PositiveRange(areaName);
                break;
            case "VOLUME":
                indic = new indicators.VOLUMEIndicator();
                range = new ranges.ZeroBasedPositiveRange(areaName);
                break;
            case "MACD":
                indic = new indicators.MACDIndicator();
                range = new ranges.ZeroCenteredRange(areaName);
                break;
            case "DMI":
                indic = new indicators.DMIIndicator();
                range = new ranges.PercentageRange(areaName);
                break;
            case "DMA":
                indic = new indicators.DMAIndicator();
                range = new ranges.Range(areaName);
                break;
            case "TRIX":
                indic = new indicators.TRIXIndicator();
                range = new ranges.Range(areaName);
                break;
            case "BRAR":
                indic = new indicators.BRARIndicator();
                range = new ranges.Range(areaName);
                break;
            case "VR":
                indic = new indicators.VRIndicator();
                range = new ranges.Range(areaName);
                break;
            case "OBV":
                indic = new indicators.OBVIndicator();
                range = new ranges.Range(areaName);
                break;
            case "EMV":
                indic = new indicators.EMVIndicator();
                range = new ranges.Range(areaName);
                break;
            case "RSI":
                indic = new indicators.RSIIndicator();
                range = new ranges.PercentageRange(areaName);
                break;
            case "WR":
                indic = new indicators.WRIndicator();
                range = new ranges.PercentageRange(areaName);
                break;
            case "SAR":
                indic = new indicators.SARIndicator();
                range = new ranges.PositiveRange(areaName);
                break;
            case "KDJ":
                indic = new indicators.KDJIndicator();
                range = new ranges.PercentageRange(areaName);
                break;
            case "ROC":
                indic = new indicators.ROCIndicator();
                range = new ranges.Range(areaName);
                break;
            case "MTM":
                indic = new indicators.MTMIndicator();
                range = new ranges.Range(areaName);
                break;
            case "BOLL":
                indic = new indicators.BOLLIndicator();
                range = new ranges.Range(areaName);
                break;
            case "PSY":
                indic = new indicators.PSYIndicator();
                range = new ranges.Range(areaName);
                break;
            case "StochRSI":
                indic = new indicators.STOCHRSIIndicator();
                range = new ranges.PercentageRange(areaName);
                break;
            default:
                return null;
        }
        if (!notLoadSettings) {
            indic.setParameters(ChartSettings.get().indics[indicName]);
        }
        return {"indic": indic, "range": range};
    }

    setMainIndicator(dsName, indicName) {
        let areaName = dsName + ".main";
        let dp = this.getDataProvider(areaName + ".main");
        if (dp === undefined || !Util.isInstance(dp, data_providers.MainDataProvider))
            return false;
        let indic;
        switch (indicName) {
            case "MA":
                indic = new indicators.MAIndicator();
                break;
            case "EMA":
                indic = new indicators.EMAIndicator();
                break;
            case "BOLL":
                indic = new indicators.BOLLIndicator();
                break;
            case "SAR":
                indic = new indicators.SARIndicator();
                break;
            default:
                return false;
        }
        indic.setParameters(ChartSettings.get().indics[indicName]);
        let indicDpName = areaName + ".secondary";
        let indicDp = this.getDataProvider(indicDpName);
        if (indicDp === undefined) {
            indicDp = new data_providers.IndicatorDataProvider(indicDpName);
            this.setDataProvider(indicDp.getName(), indicDp);
        }
        indicDp.setIndicator(indic);
        let plotter = this.getPlotter(indicDpName);
        if (plotter === undefined) {
            plotter = new plotters.IndicatorPlotter(indicDpName);
            this.setPlotter(plotter.getName(), plotter);
        }
        return true;
    }

    setIndicator(areaName, indicName) {
        let area = this.getArea(areaName);
        if (area === null || area === undefined || area.getNameObject().getCompAt(2) === "main") {
            return false;
        }
        let dp = this.getDataProvider(areaName + ".secondary");
        if (dp === null || dp === undefined || !Util.isInstance(dp, data_providers.IndicatorDataProvider)) {
            return false;
        }
        let ret = this.createIndicatorAndRange(areaName, indicName);
        if (ret === null || ret === undefined) {
            return false;
        }
        let indic = ret.indic;
        let range = ret.range;
        this.removeDataProvider(areaName + ".main");
        this.removePlotter(areaName + ".main");
        this.removeRange(areaName);
        this.removePlotter(areaName + "Range.decoration");
        dp.setIndicator(indic);
        this.setRange(areaName, range);
        range.setPaddingTop(20);
        range.setPaddingBottom(4);
        range.setMinInterval(20);
        if (Util.isInstance(indic, indicators.VOLUMEIndicator)) {
            let plotter = new plotters.LastVolumePlotter(areaName + "Range.decoration");
            this.setPlotter(plotter.getName(), plotter);
        } else if (Util.isInstance(indic, indicators.BOLLIndicator) || Util.isInstance(indic, indicators.SARIndicator)) {
            let dp = new data_providers.MainDataProvider(areaName + ".main");
            this.setDataProvider(dp.getName(), dp);
            dp.updateData();
            let plotter = new plotters.OHLCPlotter(areaName + ".main");
            this.setPlotter(plotter.getName(), plotter);
        }
        return true;
    }

    removeMainIndicator(dsName) {
        let areaName = dsName + ".main";
        let indicDpName = areaName + ".secondary";
        let indicDp = this.getDataProvider(indicDpName);
        if (indicDp === undefined || !Util.isInstance(indicDp, data_providers.IndicatorDataProvider))
            return;
        this.removeDataProvider(indicDpName);
        this.removePlotter(indicDpName);
    }

    removeIndicator(areaName) {
        let area = this.getArea(areaName);
        if (area === undefined || area.getNameObject().getCompAt(2) === "main")
            return;
        let dp = this.getDataProvider(areaName + ".secondary");
        if (dp === undefined || !Util.isInstance(dp, data_providers.IndicatorDataProvider))
            return;
        let rangeAreaName = areaName + "Range";
        let rangeArea = this.getArea(rangeAreaName);
        if (rangeArea === undefined)
            return;
        let tableLayout = this.getArea(area.getDataSourceName() + ".charts");
        if (tableLayout === undefined)
            return;
        tableLayout.removeArea(area);
        this.removeArea(areaName);
        tableLayout.removeArea(rangeArea);
        this.removeArea(rangeAreaName);
        for (let n in this._dataProviders) {
            if (this._dataProviders[n].getAreaName() === areaName)
                this.removeDataProvider(n);
        }
        for (let n in this._ranges) {
            if (this._ranges[n].getAreaName() === areaName)
                this.removeRange(n);
        }
        for (let n in this._plotters) {
            if (this._plotters[n].getAreaName() === areaName)
                this.removePlotter(n);
        }
        for (let n in this._plotters) {
            if (this._plotters[n].getAreaName() === rangeAreaName)
                this.removePlotter(n);
        }
    }

    getIndicatorParameters(indicName) {
        let indic = this._fakeIndicators[indicName];
        if (indic === undefined) {
            let ret = this.createIndicatorAndRange("", indicName);
            if (ret === null)
                return null;
            this._fakeIndicators[indicName] = indic = ret.indic;
        }
        let params = [];
        let i, cnt = indic.getParameterCount();
        for (i = 0; i < cnt; i++)
            params.push(indic.getParameterAt(i));
        return params;
    }

    setIndicatorParameters(indicName, params) {
        let n, indic;
        for (n in this._dataProviders) {
            let dp = this._dataProviders[n];
            if (Util.isInstance(dp, data_providers.IndicatorDataProvider) === false)
                continue;
            indic = dp.getIndicator();
            if (indic.getName() === indicName) {
                indic.setParameters(params);
                dp.refresh();
            }
        }
        indic = this._fakeIndicators[indicName];
        if (indic === undefined) {
            let ret = this.createIndicatorAndRange("", indicName, true);
            if (ret === null)
                return;
            this._fakeIndicators[indicName] = indic = ret.indic;
        }
        indic.setParameters(params);
    }

    getIndicatorAreaName(dsName, index) {
        let tableLayout = this.getArea(dsName + ".charts");
        let cnt = tableLayout.getAreaCount() >> 1;
        if (index < 0 || index >= cnt)
            return "";
        return tableLayout.getAreaAt(index << 1).getName();
    }

}
