import { NamedObject } from './named_object';
import Kline from './kline';

export class DataSource extends NamedObject {
  static UpdateMode = {
    DoNothing: 0,
    Refresh: 1,
    Update: 2,
    Append: 3
  };

  constructor(name) {
    super(name);
  }

  getUpdateMode() {
    return this._updateMode;
  }

  setUpdateMode(mode) {
    this._updateMode = mode;
  }

  getCacheSize() {
    return 0;
  }

  getDataCount() {
    return 0;
  }

  getDataAt(index) {
    return this._dataItems[index];
  }
}

export class MainDataSource extends DataSource {
  constructor(name) {
    super(name);
    this._erasedCount = 0;
    this._dataItems = [];
    this._decimalDigits = 0;
  }

  getCacheSize() {
    return this._dataItems.length;
  }

  getDataCount() {
    return this._dataItems.length;
  }

  getUpdatedCount() {
    return this._updatedCount;
  }

  getAppendedCount() {
    return this._appendedCount;
  }

  getErasedCount() {
    return this._erasedCount;
  }

  getDecimalDigits() {
    return this._decimalDigits;
  }

  calcDecimalDigits(v) {
    let str = '' + v;
    let i = str.indexOf('.');
    if (i < 0) {
      return 0;
    }
    return str.length - 1 - i;
  }

  getLastDate() {
    let count = this.getDataCount();
    if (count < 1) {
      return -1;
    }
    return this.getDataAt(count - 1).date;
  }

  getDataAt(index) {
    return this._dataItems[index];
  }

  update(data) {
    this._updatedCount = 0;
    this._appendedCount = 0;
    this._erasedCount = 0;
    let len = this._dataItems.length;
    // if (len > 0) {
    //   let lastIndex = len - 1;
    //   let lastItem = this._dataItems[lastIndex];
    //   let e,
    //     i,
    //     cnt = data.length;
    //   for (i = 0; i < cnt; i++) {
    //     e = data[i];
    //     if (Number(e.ts) === lastItem.date) {
    //       if (
    //         lastItem.open === Number(e.o) &&
    //         lastItem.high === Number(e.h) &&
    //         lastItem.low === Number(e.l) &&
    //         lastItem.close === Number(e.c) &&
    //         lastItem.volume === Number(e.v)
    //       ) {
    //         this.setUpdateMode(DataSource.UpdateMode.DoNothing);
    //       } else {
    //         this.setUpdateMode(DataSource.UpdateMode.Update);
    //         this._dataItems[lastIndex] = {
    //           date: Number(e.ts),
    //           open: Number(e.o),
    //           high: Number(e.h),
    //           low: Number(e.l),
    //           close: Number(e.c),
    //           volume: Number(e.v)
    //         };
    //         this._updatedCount++;
    //       }
    //       i++;
    //       if (i < cnt) {
    //         this.setUpdateMode(DataSource.UpdateMode.Append);
    //         for (; i < cnt; i++, this._appendedCount++) {
    //           e = data[i];
    //           this._dataItems.push({
    //             date: Number(e.ts),
    //             open: Number(e.o),
    //             high: Number(e.h),
    //             low: Number(e.l),
    //             close: Number(e.c),
    //             volume: Number(e.v)
    //           });
    //         }
    //       }
    //       return true;
    //     }
    //   }
    //   if (cnt < Kline.instance.limit) {
    //     this.setUpdateMode(DataSource.UpdateMode.DoNothing);
    //     return false;
    //   }
    // }
    this.setUpdateMode(DataSource.UpdateMode.Refresh);
    this._dataItems = [];
    let d,
      n,
      e,
      i,
      cnt = data.length;
    for (i = 0; i < cnt; i++) {
      e = data[i];
      for (n = 1; n <= 4; n++) {
        d = this.calcDecimalDigits(e[n]);
        if (this._decimalDigits < d) this._decimalDigits = d;
      }
      this._dataItems.push({
        date: Number(e.ts),
        open: Number(e.o),
        high: Number(e.h),
        low: Number(e.l),
        close: Number(e.c),
        volume: Number(e.v)
      });
    }
    return true;
  }
}
