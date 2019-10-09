import Kline from './kline'
import {NamedObject} from './named_object'
import {ChartManager} from './chart_manager'
import {Util} from './util'
import * as exprs from './exprs'
import * as themes from './themes'
import * as data_providers from './data_providers'
import * as data_sources from './data_sources'


export class Plotter extends NamedObject {

    static isChrome = (navigator.userAgent.toLowerCase().match(/chrome/) !== null);

    constructor(name) {
        super(name);
    }

    static drawLine(context, x1, y1, x2, y2) {
        context.beginPath();
        context.moveTo((x1 << 0) + 0.5, (y1 << 0) + 0.5);
        context.lineTo((x2 << 0) + 0.5, (y2 << 0) + 0.5);
        context.stroke();
    }

    static drawLines(context, points) {
        let i, cnt = points.length;
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (i = 1; i < cnt; i++)
            context.lineTo(points[i].x, points[i].y);
        if (Plotter.isChrome) {
            context.moveTo(points[0].x, points[0].y);
            for (i = 1; i < cnt; i++)
                context.lineTo(points[i].x, points[i].y);
        }
        context.stroke();
    }

    static drawDashedLine(context, x1, y1, x2, y2, dashLen, dashSolid) {
        if (dashLen < 2) {
            dashLen = 2;
        }
        let dX = x2 - x1;
        let dY = y2 - y1;
        context.beginPath();
        if (dY === 0) {
            let count = (dX / dashLen + 0.5) << 0;
            for (let i = 0; i < count; i++) {
                context.rect(x1, y1, dashSolid, 1);
                x1 += dashLen;
            }
            context.fill();
        } else {
            let count = (Math.sqrt(dX * dX + dY * dY) / dashLen + 0.5) << 0;
            dX = dX / count;
            dY = dY / count;
            let dashX = dX * dashSolid / dashLen;
            let dashY = dY * dashSolid / dashLen;
            for (let i = 0; i < count; i++) {
                context.moveTo(x1 + 0.5, y1 + 0.5);
                context.lineTo(x1 + 0.5 + dashX, y1 + 0.5 + dashY);
                x1 += dX;
                y1 += dY;
            }
            context.stroke();
        }
    }

    static createHorzDashedLine(context, x1, x2, y, dashLen, dashSolid) {
        if (dashLen < 2) {
            dashLen = 2;
        }
        let dX = x2 - x1;
        let count = (dX / dashLen + 0.5) << 0;
        for (let i = 0; i < count; i++) {
            context.rect(x1, y, dashSolid, 1);
            x1 += dashLen;
        }
    }

    static createRectangles(context, rects) {
        context.beginPath();
        let e, i, cnt = rects.length;
        for (i = 0; i < cnt; i++) {
            e = rects[i];
            context.rect(e.x, e.y, e.w, e.h);
        }
    }

    static createPolygon(context, points) {
        context.beginPath();
        context.moveTo(points[0].x + 0.5, points[0].y + 0.5);
        let i, cnt = points.length;
        for (i = 1; i < cnt; i++)
            context.lineTo(points[i].x + 0.5, points[i].y + 0.5);
        context.closePath();
    }

    static drawString(context, str, rect) {
        let w = context.measureText(str).width;
        if (rect.w < w) {
            return false;
        }
        context.fillText(str, rect.x, rect.y);
        rect.x += w;
        rect.w -= w;
        return true;
    }

}


export class BackgroundPlotter extends Plotter {

    constructor(name) {
        super(name);
        this._color = themes.Theme.Color.Background;
    }

    getColor() {
        return this._color;
    }

    setColor(c) {
        this._color = c;
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let area = mgr.getArea(this.getAreaName());
        let theme = mgr.getTheme(this.getFrameName());
        context.fillStyle = theme.getColor(this._color);
        context.fillRect(area.getLeft(), area.getTop(), area.getWidth(), area.getHeight());
    }

}


export class MainAreaBackgroundPlotter extends BackgroundPlotter {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let area = mgr.getArea(this.getAreaName());
        let theme = mgr.getTheme(this.getFrameName());
        let rect = area.getRect();
        context.fillStyle = theme.getColor(this._color);
        context.fillRect(rect.X, rect.Y, rect.Width, rect.Height);
    }

}


export class RangeAreaBackgroundPlotter extends BackgroundPlotter {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let areaName = this.getAreaName();
        let area = mgr.getArea(areaName);
        let range = mgr.getRange(areaName.substring(0, areaName.lastIndexOf("Range")));
        let theme = mgr.getTheme(this.getFrameName());
        context.fillStyle = theme.getColor(this._color);
        context.fillRect(area.getLeft(), area.getTop(), area.getWidth(), area.getHeight());
    }

}


export class TimelineAreaBackgroundPlotter extends BackgroundPlotter {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let area = mgr.getArea(this.getAreaName());
        let theme = mgr.getTheme(this.getFrameName());
        context.fillStyle = theme.getColor(this._color);
        context.fillRect(area.getLeft(), area.getTop(), area.getWidth(), area.getHeight());
    }

}


