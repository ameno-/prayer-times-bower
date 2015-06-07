#---------------------- Degree-Based Math Class -----------------------
DMath = 
  dtr: (d) ->
    d * Math.PI / 180.0
  rtd: (r) ->
    r * 180.0 / Math.PI
  sin: (d) ->
    Math.sin @dtr(d)
  cos: (d) ->
    Math.cos @dtr(d)
  tan: (d) ->
    Math.tan @dtr(d)
  arcsin: (d) ->
    @rtd Math.asin(d)
  arccos: (d) ->
    @rtd Math.acos(d)
  arctan: (d) ->
    @rtd Math.atan(d)
  arccot: (x) ->
    @rtd Math.atan(1 / x)
  arctan2: (y, x) ->
    @rtd Math.atan2(y, x)
  fixAngle: (a) ->
    @fix a, 360
  fixHour: (a) ->
    @fix a, 24
  fix: (a, b) ->
    a = a - (b * Math.floor(a / b))
    if a < 0 then a + b else a
#---------------------- Init Object -----------------------
prayTimes = new PrayTimes
#--------------------- Copyright Block ----------------------

### 

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

###

#--------------------- Help and Manual ----------------------

###

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

###

#----------------------- PrayTimes Class ------------------------

PrayTimes = (method) ->
  `var i`
  `var params`
  #------------------------ Constants --------------------------
  timeNames = 
    imsak: 'Imsak'
    fajr: 'Fajr'
    sunrise: 'Sunrise'
    dhuhr: 'Dhuhr'
    asr: 'Asr'
    sunset: 'Sunset'
    maghrib: 'Maghrib'
    isha: 'Isha'
    midnight: 'Midnight'
  methods = 
    MWL:
      name: 'Muslim World League'
      params:
        fajr: 18
        isha: 17
    ISNA:
      name: 'Islamic Society of North America (ISNA)'
      params:
        fajr: 15
        isha: 15
    Egypt:
      name: 'Egyptian General Authority of Survey'
      params:
        fajr: 19.5
        isha: 17.5
    Makkah:
      name: 'Umm Al-Qura University, Makkah'
      params:
        fajr: 18.5
        isha: '90 min'
    Karachi:
      name: 'University of Islamic Sciences, Karachi'
      params:
        fajr: 18
        isha: 18
    Tehran:
      name: 'Institute of Geophysics, University of Tehran'
      params:
        fajr: 17.7
        isha: 14
        maghrib: 4.5
        midnight: 'Jafari'
    Jafari:
      name: 'Shia Ithna-Ashari, Leva Institute, Qum'
      params:
        fajr: 16
        isha: 14
        maghrib: 4
        midnight: 'Jafari'
  defaultParams = 
    maghrib: '0 min'
    midnight: 'Standard'
  calcMethod = 'MWL'
  setting = 
    imsak: '10 min'
    dhuhr: '0 min'
    asr: 'Standard'
    highLats: 'NightMiddle'
  timeFormat = '24h'
  timeSuffixes = [
    'am'
    'pm'
  ]
  invalidTime = '-----'
  numIterations = 1
  offset = {}
  lat = undefined
  lng = undefined
  elv = undefined
  timeZone = undefined
  jDate = undefined
  # time variables
  #---------------------- Initialization -----------------------
  # set methods defaults
  defParams = defaultParams
  for i of methods
    params = methods[i].params
    for j of defParams
      if typeof params[j] == 'undefined'
        params[j] = defParams[j]
  # initialize settings
  calcMethod = if methods[method] then method else calcMethod
  params = methods[calcMethod].params
  for id of params
    setting[id] = params[id]
  # init time offsets
  for i of timeNames
    offset[i] = 0
  #----------------------- Public Functions ------------------------
  {
    setMethod: (method) ->
      if methods[method]
        @adjust methods[method].params
        calcMethod = method
      return
    adjust: (params) ->
      `var id`
      for id of params
        setting[id] = params[id]
      return
    tune: (timeOffsets) ->
      `var i`
      for i of timeOffsets
        offset[i] = timeOffsets[i]
      return
    getMethod: ->
      calcMethod
    getSetting: ->
      setting
    getOffsets: ->
      offset
    getDefaults: ->
      methods
    getTimes: (date, coords, timezone, dst, format) ->
      lat = 1 * coords[0]
      lng = 1 * coords[1]
      elv = if coords[2] then 1 * coords[2] else 0
      timeFormat = format or timeFormat
      if date.constructor == Date
        date = [
          date.getFullYear()
          date.getMonth() + 1
          date.getDate()
        ]
      if typeof timezone == 'undefined' or timezone == 'auto'
        timezone = @getTimeZone(date)
      if typeof dst == 'undefined' or dst == 'auto'
        dst = @getDst(date)
      timeZone = 1 * timezone + (if 1 * dst then 1 else 0)
      jDate = @julian(date[0], date[1], date[2]) - (lng / (15 * 24))
      @computeTimes()
    getFormattedTime: (time, format, suffixes) ->
      if isNaN(time)
        return invalidTime
      if format == 'Float'
        return time
      suffixes = suffixes or timeSuffixes
      time = DMath.fixHour(time + 0.5 / 60)
      # add 0.5 minutes to round
      hours = Math.floor(time)
      minutes = Math.floor((time - hours) * 60)
      suffix = if format == '12h' then suffixes[if hours < 12 then 0 else 1] else ''
      hour = if format == '24h' then @twoDigitsFormat(hours) else (hours + 12 - 1) % 12 + 1
      hour + ':' + @twoDigitsFormat(minutes) + (if suffix then ' ' + suffix else '')
    midDay: (time) ->
      eqt = @sunPosition(jDate + time).equation
      noon = DMath.fixHour(12 - eqt)
      noon
    sunAngleTime: (angle, time, direction) ->
      decl = @sunPosition(jDate + time).declination
      noon = @midDay(time)
      t = 1 / 15 * DMath.arccos((-DMath.sin(angle) - (DMath.sin(decl) * DMath.sin(lat))) / (DMath.cos(decl) * DMath.cos(lat)))
      noon + (if direction == 'ccw' then -t else t)
    asrTime: (factor, time) ->
      decl = @sunPosition(jDate + time).declination
      angle = -DMath.arccot(factor + DMath.tan(Math.abs(lat - decl)))
      @sunAngleTime angle, time
    sunPosition: (jd) ->
      D = jd - 2451545.0
      g = DMath.fixAngle(357.529 + 0.98560028 * D)
      q = DMath.fixAngle(280.459 + 0.98564736 * D)
      L = DMath.fixAngle(q + 1.915 * DMath.sin(g) + 0.020 * DMath.sin(2 * g))
      R = 1.00014 - (0.01671 * DMath.cos(g)) - (0.00014 * DMath.cos(2 * g))
      e = 23.439 - (0.00000036 * D)
      RA = DMath.arctan2(DMath.cos(e) * DMath.sin(L), DMath.cos(L)) / 15
      eqt = q / 15 - DMath.fixHour(RA)
      decl = DMath.arcsin(DMath.sin(e) * DMath.sin(L))
      {
        declination: decl
        equation: eqt
      }
    julian: (year, month, day) ->
      if month <= 2
        year -= 1
        month += 12
      A = Math.floor(year / 100)
      B = 2 - A + Math.floor(A / 4)
      JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5
      JD
    computePrayerTimes: (times) ->
      `var params`
      times = @dayPortion(times)
      params = setting
      imsak = @sunAngleTime(@eval(params.imsak), times.imsak, 'ccw')
      fajr = @sunAngleTime(@eval(params.fajr), times.fajr, 'ccw')
      sunrise = @sunAngleTime(@riseSetAngle(), times.sunrise, 'ccw')
      dhuhr = @midDay(times.dhuhr)
      asr = @asrTime(@asrFactor(params.asr), times.asr)
      sunset = @sunAngleTime(@riseSetAngle(), times.sunset)
      maghrib = @sunAngleTime(@eval(params.maghrib), times.maghrib)
      isha = @sunAngleTime(@eval(params.isha), times.isha)
      {
        imsak: imsak
        fajr: fajr
        sunrise: sunrise
        dhuhr: dhuhr
        asr: asr
        sunset: sunset
        maghrib: maghrib
        isha: isha
      }
    computeTimes: ->
      `var i`
      # default times
      times = 
        imsak: 5
        fajr: 5
        sunrise: 6
        dhuhr: 12
        asr: 13
        sunset: 18
        maghrib: 18
        isha: 18
      # main iterations
      i = 1
      while i <= numIterations
        times = @computePrayerTimes(times)
        i++
      times = @adjustTimes(times)
      # add midnight time
      times.midnight = if setting.midnight == 'Jafari' then times.sunset + @timeDiff(times.sunset, times.fajr) / 2 else times.sunset + @timeDiff(times.sunset, times.sunrise) / 2
      times = @tuneTimes(times)
      @modifyFormats times
    adjustTimes: (times) ->
      `var i`
      `var params`
      params = setting
      for i of times
        times[i] += timeZone - (lng / 15)
      if params.highLats != 'None'
        times = @adjustHighLats(times)
      if @isMin(params.imsak)
        times.imsak = times.fajr - (@eval(params.imsak) / 60)
      if @isMin(params.maghrib)
        times.maghrib = times.sunset + @eval(params.maghrib) / 60
      if @isMin(params.isha)
        times.isha = times.maghrib + @eval(params.isha) / 60
      times.dhuhr += @eval(params.dhuhr) / 60
      times
    asrFactor: (asrParam) ->
      factor = {
        Standard: 1
        Hanafi: 2
      }[asrParam]
      factor or @eval(asrParam)
    riseSetAngle: ->
      #var earthRad = 6371009; // in meters
      #var angle = DMath.arccos(earthRad/(earthRad+ elv));
      angle = 0.0347 * Math.sqrt(elv)
      # an approximation
      0.833 + angle
    tuneTimes: (times) ->
      `var i`
      for i of times
        times[i] += offset[i] / 60
      times
    modifyFormats: (times) ->
      `var i`
      for i of times
        times[i] = @getFormattedTime(times[i], timeFormat)
      times
    adjustHighLats: (times) ->
      `var params`
      params = setting
      nightTime = @timeDiff(times.sunset, times.sunrise)
      times.imsak = @adjustHLTime(times.imsak, times.sunrise, @eval(params.imsak), nightTime, 'ccw')
      times.fajr = @adjustHLTime(times.fajr, times.sunrise, @eval(params.fajr), nightTime, 'ccw')
      times.isha = @adjustHLTime(times.isha, times.sunset, @eval(params.isha), nightTime)
      times.maghrib = @adjustHLTime(times.maghrib, times.sunset, @eval(params.maghrib), nightTime)
      times
    adjustHLTime: (time, base, angle, night, direction) ->
      portion = @nightPortion(angle, night)
      timeDiff = if direction == 'ccw' then @timeDiff(time, base) else @timeDiff(base, time)
      if isNaN(time) or timeDiff > portion
        time = base + (if direction == 'ccw' then -portion else portion)
      time
    nightPortion: (angle, night) ->
      `var method`
      method = setting.highLats
      portion = 1 / 2
      # MidNight
      if method == 'AngleBased'
        portion = 1 / 60 * angle
      if method == 'OneSeventh'
        portion = 1 / 7
      portion * night
    dayPortion: (times) ->
      `var i`
      for i of times
        times[i] /= 24
      times
    getTimeZone: (date) ->
      year = date[0]
      t1 = @gmtOffset([
        year
        0
        1
      ])
      t2 = @gmtOffset([
        year
        6
        1
      ])
      Math.min t1, t2
    getDst: (date) ->
      1 * (@gmtOffset(date) != @getTimeZone(date))
    gmtOffset: (date) ->
      localDate = new Date(date[0], date[1] - 1, date[2], 12, 0, 0, 0)
      GMTString = localDate.toGMTString()
      GMTDate = new Date(GMTString.substring(0, GMTString.lastIndexOf(' ') - 1))
      hoursDiff = (localDate - GMTDate) / (1000 * 60 * 60)
      hoursDiff
    eval: (str) ->
      1 * (str + '').split(/[^0-9.+-]/)[0]
    isMin: (arg) ->
      (arg + '').indexOf('min') != -1
    timeDiff: (time1, time2) ->
      DMath.fixHour time2 - time1
    twoDigitsFormat: (num) ->
      if num < 10 then '0' + num else num

  }

# ---
# generated by js2coffee 2.0.4