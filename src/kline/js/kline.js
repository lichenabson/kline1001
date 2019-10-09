import { Control } from './control';
import { ChartManager } from './chart_manager';
import '../css/main.css';
import tpl from '../view/tpl.js';

export default class Kline {
  static instance = null;

  constructor(option) {
    this.element = '#kline_container';
    this.chartMgr = null;
    this.buttonDown = false;
    this.init = false;
    this.width = 1200;
    this.height = 650;
    this.symbol = '';
    this.symbolName = '';
    this.range = null;
    this.url = '';
    this.limit = 1000;
    this.theme = 'light';
    this.ranges = ['1w', '1d', '1h', '30m', '15m', '5m', '1m', 'line'];
    this.reverseColor = false;

    Object.assign(this, option);

    Kline.instance = this;
    return Kline.instance;
  }

  draw() {
    Kline.chartMgr = new ChartManager();

    let view = $.parseHTML(tpl);
    $(this.element).html(view);

    this.registerMouseEvent();
    ChartManager.instance.bindCanvas(
      'main',
      document.getElementById('chart_mainCanvas')
    );
    ChartManager.instance.bindCanvas(
      'overlay',
      document.getElementById('chart_overlayCanvas')
    );
    Control.refreshTemplate();
    Control.onSize(this.width, this.height);
    Control.readCookie();
  }

  registerMouseEvent() {
    $(document).ready(function() {
      $('#chart_overlayCanvas').bind('contextmenu', function(e) {
        e.cancelBubble = true;
        e.returnValue = false;
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
      $('#chart_overlayCanvas')
        .mousemove(function(e) {
          let r = e.target.getBoundingClientRect();
          let x = e.clientX - r.left;
          let y = e.clientY - r.top;
          let mgr = ChartManager.instance;
          if (Kline.instance.buttonDown === true) {
            mgr.onMouseMove('frame0', x, y, true);
            mgr.redraw('All', false);
          } else {
            mgr.onMouseMove('frame0', x, y, false);
            mgr.redraw('OverlayCanvas');
          }
        })
        .mouseleave(function(e) {
          let r = e.target.getBoundingClientRect();
          let x = e.clientX - r.left;
          let y = e.clientY - r.top;
          let mgr = ChartManager.instance;
          mgr.onMouseLeave('frame0', x, y, false);
          mgr.redraw('OverlayCanvas');
        })
        .mouseup(function(e) {
          if (e.which !== 1) {
            return;
          }
          Kline.instance.buttonDown = false;
          let r = e.target.getBoundingClientRect();
          let x = e.clientX - r.left;
          let y = e.clientY - r.top;
          let mgr = ChartManager.instance;
          mgr.onMouseUp('frame0', x, y);
          mgr.redraw('All');
        })
        .mousedown(function(e) {
          if (e.which !== 1) {
            ChartManager.instance.deleteToolObject();
            ChartManager.instance.redraw('OverlayCanvas', false);
            return;
          }
          Kline.instance.buttonDown = true;
          let r = e.target.getBoundingClientRect();
          let x = e.clientX - r.left;
          let y = e.clientY - r.top;
          ChartManager.instance.onMouseDown('frame0', x, y);
        });
    });
  }

  onResize(width, height) {
    console.log(
      'DEBUG: chart resized to width: ' + width + ' height: ' + height
    );
  }

  onSymbolChange(symbol, symbolName) {
    console.log('DEBUG: symbol changed to ' + symbol + ' ' + symbolName);
  }

  onThemeChange(theme) {
    console.log('DEBUG: themes changed to : ' + theme);
  }

  onRangeChange(range) {
    console.log('DEBUG: range changed to ' + range);
  }
}