export class CGridPlotter extends NamedObject {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let area = mgr.getArea(this.getAreaName());
        let timeline = mgr.getTimeline(this.getDataSourceName());
        let range = mgr.getRange(this.getAreaName());
        let clipped = false;
        let theme = mgr.getTheme(this.getFrameName());
        context.fillStyle = theme.getColor(themes.Theme.Color.Grid0);
        context.beginPath();
        let dashLen = 4,
            dashSolid = 1;
        if (Plotter.isChrome) {
            dashLen = 4;
            dashSolid = 1;
        }
        let gradations = range.getGradations();
        for (let n in gradations) {
            Plotter.createHorzDashedLine(context, area.getLeft(), area.getRight(), range.toY(gradations[n]), dashLen, dashSolid);
        }
        context.fill();
        if (clipped) {
            context.restore();
        }
    }

}


export class CandlestickPlotter extends NamedObject {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let ds = mgr.getDataSource(this.getDataSourceName());
        if (ds.getDataCount() < 1) {
            return;
        }
        let area = mgr.getArea(this.getAreaName());
        let timeline = mgr.getTimeline(this.getDataSourceName());
        let range = mgr.getRange(this.getAreaName());
        if (range.getRange() === 0.0) {
            return;
        }
        let theme = mgr.getTheme(this.getFrameName());
        let dark = Util.isInstance(theme, themes.DarkTheme);
        let first = timeline.getFirstIndex();
        let last = timeline.getLastIndex();
        let start = first;;
        let cW = timeline.getColumnWidth();
        let iW = timeline.getItemWidth();
        let left = timeline.toItemLeft(start);
        let center = timeline.toItemCenter(start);
        let strokePosRects = [];
        let fillPosRects = [];
        let fillUchRects = [];
        let fillNegRects = [];
        for (let i = start; i < last; i++) {
            let data = ds.getDataAt(i);
            let high = range.toY(data.high);
            let low = range.toY(data.low);
            let open = data.open;
            let close = data.close;
            if (close > open) {
                let top = range.toY(close);
                let bottom = range.toY(open);
                let iH = Math.max(bottom - top, 1);
                if (iH > 1 && iW > 1 && dark)
                    strokePosRects.push({x: left + 0.5, y: top + 0.5, w: iW - 1, h: iH - 1});
                else
                    fillPosRects.push({x: left, y: top, w: Math.max(iW, 1), h: Math.max(iH, 1)});
                if (data.high > close) {
                    high = Math.min(high, top - 1);
                    fillPosRects.push({x: center, y: high, w: 1, h: top - high});
                }
                if (open > data.low) {
                    low = Math.max(low, bottom + 1);
                    fillPosRects.push({x: center, y: bottom, w: 1, h: low - bottom});
                }
            } else if (close === open) {
                let top = range.toY(close);
                fillUchRects.push({x: left, y: top, w: Math.max(iW, 1), h: 1});
                if (data.high > close)
                    high = Math.min(high, top - 1);
                if (open > data.low)
                    low = Math.max(low, top + 1);
                if (high < low)
                    fillUchRects.push({x: center, y: high, w: 1, h: low - high});
            } else {
                let top = range.toY(open);
                let bottom = range.toY(close);
                let iH = Math.max(bottom - top, 1);
                fillNegRects.push({x: left, y: top, w: Math.max(iW, 1), h: Math.max(iH, 1)});
                if (data.high > open)
                    high = Math.min(high, top - 1);
                if (close > data.low)
                    low = Math.max(low, bottom + 1);
                if (high < low)
                    fillNegRects.push({x: center, y: high, w: 1, h: low - high});
            }
            left += cW;
            center += cW;
        }
        if (strokePosRects.length > 0) {
            context.strokeStyle = theme.getColor(themes.Theme.Color.Positive);
            Plotter.createRectangles(context, strokePosRects);
            context.stroke();
        }
        if (fillPosRects.length > 0) {
            context.fillStyle = theme.getColor(themes.Theme.Color.Positive);
            Plotter.createRectangles(context, fillPosRects);
            context.fill();
        }
        if (fillUchRects.length > 0) {
            context.fillStyle = theme.getColor(themes.Theme.Color.Negative);
            Plotter.createRectangles(context, fillUchRects);
            context.fill();
        }
        if (fillNegRects.length > 0) {
            context.fillStyle = theme.getColor(themes.Theme.Color.Negative);
            Plotter.createRectangles(context, fillNegRects);
            context.fill();
        }
    }

}


