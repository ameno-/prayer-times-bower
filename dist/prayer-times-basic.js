(function() {
  var DMath, PrayTimes, prayTimes;

  DMath = {
    dtr: function(d) {
      return d * Math.PI / 180.0;
    },
    rtd: function(r) {
      return r * 180.0 / Math.PI;
    },
    sin: function(d) {
      return Math.sin(this.dtr(d));
    },
    cos: function(d) {
      return Math.cos(this.dtr(d));
    },
    tan: function(d) {
      return Math.tan(this.dtr(d));
    },
    arcsin: function(d) {
      return this.rtd(Math.asin(d));
    },
    arccos: function(d) {
      return this.rtd(Math.acos(d));
    },
    arctan: function(d) {
      return this.rtd(Math.atan(d));
    },
    arccot: function(x) {
      return this.rtd(Math.atan(1 / x));
    },
    arctan2: function(y, x) {
      return this.rtd(Math.atan2(y, x));
    },
    fixAngle: function(a) {
      return this.fix(a, 360);
    },
    fixHour: function(a) {
      return this.fix(a, 24);
    },
    fix: function(a, b) {
      a = a - (b * Math.floor(a / b));
      if (a < 0) {
        return a + b;
      } else {
        return a;
      }
    }
  };

  prayTimes = new PrayTimes;


  /* 
  
  PrayTimes.js: Prayer Times Calculator (ver 2.3)
  Copyright (C) 2007-2011 PrayTimes.org
  
  Developer: Hamid Zarrabi-Zadeh
  License: GNU LGPL v3.0
  
  TERMS OF USE:
  	Permission is granted to use this code, with or 
  	without modification, in any website or application 
  	provided that credit is given to the original work 
  	with a link back to PrayTimes.org.
  
  This program is distributed in the hope that it will 
  be useful, but WITHOUT ANY WARRANTY. 
  
  PLEASE DO NOT REMOVE THIS COPYRIGHT BLOCK.
   */


  /*
  
  User's Manual: 
  http://praytimes.org/manual
  
  Calculation Formulas: 
  http://praytimes.org/calculation
  
  //------------------------ User Interface -------------------------
  
  	getTimes (date, coordinates [, timeZone [, dst [, timeFormat]]]) 
  
  	setMethod (method)       // set calculation method 
  	adjust (parameters)      // adjust calculation parameters	
  	tune (offsets)           // tune times by given offsets 
  
  	getMethod ()             // get calculation method 
  	getSetting ()            // get current calculation parameters
  	getOffsets ()            // get current time offsets
  
  //------------------------- Sample Usage --------------------------
  
  	var PT = new PrayTimes('ISNA');
  	var times = PT.getTimes(new Date(), [43, -80], -5);
  	document.write('Sunrise = '+ times.sunrise)
   */

  PrayTimes = function(method) {
    var i;
    var params;
    var calcMethod, defParams, defaultParams, elv, i, id, invalidTime, j, jDate, lat, lng, methods, numIterations, offset, params, setting, timeFormat, timeNames, timeSuffixes, timeZone;
    timeNames = {
      imsak: 'Imsak',
      fajr: 'Fajr',
      sunrise: 'Sunrise',
      dhuhr: 'Dhuhr',
      asr: 'Asr',
      sunset: 'Sunset',
      maghrib: 'Maghrib',
      isha: 'Isha',
      midnight: 'Midnight'
    };
    methods = {
      MWL: {
        name: 'Muslim World League',
        params: {
          fajr: 18,
          isha: 17
        }
      },
      ISNA: {
        name: 'Islamic Society of North America (ISNA)',
        params: {
          fajr: 15,
          isha: 15
        }
      },
      Egypt: {
        name: 'Egyptian General Authority of Survey',
        params: {
          fajr: 19.5,
          isha: 17.5
        }
      },
      Makkah: {
        name: 'Umm Al-Qura University, Makkah',
        params: {
          fajr: 18.5,
          isha: '90 min'
        }
      },
      Karachi: {
        name: 'University of Islamic Sciences, Karachi',
        params: {
          fajr: 18,
          isha: 18
        }
      },
      Tehran: {
        name: 'Institute of Geophysics, University of Tehran',
        params: {
          fajr: 17.7,
          isha: 14,
          maghrib: 4.5,
          midnight: 'Jafari'
        }
      },
      Jafari: {
        name: 'Shia Ithna-Ashari, Leva Institute, Qum',
        params: {
          fajr: 16,
          isha: 14,
          maghrib: 4,
          midnight: 'Jafari'
        }
      }
    };
    defaultParams = {
      maghrib: '0 min',
      midnight: 'Standard'
    };
    calcMethod = 'MWL';
    setting = {
      imsak: '10 min',
      dhuhr: '0 min',
      asr: 'Standard',
      highLats: 'NightMiddle'
    };
    timeFormat = '24h';
    timeSuffixes = ['am', 'pm'];
    invalidTime = '-----';
    numIterations = 1;
    offset = {};
    lat = void 0;
    lng = void 0;
    elv = void 0;
    timeZone = void 0;
    jDate = void 0;
    defParams = defaultParams;
    for (i in methods) {
      params = methods[i].params;
      for (j in defParams) {
        if (typeof params[j] === 'undefined') {
          params[j] = defParams[j];
        }
      }
    }
    calcMethod = methods[method] ? method : calcMethod;
    params = methods[calcMethod].params;
    for (id in params) {
      setting[id] = params[id];
    }
    for (i in timeNames) {
      offset[i] = 0;
    }
    return {
      setMethod: function(method) {
        if (methods[method]) {
          this.adjust(methods[method].params);
          calcMethod = method;
        }
      },
      adjust: function(params) {
        var id;
        for (id in params) {
          setting[id] = params[id];
        }
      },
      tune: function(timeOffsets) {
        var i;
        for (i in timeOffsets) {
          offset[i] = timeOffsets[i];
        }
      },
      getMethod: function() {
        return calcMethod;
      },
      getSetting: function() {
        return setting;
      },
      getOffsets: function() {
        return offset;
      },
      getDefaults: function() {
        return methods;
      },
      getTimes: function(date, coords, timezone, dst, format) {
        lat = 1 * coords[0];
        lng = 1 * coords[1];
        elv = coords[2] ? 1 * coords[2] : 0;
        timeFormat = format || timeFormat;
        if (date.constructor === Date) {
          date = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
        }
        if (typeof timezone === 'undefined' || timezone === 'auto') {
          timezone = this.getTimeZone(date);
        }
        if (typeof dst === 'undefined' || dst === 'auto') {
          dst = this.getDst(date);
        }
        timeZone = 1 * timezone + (1 * dst ? 1 : 0);
        jDate = this.julian(date[0], date[1], date[2]) - (lng / (15 * 24));
        return this.computeTimes();
      },
      getFormattedTime: function(time, format, suffixes) {
        var hour, hours, minutes, suffix;
        if (isNaN(time)) {
          return invalidTime;
        }
        if (format === 'Float') {
          return time;
        }
        suffixes = suffixes || timeSuffixes;
        time = DMath.fixHour(time + 0.5 / 60);
        hours = Math.floor(time);
        minutes = Math.floor((time - hours) * 60);
        suffix = format === '12h' ? suffixes[hours < 12 ? 0 : 1] : '';
        hour = format === '24h' ? this.twoDigitsFormat(hours) : (hours + 12 - 1) % 12 + 1;
        return hour + ':' + this.twoDigitsFormat(minutes) + (suffix ? ' ' + suffix : '');
      },
      midDay: function(time) {
        var eqt, noon;
        eqt = this.sunPosition(jDate + time).equation;
        noon = DMath.fixHour(12 - eqt);
        return noon;
      },
      sunAngleTime: function(angle, time, direction) {
        var decl, noon, t;
        decl = this.sunPosition(jDate + time).declination;
        noon = this.midDay(time);
        t = 1 / 15 * DMath.arccos((-DMath.sin(angle) - (DMath.sin(decl) * DMath.sin(lat))) / (DMath.cos(decl) * DMath.cos(lat)));
        return noon + (direction === 'ccw' ? -t : t);
      },
      asrTime: function(factor, time) {
        var angle, decl;
        decl = this.sunPosition(jDate + time).declination;
        angle = -DMath.arccot(factor + DMath.tan(Math.abs(lat - decl)));
        return this.sunAngleTime(angle, time);
      },
      sunPosition: function(jd) {
        var D, L, R, RA, decl, e, eqt, g, q;
        D = jd - 2451545.0;
        g = DMath.fixAngle(357.529 + 0.98560028 * D);
        q = DMath.fixAngle(280.459 + 0.98564736 * D);
        L = DMath.fixAngle(q + 1.915 * DMath.sin(g) + 0.020 * DMath.sin(2 * g));
        R = 1.00014 - (0.01671 * DMath.cos(g)) - (0.00014 * DMath.cos(2 * g));
        e = 23.439 - (0.00000036 * D);
        RA = DMath.arctan2(DMath.cos(e) * DMath.sin(L), DMath.cos(L)) / 15;
        eqt = q / 15 - DMath.fixHour(RA);
        decl = DMath.arcsin(DMath.sin(e) * DMath.sin(L));
        return {
          declination: decl,
          equation: eqt
        };
      },
      julian: function(year, month, day) {
        var A, B, JD;
        if (month <= 2) {
          year -= 1;
          month += 12;
        }
        A = Math.floor(year / 100);
        B = 2 - A + Math.floor(A / 4);
        JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
        return JD;
      },
      computePrayerTimes: function(times) {
        var params;
        var asr, dhuhr, fajr, imsak, isha, maghrib, sunrise, sunset;
        times = this.dayPortion(times);
        params = setting;
        imsak = this.sunAngleTime(this["eval"](params.imsak), times.imsak, 'ccw');
        fajr = this.sunAngleTime(this["eval"](params.fajr), times.fajr, 'ccw');
        sunrise = this.sunAngleTime(this.riseSetAngle(), times.sunrise, 'ccw');
        dhuhr = this.midDay(times.dhuhr);
        asr = this.asrTime(this.asrFactor(params.asr), times.asr);
        sunset = this.sunAngleTime(this.riseSetAngle(), times.sunset);
        maghrib = this.sunAngleTime(this["eval"](params.maghrib), times.maghrib);
        isha = this.sunAngleTime(this["eval"](params.isha), times.isha);
        return {
          imsak: imsak,
          fajr: fajr,
          sunrise: sunrise,
          dhuhr: dhuhr,
          asr: asr,
          sunset: sunset,
          maghrib: maghrib,
          isha: isha
        };
      },
      computeTimes: function() {
        var i;
        var times;
        times = {
          imsak: 5,
          fajr: 5,
          sunrise: 6,
          dhuhr: 12,
          asr: 13,
          sunset: 18,
          maghrib: 18,
          isha: 18
        };
        i = 1;
        while (i <= numIterations) {
          times = this.computePrayerTimes(times);
          i++;
        }
        times = this.adjustTimes(times);
        times.midnight = setting.midnight === 'Jafari' ? times.sunset + this.timeDiff(times.sunset, times.fajr) / 2 : times.sunset + this.timeDiff(times.sunset, times.sunrise) / 2;
        times = this.tuneTimes(times);
        return this.modifyFormats(times);
      },
      adjustTimes: function(times) {
        var i;
        var params;
        params = setting;
        for (i in times) {
          times[i] += timeZone - (lng / 15);
        }
        if (params.highLats !== 'None') {
          times = this.adjustHighLats(times);
        }
        if (this.isMin(params.imsak)) {
          times.imsak = times.fajr - (this["eval"](params.imsak) / 60);
        }
        if (this.isMin(params.maghrib)) {
          times.maghrib = times.sunset + this["eval"](params.maghrib) / 60;
        }
        if (this.isMin(params.isha)) {
          times.isha = times.maghrib + this["eval"](params.isha) / 60;
        }
        times.dhuhr += this["eval"](params.dhuhr) / 60;
        return times;
      },
      asrFactor: function(asrParam) {
        var factor;
        factor = {
          Standard: 1,
          Hanafi: 2
        }[asrParam];
        return factor || this["eval"](asrParam);
      },
      riseSetAngle: function() {
        var angle;
        angle = 0.0347 * Math.sqrt(elv);
        return 0.833 + angle;
      },
      tuneTimes: function(times) {
        var i;
        for (i in times) {
          times[i] += offset[i] / 60;
        }
        return times;
      },
      modifyFormats: function(times) {
        var i;
        for (i in times) {
          times[i] = this.getFormattedTime(times[i], timeFormat);
        }
        return times;
      },
      adjustHighLats: function(times) {
        var params;
        var nightTime;
        params = setting;
        nightTime = this.timeDiff(times.sunset, times.sunrise);
        times.imsak = this.adjustHLTime(times.imsak, times.sunrise, this["eval"](params.imsak), nightTime, 'ccw');
        times.fajr = this.adjustHLTime(times.fajr, times.sunrise, this["eval"](params.fajr), nightTime, 'ccw');
        times.isha = this.adjustHLTime(times.isha, times.sunset, this["eval"](params.isha), nightTime);
        times.maghrib = this.adjustHLTime(times.maghrib, times.sunset, this["eval"](params.maghrib), nightTime);
        return times;
      },
      adjustHLTime: function(time, base, angle, night, direction) {
        var portion, timeDiff;
        portion = this.nightPortion(angle, night);
        timeDiff = direction === 'ccw' ? this.timeDiff(time, base) : this.timeDiff(base, time);
        if (isNaN(time) || timeDiff > portion) {
          time = base + (direction === 'ccw' ? -portion : portion);
        }
        return time;
      },
      nightPortion: function(angle, night) {
        var method;
        var portion;
        method = setting.highLats;
        portion = 1 / 2;
        if (method === 'AngleBased') {
          portion = 1 / 60 * angle;
        }
        if (method === 'OneSeventh') {
          portion = 1 / 7;
        }
        return portion * night;
      },
      dayPortion: function(times) {
        var i;
        for (i in times) {
          times[i] /= 24;
        }
        return times;
      },
      getTimeZone: function(date) {
        var t1, t2, year;
        year = date[0];
        t1 = this.gmtOffset([year, 0, 1]);
        t2 = this.gmtOffset([year, 6, 1]);
        return Math.min(t1, t2);
      },
      getDst: function(date) {
        return 1 * (this.gmtOffset(date) !== this.getTimeZone(date));
      },
      gmtOffset: function(date) {
        var GMTDate, GMTString, hoursDiff, localDate;
        localDate = new Date(date[0], date[1] - 1, date[2], 12, 0, 0, 0);
        GMTString = localDate.toGMTString();
        GMTDate = new Date(GMTString.substring(0, GMTString.lastIndexOf(' ') - 1));
        hoursDiff = (localDate - GMTDate) / (1000 * 60 * 60);
        return hoursDiff;
      },
      "eval": function(str) {
        return 1 * (str + '').split(/[^0-9.+-]/)[0];
      },
      isMin: function(arg) {
        return (arg + '').indexOf('min') !== -1;
      },
      timeDiff: function(time1, time2) {
        return DMath.fixHour(time2 - time1);
      },
      twoDigitsFormat: function(num) {
        if (num < 10) {
          return '0' + num;
        } else {
          return num;
        }
      }
    };
  };

}).call(this);
