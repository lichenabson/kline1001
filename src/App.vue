<template>
  <div id="app">
    <div id="kline_container"></div>
    <button @click="line">切换分时</button>
  </div>
</template>

<script>

import Kline from './entry'
import { Control } from './kline/js/control'

export default {
  name: 'app',
  mounted() {
    var kline = new Kline({
        element: "#kline_container",
        width: 1200,
        height: 650,
        theme: 'light', // light/dark
        ranges: ["1w", "1d", "1h", "30m", "15m", "5m", "1m", "line"],
        symbol: "BTC",
        symbolName: "BTC/USD",
        type: "123", // poll/socket
        url: "http://192.168.1.62:8080/officialNetworkApi/CandleStickV2?qid=6&type=6",
        onResize: function(width, height) {
            console.log("chart resized: " + width + " " + height);
        }
    });
     kline.draw();
  },
  methods: {
    line() {
      Control.switchPeriod('line')
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

#kline_container {
  margin: auto;
}

</style>