export class MainInfoPlotter extends Plotter {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let area = mgr.getArea(this.getAreaName());
        let timeline = mgr.getTimeline(this.getDataSourceName());
        let ds = mgr.getDataSource(this.getDataSourceName());
        let theme = mgr.getTheme(this.getFrameName());
        context.font = theme.getFont(themes.Theme.Font.Default);
        context.textAlign = "left";
        context.textBaseline = "top";
        context.fillStyle = theme.getColor(themes.Theme.Color.Text4);
        let rect = {
            x: area.getLeft() + 4,
            y: area.getTop() + 2,
            w: area.getWidth() - 8,
            h: 20
        };
        let selIndex = timeline.getSelectedIndex();
        if (selIndex < 0)
            return;
        let data = ds.getDataAt(selIndex);
        let digits = ds.getDecimalDigits();
        let time = new Date(data.date);
        let year = time.getFullYear();
        let month = Util.formatTime(time.getMonth() + 1);
        let date = Util.formatTime(time.getDate());
        let hour = Util.formatTime(time.getHours());
        let minute = Util.formatTime(time.getMinutes());
        let lang = mgr.getLanguage();
        if (lang === "zh-cn") {
            // if (!Plotter.drawString(context, '时间: ' +
            //         year + '-' + month + '-' + date + '  ' + hour + ':' + minute, rect))
            //     return;
            if (!Plotter.drawString(context, '  开: ' + data.open.toFixed(digits), rect))
                return;
            if (!Plotter.drawString(context, '  高: ' + data.high.toFixed(digits), rect))
                return;
            if (!Plotter.drawString(context, '  低: ' + data.low.toFixed(digits), rect))
                return;
            if (!Plotter.drawString(context, '  收: ' + data.close.toFixed(digits), rect))
                return;
        } else if (lang === "en-us") {
            // if (!Plotter.drawString(context, 'DATE: ' +
            //         year + '-' + month + '-' + date + '  ' + hour + ':' + minute, rect))
            //     return;
            if (!Plotter.drawString(context, '  O: ' + data.open.toFixed(digits), rect))
                return;
            if (!Plotter.drawString(context, '  H: ' + data.high.toFixed(digits), rect))
                return;
            if (!Plotter.drawString(context, '  L: ' + data.low.toFixed(digits), rect))
                return;
            if (!Plotter.drawString(context, '  C: ' + data.close.toFixed(digits), rect))
                return;
        } else if (lang === "zh-tw") {
            // if (!Plotter.drawString(context, '時間: ' +
            //         year + '-' + month + '-' + date + '  ' + hour + ':' + minute, rect))
            //     return;
            if (!Plotter.drawString(context, '  開: ' + data.open.toFixed(digits), rect))
                return;
            if (!Plotter.drawString(context, '  高: ' + data.high.toFixed(digits), rect))
                return;
            if (!Plotter.drawString(context, '  低: ' + data.low.toFixed(digits), rect))
                return;
            if (!Plotter.drawString(context, '  收: ' + data.close.toFixed(digits), rect))
                return;
        }
        if (selIndex > 0) {
            if (lang === "zh-cn") {
                if (!Plotter.drawString(context, '  涨幅: ', rect))
                    return;
            } else if (lang === "en-us") {
                if (!Plotter.drawString(context, '  CHANGE: ', rect))
                    return;
            } else if (lang === "zh-tw") {
                if (!Plotter.drawString(context, '  漲幅: ', rect))
                    return;
            }
            let prev = ds.getDataAt(selIndex - 1);
            let change;
            if ((data.close - prev.close) / prev.close * 100.0) {
                change = (data.close - prev.close) / prev.close * 100.0;
            } else {
                change = 0.00;
            }


            if (change >= 0) {
                change = ' ' + change.toFixed(2);
                context.fillStyle = theme.getColor(themes.Theme.Color.TextPositive);
            } else {
                change = change.toFixed(2);
                context.fillStyle = theme.getColor(themes.Theme.Color.TextNegative);
            }
            if (!Plotter.drawString(context, change, rect))
                return;
            context.fillStyle = theme.getColor(themes.Theme.Color.Text4);
            if (!Plotter.drawString(context, ' %', rect))
                return;
        }

        let amplitude;
        if ((data.high - data.low) / data.low * 100.0) {
            amplitude = (data.high - data.low) / data.low * 100.0;
        } else {
            amplitude = 0.00;
        }

        if (lang === "zh-cn") {
            if (!Plotter.drawString(context, '  振幅: ' + amplitude.toFixed(2) + ' %', rect)) {
                return;
            }
            // if (!Plotter.drawString(context, '  量: ' + data.volume.toFixed(2), rect)) {
            //     return;
            // }
        } else if (lang === "en-us") {
            if (!Plotter.drawString(context, '  AMPLITUDE: ' + amplitude.toFixed(2) + ' %', rect)) {
                return;
            }
            // if (!Plotter.drawString(context, '  V: ' + data.volume.toFixed(2), rect)) {
            //     return;
            // }
        } else if (lang === "zh-tw") {
            if (!Plotter.drawString(context, '  振幅: ' + amplitude.toFixed(2) + ' %', rect)) {
                return;
            }
            // if (!Plotter.drawString(context, '  量: ' + data.volume.toFixed(2), rect)) {
            //     return;
            // }
        }
        let dp = mgr.getDataProvider(this.getAreaName() + ".secondary");
        if (dp === undefined) {
            return;
        }
        let indic = dp.getIndicator();
        let n, cnt = indic.getOutputCount();
        for (n = 0; n < cnt; n++) {
            let out = indic.getOutputAt(n);
            let v = out.execute(selIndex);
            if (isNaN(v)) {
                continue;
            }
            let info = "  " + out.getName() + ": " + v.toFixed(digits);
            let color = out.getColor();
            if (color === undefined) {
                color = themes.Theme.Color.Indicator0 + n;
            }
            context.fillStyle = theme.getColor(color);
            if (!Plotter.drawString(context, info, rect)) {
                return;
            }
        }
    }

}


