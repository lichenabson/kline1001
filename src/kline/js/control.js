import Kline from './kline'
import {ChartManager} from './chart_manager'
import {ChartSettings} from './chart_settings'
import {DefaultTemplate} from './templates'


export class Control {

    static requestData() {
        Control.requestOverHttp();
    }

    static requestOverHttp() {
        $.ajax({
            type: "GET",
            url: Kline.instance.url,
            dataType: 'json',
            timeout: 30000,
            success: function (res) {
                Control.requestSuccessHandler(res);
            }
        })
    }

    static requestSuccessHandler(res) {
        Kline.instance.chartMgr.updateData("frame0.k0", res.data.candle);
        ChartManager.instance.redraw('All', false);
    }

    static readCookie() {
      let tmp = ChartSettings.get();
      ChartManager.instance.setChartStyle('frame0.k0', tmp.charts.chartStyle);
      ChartManager.instance.getChart().setSymbol("");
    }

    static refreshTemplate() {
        Kline.instance.chartMgr = DefaultTemplate.loadTemplate("frame0.k0", "");
    }

    static onSize(w, h) {
        let width = w || window.innerWidth;
        let chartWidth = width;
        let height = h || window.innerHeight;
        let container = $(Kline.instance.element);
        container.css({
            width: width + 'px',
            height: height + 'px'
        });
        let mainCanvas = $('#chart_mainCanvas')[0];
        let overlayCanvas = $('#chart_overlayCanvas')[0];
        mainCanvas.width = width;
        mainCanvas.height = height;
        overlayCanvas.width = width;
        overlayCanvas.height = height;
        ChartManager.instance.redraw('All', true);
        Kline.instance.onResize(width, height);
    }

    static mouseWheel(e, delta) {
        ChartManager.instance.scale(delta > 0 ? 1 : -1);
        ChartManager.instance.redraw("All", true);
        return false;
    }

    static switchPeriod(name) {
        ChartManager.instance.showCursor();
        if (name === 'line') {
            ChartManager.instance.getChart().strIsLine = true;
            ChartManager.instance.setChartStyle('frame0.k0', 'Line');
            ChartManager.instance.getChart().setCurrentPeriod('line');
        }
    }
}
