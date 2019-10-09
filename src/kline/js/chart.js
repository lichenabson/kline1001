import {ChartManager} from './chart_manager'
import {Control} from './control'
import Kline from './kline'
import {Template} from './templates'

export class Chart {

    static strPeriod = {
        'zh-cn': {
            'line': '(分时)',
            '1min': '(1分钟)',
            '5min': '(5分钟)',
            '15min': '(15分钟)',
            '30min': '(30分钟)',
            '1hour': '(1小时)',
            '1day': '(日线)',
            '1week': '(周线)',
            '3min': '(3分钟)',
            '2hour': '(2小时)',
            '4hour': '(4小时)',
            '6hour': '(6小时)',
            '12hour': '(12小时)',
            '3day': '(3天)'
        },
    };

    constructor() {
        this._data = null;
        this._charStyle = "CandleStick";
        this.strIsLine = false;
        this._range = Kline.instance.range;
        this._symbol = Kline.instance.symbol;
    }

    setSymbol(symbol) {
        this._symbol = symbol;
        this.updateDataAndDisplay();
    }

    updateDataAndDisplay() {
        Kline.instance.symbol = this._symbol;
        Kline.instance.range = this._range;
        ChartManager.instance.setNormalMode();
        Control.requestData();
    }

    setCurrentPeriod() {
        this.updateDataAndDisplay();
        Kline.instance.onRangeChange();
    }

    updateDataSource(data) {
        this._data = data;
        ChartManager.instance.updateData("frame0.k0", this._data);
    }

    setMainIndicator(indicName) {
        this._mainIndicator = indicName;
        if (indicName === 'NONE') {
            ChartManager.instance.removeMainIndicator('frame0.k0');
        } else {
            ChartManager.instance.setMainIndicator('frame0.k0', indicName);
        }
        ChartManager.instance.redraw('All', true);
    }

    setIndicator(index, indicName) {
        if (indicName === 'NONE') {
            let index = 2;
            if (Template.displayVolume === false)
                index = 1;
            let areaName = ChartManager.instance.getIndicatorAreaName('frame0.k0', index);
            if (areaName !== '')
                ChartManager.instance.removeIndicator(areaName);
        } else {
            let index = 2;
            if (Template.displayVolume === false)
                index = 1;
            let areaName = ChartManager.instance.getIndicatorAreaName('frame0.k0', index);
            if (areaName === '') {
                Template.createIndicatorChartComps('frame0.k0', indicName);
            } else {
                ChartManager.instance.setIndicator(areaName, indicName);
            }
        }
        ChartManager.instance.redraw('All', true);
    }

    addIndicator(indicName) {
        ChartManager.instance.addIndicator(indicName);
        ChartManager.instance.redraw('All', true);
    }

    removeIndicator(indicName) {
        let areaName = ChartManager.instance.getIndicatorAreaName(2);
        ChartManager.instance.removeIndicator(areaName);
        ChartManager.instance.redraw('All', true);
    };

}