export class IndicatorPlotter extends NamedObject {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let area = mgr.getArea(this.getAreaName());
        let timeline = mgr.getTimeline(this.getDataSourceName());
        let range = mgr.getRange(this.getAreaName());
        if (range.getRange() === 0.0)
            return;
        let dp = mgr.getDataProvider(this.getName());
        if (!Util.isInstance(dp, data_providers.IndicatorDataProvider))
            return;
        let theme = mgr.getTheme(this.getFrameName());
        let cW = timeline.getColumnWidth();
        let first = timeline.getFirstIndex();
        let last = timeline.getLastIndex();
        let start = first;
        let indic = dp.getIndicator();
        let out, n, outCount = indic.getOutputCount();
        for (n = 0; n < outCount; n++) {
            out = indic.getOutputAt(n);
            let style = out.getStyle();
            if (style === exprs.OutputExpr.outputStyle.VolumeStick) {
                this.drawVolumeStick(context, theme,
                    mgr.getDataSource(this.getDataSourceName()), start, last,
                    timeline.toItemLeft(start), cW, timeline.getItemWidth(), range);
            } else if (style === exprs.OutputExpr.outputStyle.MACDStick) {
                this.drawMACDStick(context, theme,
                    out, start, last,
                    timeline.toItemLeft(start), cW, timeline.getItemWidth(), range);
            } else if (style === exprs.OutputExpr.outputStyle.SARPoint) {
                this.drawSARPoint(context, theme,
                    out, start, last,
                    timeline.toItemCenter(start), cW, timeline.getItemWidth(), range);
            }
        }
        let left = timeline.toColumnLeft(start);
        let center = timeline.toItemCenter(start);
        context.save();
        context.rect(left, area.getTop(), area.getRight() - left, area.getHeight());
        context.clip();
        context.translate(0.5, 0.5);
        for (n = 0; n < outCount; n++) {
            let x = center;
            out = indic.getOutputAt(n);
            if (out.getStyle() === exprs.OutputExpr.outputStyle.Line) {
                let v, points = [];
                if (start > first) {
                    v = out.execute(start - 1);
                    if (isNaN(v) === false)
                        points.push({"x": x - cW, "y": range.toY(v)});
                }
                for (let i = start; i < last; i++, x += cW) {
                    v = out.execute(i);
                    if (isNaN(v) === false)
                        points.push({"x": x, "y": range.toY(v)});
                }
                if (points.length > 0) {
                    let color = out.getColor();
                    if (color === undefined)
                        color = themes.Theme.Color.Indicator0 + n;
                    context.strokeStyle = theme.getColor(color);
                    Plotter.drawLines(context, points);
                }
            }
        }
        context.restore();
    }

    drawVolumeStick(context, theme, ds, first, last, startX, cW, iW, range) {
        let dark = Util.isInstance(theme, themes.DarkTheme);
        let left = startX;
        let bottom = range.toY(0);
        let strokePosRects = [];
        let fillPosRects = [];
        let fillNegRects = [];
        for (let i = first; i < last; i++) {
            let data = ds.getDataAt(i);
            let top = range.toY(data.volume);
            let iH = range.toHeight(data.volume);
            if (data.close > data.open) {
                if (iH > 1 && iW > 1 && dark) {
                    strokePosRects.push({x: left + 0.5, y: top + 0.5, w: iW - 1, h: iH - 1});
                } else {
                    fillPosRects.push({x: left, y: top, w: Math.max(iW, 1), h: Math.max(iH, 1)});
                }
            } else if (data.close === data.open) {
                if (i > 0 && data.close >= ds.getDataAt(i - 1).close) {
                    if (iH > 1 && iW > 1 && dark) {
                        strokePosRects.push({x: left + 0.5, y: top + 0.5, w: iW - 1, h: iH - 1});
                    } else {
                        fillPosRects.push({x: left, y: top, w: Math.max(iW, 1), h: Math.max(iH, 1)});
                    }
                } else {
                    fillNegRects.push({x: left, y: top, w: Math.max(iW, 1), h: Math.max(iH, 1)});
                }
            } else {
                fillNegRects.push({x: left, y: top, w: Math.max(iW, 1), h: Math.max(iH, 1)});
            }
            left += cW;
        }
        if (strokePosRects.length > 0) {
            context.strokeStyle = theme.getColor(themes.Theme.Color.Positive);
            Plotter.createRectangles(context, strokePosRects);
            context.stroke();
        }
        if (fillPosRects.length > 0) {
            context.fillStyle = theme.getColor(themes.Theme.Color.Positive);
            Plotter.createRectangles(context, fillPosRects);
            context.fill();
        }
        if (fillNegRects.length > 0) {
            context.fillStyle = theme.getColor(themes.Theme.Color.Negative);
            Plotter.createRectangles(context, fillNegRects);
            context.fill();
        }
    }

    drawMACDStick(context, theme, output, first, last, startX, cW, iW, range) {
        let left = startX;
        let middle = range.toY(0);
        let strokePosRects = [];
        let strokeNegRects = [];
        let fillPosRects = [];
        let fillNegRects = [];
        let prevMACD = (first > 0) ? output.execute(first - 1) : NaN;
        for (let i = first; i < last; i++) {
            let MACD = output.execute(i);
            if (MACD >= 0) {
                let iH = range.toHeight(MACD);
                if ((i === 0 || MACD >= prevMACD) && iH > 1 && iW > 1)
                    strokePosRects.push({x: left + 0.5, y: middle - iH + 0.5, w: iW - 1, h: iH - 1});
                else
                    fillPosRects.push({x: left, y: middle - iH, w: Math.max(iW, 1), h: Math.max(iH, 1)});
            } else {
                let iH = range.toHeight(-MACD);
                if ((i === 0 || MACD >= prevMACD) && iH > 1 && iW > 1)
                    strokeNegRects.push({x: left + 0.5, y: middle + 0.5, w: iW - 1, h: iH - 1});
                else
                    fillNegRects.push({x: left, y: middle, w: Math.max(iW, 1), h: Math.max(iH, 1)});
            }
            prevMACD = MACD;
            left += cW;
        }
        if (strokePosRects.length > 0) {
            context.strokeStyle = theme.getColor(themes.Theme.Color.Positive);
            Plotter.createRectangles(context, strokePosRects);
            context.stroke();
        }
        if (strokeNegRects.length > 0) {
            context.strokeStyle = theme.getColor(themes.Theme.Color.Negative);
            Plotter.createRectangles(context, strokeNegRects);
            context.stroke();
        }
        if (fillPosRects.length > 0) {
            context.fillStyle = theme.getColor(themes.Theme.Color.Positive);
            Plotter.createRectangles(context, fillPosRects);
            context.fill();
        }
        if (fillNegRects.length > 0) {
            context.fillStyle = theme.getColor(themes.Theme.Color.Negative);
            Plotter.createRectangles(context, fillNegRects);
            context.fill();
        }
    }

    drawSARPoint(context, theme, output, first, last, startX, cW, iW, range) {
        let r = iW >> 1;
        if (r < 0.5) r = 0.5;
        if (r > 4) r = 4;
        let center = startX;
        let right = center + r;
        let endAngle = 2 * Math.PI;
        context.save();
        context.translate(0.5, 0.5);
        context.strokeStyle = theme.getColor(themes.Theme.Color.Indicator3);
        context.beginPath();
        for (let i = first; i < last; i++) {
            let y = range.toY(output.execute(i));
            context.moveTo(right, y);
            context.arc(center, y, r, 0, endAngle);
            center += cW;
            right += cW;
        }
        context.stroke();
        context.restore();
    }

}


export class IndicatorInfoPlotter extends Plotter {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let area = mgr.getArea(this.getAreaName());
        let timeline = mgr.getTimeline(this.getDataSourceName());
        let dp = mgr.getDataProvider(this.getAreaName() + ".secondary");
        let theme = mgr.getTheme(this.getFrameName());
        context.font = theme.getFont(themes.Theme.Font.Default);
        context.textAlign = "left";
        context.textBaseline = "top";
        context.fillStyle = theme.getColor(themes.Theme.Color.Text4);
        let rect = {
            x: area.getLeft() + 4,
            y: area.getTop() + 2,
            w: area.getWidth() - 8,
            h: 20
        };
        let indic = dp.getIndicator();
        let title;
        switch (indic.getParameterCount()) {
            case 0:
                title = indic.getName();
                break;
            case 1:
                title = indic.getName() + "(" +
                    indic.getParameterAt(0).getValue() +
                    ")";
                break;
            case 2:
                title = indic.getName() + "(" +
                    indic.getParameterAt(0).getValue() + "," +
                    indic.getParameterAt(1).getValue() +
                    ")";
                break;
            case 3:
                title = indic.getName() + "(" +
                    indic.getParameterAt(0).getValue() + "," +
                    indic.getParameterAt(1).getValue() + "," +
                    indic.getParameterAt(2).getValue() +
                    ")";
                break;
            case 4:
                title = indic.getName() + "(" +
                    indic.getParameterAt(0).getValue() + "," +
                    indic.getParameterAt(1).getValue() + "," +
                    indic.getParameterAt(2).getValue() + "," +
                    indic.getParameterAt(3).getValue() +
                    ")";
                break;
            default:
                return;
        }
        if (!Plotter.drawString(context, title, rect))
            return;
        let selIndex = timeline.getSelectedIndex();
        if (selIndex < 0)
            return;
        let out, v, info, color;
        let n, cnt = indic.getOutputCount();
        for (n = 0; n < cnt; n++) {
            out = indic.getOutputAt(n);
            v = out.execute(selIndex);
            if (isNaN(v))
                continue;
            info = "  " + out.getName() + ": " + v.toFixed(2);
            color = out.getColor();
            if (color === undefined)
                color = themes.Theme.Color.Indicator0 + n;
            context.fillStyle = theme.getColor(color);
            if (!Plotter.drawString(context, info, rect))
                return;
        }
    }

}


export class MinMaxPlotter extends NamedObject {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let ds = mgr.getDataSource(this.getDataSourceName());
        if (ds.getDataCount() < 1)
            return;
        let timeline = mgr.getTimeline(this.getDataSourceName());
        if (timeline.getInnerWidth() < timeline.getColumnWidth())
            return;
        let range = mgr.getRange(this.getAreaName());
        if (range.getRange() === 0)
            return;
        let dp = mgr.getDataProvider(this.getAreaName() + ".main");
        let first = timeline.getFirstIndex();
        let center = (first + timeline.getLastIndex()) >> 1;
        let theme = mgr.getTheme(this.getFrameName());
        context.font = theme.getFont(themes.Theme.Font.Default);
        context.textBaseline = "middle";
        context.fillStyle = theme.getColor(themes.Theme.Color.Text4);
        context.strokeStyle = theme.getColor(themes.Theme.Color.Text4);
        let digits = ds.getDecimalDigits();
        this.drawMark(context, dp.getMinValue(), digits, range.toY(dp.getMinValue()),
            first, center, dp.getMinValueIndex(), timeline);
        this.drawMark(context, dp.getMaxValue(), digits, range.toY(dp.getMaxValue()),
            first, center, dp.getMaxValueIndex(), timeline);
    }

    drawMark(context, v, digits, y, first, center, index, timeline) {
        let arrowStart, arrowStop, _arrowStop;
        let textStart;
        if (index > center) {
            context.textAlign = "right";
            arrowStart = timeline.toItemCenter(index) - 4;
            arrowStop = arrowStart - 7;
            _arrowStop = arrowStart - 3;
            textStart = arrowStop - 4;
        } else {
            context.textAlign = "left";
            arrowStart = timeline.toItemCenter(index) + 4;
            arrowStop = arrowStart + 7;
            _arrowStop = arrowStart + 3;
            textStart = arrowStop + 4;
        }
        Plotter.drawLine(context, arrowStart, y, arrowStop, y);
        Plotter.drawLine(context, arrowStart, y, _arrowStop, y + 2);
        Plotter.drawLine(context, arrowStart, y, _arrowStop, y - 2);
        context.fillText(Util.fromFloat(v, digits), textStart, y);
    }

}


export class TimelinePlotter extends Plotter {

    static TP_MINUTE = 60 * 1000;
    static TP_HOUR = 60 * TimelinePlotter.TP_MINUTE;
    static TP_DAY = 24 * TimelinePlotter.TP_HOUR;

    static TIME_INTERVAL = [
        5 * TimelinePlotter.TP_MINUTE,
        10 * TimelinePlotter.TP_MINUTE,
        15 * TimelinePlotter.TP_MINUTE,
        30 * TimelinePlotter.TP_MINUTE,
        TimelinePlotter.TP_HOUR,
        2 * TimelinePlotter.TP_HOUR,
        3 * TimelinePlotter.TP_HOUR,
        6 * TimelinePlotter.TP_HOUR,
        12 * TimelinePlotter.TP_HOUR,
        TimelinePlotter.TP_DAY,
        2 * TimelinePlotter.TP_DAY
    ];

    static MonthConvert = {
        1: "Jan.",
        2: "Feb.",
        3: "Mar.",
        4: "Apr.",
        5: "May.",
        6: "Jun.",
        7: "Jul.",
        8: "Aug.",
        9: "Sep.",
        10: "Oct.",
        11: "Nov.",
        12: "Dec."
    };

    constructor(name) {
        super(name);
    }

    Draw(context) {

        let mgr = ChartManager.instance;
        let area = mgr.getArea(this.getAreaName());
        let timeline = mgr.getTimeline(this.getDataSourceName());
        let ds = mgr.getDataSource(this.getDataSourceName());
        if (ds.getDataCount() < 2)
            return;
        let timeInterval = ds.getDataAt(1).date - ds.getDataAt(0).date;
        let n, cnt = TimelinePlotter.TIME_INTERVAL.length;
        for (n = 0; n < cnt; n++) {
            if (timeInterval < TimelinePlotter.TIME_INTERVAL[n])
                break;
        }
        for (; n < cnt; n++) {
            if (TimelinePlotter.TIME_INTERVAL[n] % timeInterval === 0)
                if ((TimelinePlotter.TIME_INTERVAL[n] / timeInterval) * timeline.getColumnWidth() > 60)
                    break;
        }
        let first = timeline.getFirstIndex();
        let last = timeline.getLastIndex();
        let d = new Date();
        let local_utc_diff = d.getTimezoneOffset() * 60 * 1000;
        let theme = mgr.getTheme(this.getFrameName());
        context.font = theme.getFont(themes.Theme.Font.Default);
        context.textAlign = "center";
        context.textBaseline = "middle";
        let lang = mgr.getLanguage();
        let gridRects = [];
        let top = area.getTop();
        let middle = area.getMiddle();
        for (let i = first; i < last; i++) {
            let utcDate = ds.getDataAt(i).date;
            let localDate = utcDate - local_utc_diff;
            let time = new Date(utcDate);
            let year = time.getFullYear();
            let month = time.getMonth() + 1;
            let date = time.getDate();
            let hour = time.getHours();
            let minute = time.getMinutes();
            let text = "";
            if (n < cnt) {
                let m = Math.max(
                    TimelinePlotter.TP_DAY,
                    TimelinePlotter.TIME_INTERVAL[n]);
                if (localDate % m === 0) {
                    if (lang === "zh-cn")
                        text = month.toString() + "月" + date.toString() + "日";
                    else if (lang === "zh-tw")
                        text = month.toString() + "月" + date.toString() + "日";
                    else if (lang === "en-us")
                        text = TimelinePlotter.MonthConvert[month] + " " + date.toString();
                    context.fillStyle = theme.getColor(themes.Theme.Color.Text4);
                } else if (localDate % TimelinePlotter.TIME_INTERVAL[n] === 0) {
                    let strMinute = minute.toString();
                    if (minute < 10)
                        strMinute = "0" + strMinute;
                    text = hour.toString() + ":" + strMinute;
                    context.fillStyle = theme.getColor(themes.Theme.Color.Text2);
                }
            } else if (date === 1 && (hour < (timeInterval / TimelinePlotter.TP_HOUR))) {
                if (month === 1) {
                    text = year.toString();
                    if (lang === "zh-cn")
                        text += "年";
                    else if (lang === "zh-tw")
                        text += "年";
                } else {
                    if (lang === "zh-cn")
                        text = month.toString() + "月";
                    else if (lang === "zh-tw")
                        text = month.toString() + "月";
                    else if (lang === "en-us")
                        text = TimelinePlotter.MonthConvert[month];
                }
                context.fillStyle = theme.getColor(themes.Theme.Color.Text4);
            }
            if (text.length > 0) {
                let x = timeline.toItemCenter(i);
                gridRects.push({x: x, y: top, w: 1, h: 4});
                context.fillText(text, x, middle);
            }
        }
        if (gridRects.length > 0) {
            context.fillStyle = theme.getColor(themes.Theme.Color.Grid1);
            Plotter.createRectangles(context, gridRects);
            context.fill();
        }
        // 绘制横线
        context.fillRect(0, top, area.getWidth(), 1)
    }

}


export class RangePlotter extends NamedObject {

    constructor(name) {
        super(name);
    }

    getRequiredWidth(context, v) {
        let mgr = ChartManager.instance;
        let theme = mgr.getTheme(this.getFrameName());
        context.font = theme.getFont(themes.Theme.Font.Default);
        return context.measureText((Math.floor(v) + 0.88).toString()).width + 16;
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let areaName = this.getAreaName();
        let area = mgr.getArea(areaName);
        let rangeName = areaName.substring(0, areaName.lastIndexOf("Range"));
        let range = mgr.getRange(rangeName);
        if (range.getRange() === 0.0)
            return;
        let gradations = range.getGradations();
        if (gradations.length === 0)
            return;
        let left = area.getLeft();
        let right = area.getRight();
        let center = area.getCenter();
        let theme = mgr.getTheme(this.getFrameName());
        context.font = theme.getFont(themes.Theme.Font.Default);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = theme.getColor(themes.Theme.Color.Text2);
        let gridRects = [];
        for (let n in gradations) {
            let y = range.toY(gradations[n]);
            gridRects.push({x: left, y: y, w: 6, h: 1});
            gridRects.push({x: right - 6, y: y, w: 6, h: 1});
            context.fillText(Util.fromFloat(gradations[n], 2), center, y);
        }
        if (gridRects.length > 0) {
            context.fillStyle = theme.getColor(themes.Theme.Color.Grid1);
            Plotter.createRectangles(context, gridRects);
            context.fill();
        }
    }

}


export class LastVolumePlotter extends Plotter {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let timeline = mgr.getTimeline(this.getDataSourceName());
        let areaName = this.getAreaName();
        let area = mgr.getArea(areaName);
        let rangeName = areaName.substring(0, areaName.lastIndexOf("Range"));
        let range = mgr.getRange(rangeName);
        if (range.getRange() === 0.0)
            return;
        let ds = mgr.getDataSource(this.getDataSourceName());
        if (ds.getDataCount() < 1)
            return;
        let theme = mgr.getTheme(this.getFrameName());
        context.font = theme.getFont(themes.Theme.Font.Default);
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillStyle = theme.getColor(themes.Theme.Color.RangeMark);
        context.strokeStyle = theme.getColor(themes.Theme.Color.RangeMark);
        let v = ds.getDataAt(ds.getDataCount() - 1).volume;
        let y = range.toY(v);
        let left = area.getLeft() + 1;
        Plotter.drawLine(context, left, y, left + 7, y);
        Plotter.drawLine(context, left, y, left + 3, y + 2);
        Plotter.drawLine(context, left, y, left + 3, y - 2);
        context.fillText(Util.fromFloat(v, 2), left + 10, y);
    }

}


export class LastClosePlotter extends Plotter {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let timeline = mgr.getTimeline(this.getDataSourceName());
        let areaName = this.getAreaName();
        let area = mgr.getArea(areaName);
        let rangeName = areaName.substring(0, areaName.lastIndexOf("Range"));
        let range = mgr.getRange(rangeName);
        if (range.getRange() === 0.0)
            return;
        let ds = mgr.getDataSource(this.getDataSourceName());
        if (ds.getDataCount() < 1)
            return;
        let v = ds._dataItems[ds._dataItems.length - 1].close;
        if (v <= range.getMinValue() || v >= range.getMaxValue())
            return;
        let theme = mgr.getTheme(this.getFrameName());
        context.font = theme.getFont(themes.Theme.Font.Default);
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillStyle = theme.getColor(themes.Theme.Color.RangeMark);
        context.strokeStyle = theme.getColor(themes.Theme.Color.RangeMark);
        let y = range.toY(v);
        let left = area.getLeft() + 1;
        Plotter.drawLine(context, left, y, left + 7, y);
        Plotter.drawLine(context, left, y, left + 3, y + 2);
        Plotter.drawLine(context, left, y, left + 3, y - 2);
        context.fillText(Util.fromFloat(v, ds.getDecimalDigits()), left + 10, y);
    }

}


export class SelectionPlotter extends Plotter {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        if (mgr._drawingTool !== ChartManager.DrawingTool.CrossCursor) {
            return;
        }
        let area = mgr.getArea(this.getAreaName());
        let timeline = mgr.getTimeline(this.getDataSourceName());
        if (timeline.getSelectedIndex() < 0) {
            return;
        }
        let range = mgr.getRange(this.getAreaName());
        let theme = mgr.getTheme(this.getFrameName());
        context.strokeStyle = theme.getColor(themes.Theme.Color.Cursor);
        let x = timeline.toItemCenter(timeline.getSelectedIndex());
        Plotter.drawLine(context, x, area.getTop() - 1, x, area.getBottom());
        let pos = range.getSelectedPosition();
        if (pos >= 0) {
            Plotter.drawLine(context, area.getLeft(), pos, area.getRight(), pos);
        }
    }

}


export class TimelineSelectionPlotter extends Plotter {

    static MonthConvert = {
        1: "Jan.",
        2: "Feb.",
        3: "Mar.",
        4: "Apr.",
        5: "May.",
        6: "Jun.",
        7: "Jul.",
        8: "Aug.",
        9: "Sep.",
        10: "Oct.",
        11: "Nov.",
        12: "Dec."
    };

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let area = mgr.getArea(this.getAreaName());
        let timeline = mgr.getTimeline(this.getDataSourceName());
        if (timeline.getSelectedIndex() < 0)
            return;
        let ds = mgr.getDataSource(this.getDataSourceName());
        if (!Util.isInstance(ds, data_sources.MainDataSource))
            return;
        let theme = mgr.getTheme(this.getFrameName());
        let lang = mgr.getLanguage();
        let x = timeline.toItemCenter(timeline.getSelectedIndex());
        context.fillStyle = theme.getColor(themes.Theme.Color.Background);
        context.fillRect(x - 52.5, area.getTop() + 2.5, 106, 18);
        context.strokeStyle = theme.getColor(themes.Theme.Color.Grid3);
        context.strokeRect(x - 52.5, area.getTop() + 2.5, 106, 18);
        context.font = theme.getFont(themes.Theme.Font.Default);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = theme.getColor(themes.Theme.Color.Text4);
        let time = new Date(ds.getDataAt(timeline.getSelectedIndex()).date);
        let month = time.getMonth() + 1;
        let date = time.getDate();
        let hour = time.getHours();
        let minute = time.getMinutes();
        let second = time.getSeconds();
        let strMonth = month.toString();
        let strDate = date.toString();
        let strHour = hour.toString();
        let strMinute = minute.toString();
        let strSecond = second.toString();
        if (minute < 10) {
            strMinute = "0" + strMinute;
        }
        if (second < 10) {
            strSecond = "0" + strSecond;
        }
        let text = "";
        if (lang === "zh-cn") {
            text = strMonth + "月" + strDate + "日  " +
                strHour + ":" + strMinute;
        } else if (lang === "zh-tw") {
            text = strMonth + "月" + strDate + "日  " +
                strHour + ":" + strMinute;
        } else if (lang === "en-us") {
            text = TimelineSelectionPlotter.MonthConvert[month] + " " + strDate + "  " +
                strHour + ":" + strMinute;
        }
        if (Kline.instance.range < 60000) {
            text += ":" + strSecond;
        }
        context.fillText(text, x, area.getMiddle());
    }

}


export class RangeSelectionPlotter extends NamedObject {

    constructor(name) {
        super(name);
    }

    Draw(context) {
        let mgr = ChartManager.instance;
        let areaName = this.getAreaName();
        let area = mgr.getArea(areaName);
        let timeline = mgr.getTimeline(this.getDataSourceName());
        if (timeline.getSelectedIndex() < 0) {
            return;
        }
        let rangeName = areaName.substring(0, areaName.lastIndexOf("Range"));
        let range = mgr.getRange(rangeName);
        if (range.getRange() === 0.0 || range.getSelectedPosition() < 0) {
            return;
        }
        let v = range.getSelectedValue();
        if (v === -Number.MAX_VALUE) {
            return;
        }
        let y = range.getSelectedPosition();
        Plotter.createPolygon(context, [
            {"x": area.getLeft(), "y": y},
            {"x": area.getLeft() + 5, "y": y + 10},
            {"x": area.getRight() - 3, "y": y + 10},
            {"x": area.getRight() - 3, "y": y - 10},
            {"x": area.getLeft() + 5, "y": y - 10}
        ]);
        let theme = mgr.getTheme(this.getFrameName());
        context.fillStyle = theme.getColor(themes.Theme.Color.Background);
        context.fill();
        context.strokeStyle = theme.getColor(themes.Theme.Color.Grid4);
        context.stroke();
        context.font = theme.getFont(themes.Theme.Font.Default);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = theme.getColor(themes.Theme.Color.Text3);
        let digits = 2;
        if (range.getNameObject().getCompAt(2) === "main") {
            digits = mgr.getDataSource(this.getDataSourceName()).getDecimalDigits();
        }
        context.fillText(Util.fromFloat(v, digits), area.getCenter(), y);
    }

}
