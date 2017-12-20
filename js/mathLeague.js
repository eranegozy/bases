// mathLeague.js

"use strict";

// global functions:
var prn;
var val;
var echo;
var sub;
var longadd;
var longsub;

var ml = function () {

  var gNumberAlphas = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'];

  var gIsBlank = false;
  var gShowSolutions = false;
  var gDefaultBlankLength = 4;
  var gBlankLength = gDefaultBlankLength;
  var gBaseFormat = 'normal'; // 'normal', 'simple', 'alpha'

  var init = function() {

    // testModule();
    updateContent();

    window.onload = function() {
      document.addEventListener("click", function() {
        gShowSolutions = ! gShowSolutions;
        updateContent();
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
      });
    }

  }

  var processClass = function(name, func) {
    var els = document.getElementsByClassName(name);
    for (var i = 0; i < els.length; i++)
      func(els[i]);
  }

  var updateContent = function() {
    processClass('student-info', setupStudentInfo);
    processClass('solution', processSolution);
    processClass('expression', processExpression);
    processClass('base-chart', processBaseChart);
    processClass('grids', processGrids);
    processClass('calendar', processCalendar);
  }

  var setupStudentInfo = function(elem) {
    if (gShowSolutions)
      elem.innerHTML = "<h1>SOLUTIONS</h1>";
    else
      elem.innerHTML = 
      `<tr>
         <td>____________________________________________<br>Last Name, First Name</td>
         <td>_____________________<br>Grade</td>
         <td>_____________________<br>School</td>
       </tr>`;
  }

  var processSolution = function(elem) {
    var data = elem.getAttribute("data");
    console.log(data);
    var result = eval(data);

    elem.innerHTML = "\\(" + result + "\\)";
  }

  var processExpression = function(elem) {
    var len = elem.getAttribute("len") || 1;
    var hints = JSON.parse( elem.getAttribute("hints") ) || [];
    var txt = elem.getAttribute("exp");
    var vars = elem.getAttribute("vars") || '';
    gBlankLength = elem.getAttribute("blank") || gDefaultBlankLength;
    gBaseFormat = elem.getAttribute("baseFormat") || "normal";

    var output = '';
    for (var n = 0; n < len; n++) {
      // check for hints - meaning show solutions all the time.
      var oldShowSolutions = gShowSolutions;
      gShowSolutions = (hints.includes(n) || gShowSolutions);

      var vars2 = vars + "; n=" + n + "; ";
      var html = renderExpression(txt, vars2);
      gShowSolutions = oldShowSolutions;

      output += html;

      if (n < len - 1)
        output += ', ';
    }
    elem.innerHTML = output;

    // restore globals to default values
    gBlankLength = gDefaultBlankLength;
    gBaseFormat = "normal";
  }


  var tokenizeExpression = function(txt) {
    var re = /(\w+)|(\()|(\))|[^\(\)\w]+/g;
    
    var out = [];
    var match;
    while ((match = re.exec(txt)) != null) {
      // find token and type:
      var token = match[0];
      var type;
      if (match[1] != undefined)
        type = 'name';
      else if (match[2] != undefined)
        type = 'left';
      else if (match[3] != undefined)
        type = 'right';
      else
        type = 'other';

      out.push( [type, token] );
    }
    // console.log(out);
    return out;
  }

  // tokenize and process txt, handling funtions inside txt.
  // evaluate found functions with vars as context for the function.
  var renderExpression = function(txt, vars) {
    var tokens = tokenizeExpression(txt);

    var inFunction = false;
    var parenCount = 0;
    var newtxt = '';
    var functxt = '';

    for (var i = 0; i < tokens.length; i++) {

      var type = tokens[i][0];
      var token = tokens[i][1];

      if (i+1 < tokens.length) {
        var nextType  = tokens[i+1][0];
        var nextToken = tokens[i+1][1];
      }
      else {
        var nextType  = null;
        var nextToken = null;
      }

      // start a function?
      if (type == 'name' && nextType == 'left' && inFunction == false) {
        inFunction = true;
        functxt += token;
      }
      // inside a function?
      else if (inFunction) {
        functxt += token;

        if (type == 'left')
          parenCount += 1;
        if (type == 'right')
          parenCount -= 1;

        // end of function?
        if (parenCount == 0) {
          inFunction = false;

          // handle _ decorator - used for inserting a blank or the solution
          if (functxt[0] =='_') {
            gIsBlank = true;
            functxt = functxt.substring(1);
          }

          // construct environment to evaluate function:
          // setup variables and return value.
          var ftxt = vars + " return " + functxt;
          try { 
            var result = new Function(ftxt)(); 
          }
          catch(err) {
            console.log("Error in funciton", ftxt);
            console.log(err);
          }
          gIsBlank = false;

          newtxt += result;
          functxt = '';
        }
      }
      // non-function token
      else {
        newtxt += token;
      }
    }
    var html = '\\( ' + newtxt + ' \\)';
    return html;
  }


  // creates a baseX to base-10 solving chart.
  // configured with these attributes:
  // num: digits_B - the number in some base format
  // top: exponents | values | both | none
  // bottom: none | digits | products | answer
  // 
  var processBaseChart = function(elem) {
    var num = elem.getAttribute("num");
    var top = elem.getAttribute("top") || '';
    var bottom = elem.getAttribute("bottom") || '';
    var demo = elem.getAttribute("demo")? true : false;

    var obj = parseBaseNum(num);
    var len = obj.digits.length;
    var base = obj.base;
    var digits = obj.digits;

    var topRowTxt = '';
    var bottomRowTxt = '';
    var answer = '';
    var sum = 0;

    for (var i = 0; i < len; i++) {
      var exp = len - i - 1;
      var val = base ** exp;
      var digit = digits[i];
      var prod = Number(digit) * val;
      sum += prod;

      // top part: exponent
      var expStr = '&nbsp;<br>';
      if (top == 'exponents' || top == 'both' || (gShowSolutions && !demo))
        var expStr = '\\(' + base + '^' + exp + '\\) <br>'

      // top part: place value
      var valStr = '&nbsp;';
      if (top == 'values' || top == 'both' || (gShowSolutions && !demo))
        var valStr = val;

      topRowTxt += '<td>' + expStr + valStr + '</td>';

      // bottom part: digit
      var digitStr = '&nbsp;<br>';
      if (bottom.includes('d') || bottom.includes(exp) || (gShowSolutions && !demo))
        digitStr = digit + '<br>';

      // bottom part: product
      var productStr = '&nbsp;<br>';
      if (bottom.includes('p') || bottom.includes(exp) || (gShowSolutions && !demo))
        productStr = '\\( ' + digit + ' \\times ' + val + ' = ' + prod + '\\)';

      bottomRowTxt += '<td>' + digitStr + productStr + '</td>';

      // answer part:
      var answerStr = '';
      if (bottom.includes('s') || (gShowSolutions && !demo)) {
        var plusSign = (i==0)? '' : '+';
        answer += '<td class="no-line"> \\(' + plusSign + prod + '\\) </td>';
      }
    }

    if (answer != '')
      answer = '<tr>' + answer + '<td class="no-line"> \\(= ' + sum + '\\) </td>' + '</tr>';
    else
      answer = '<tr> <td class="no-line"> &nbsp; </td> </tr>';

    var html = '<tr>' + topRowTxt + '</tr><tr>' + bottomRowTxt + '</tr>' + answer;

    elem.innerHTML = html;
  }

  var processGrids = function(elem) {
    var num = elem.getAttribute("num");
    var hide = elem.getAttribute("hide") || false;

    var obj = parseBaseNum(num);
    var len = obj.digits.length;
    var base = obj.base;
    var digits = obj.digits;

    var html = ''
    for (var d = 0; d < len; d++) {
      var cnt = Number(digits[d]);
      for (var c = 0; c < cnt; c++) {
        var ny = (len-d) > 1 ? base : 1;
        var nx = (len-d) > 2 ? base : 1;
        html += createGrid(nx, ny);
      }
    }

    elem.innerHTML = html;
    if (hide && !gShowSolutions) {
      elem.setAttribute('style', 'visibility:hidden');
    }
    else {
      elem.setAttribute('style', 'visibility:visible');
    }
  }

  var createGrid = function(nx, ny) {
    var txt = '<table class="grid">\n';
    for (var y = 0; y < ny; y++) {
      txt += '<tr>';
      for (var x = 0; x < nx; x++) {
        txt += '<td>&nbsp;</td>';
      }
      txt += '</tr>\n';
    }
    txt += '</table>\n';
    return txt;
  }


  // create a "Base-ic Calendar"
  var processCalendar = function(elem) {
    var bases = elem.getAttribute("bases").split(" ");
    var html = '';

    // create days of the week
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Satuardy'];
    html += '<tr>';
    for (var i = 0; i < days.length; i++) {
      html += '<td class="cal-day">' + days[i] + '</td>';
    }

    // create date boxes
    html += '</tr>\n<tr>';
    for (var i = 0; i < bases.length; i++) {
      var value = i + 1;
      var base = Number(bases[i]);
      var digits = valuetoBase(value, base);
      var answer = gShowSolutions ? base : '_____';

      if (i % 7 == 0 && i != 0)
        html += '</tr>\n<tr>';

      html += '<td class="cal-box">'
      html += '<p class="cal-value">' + value + '</p>'
      html += '<p class="cal-digits">' + digits + '</p>'
      html += '<p class="cal-base">Base ' + answer + '</p>'
      html += "</td>"
    };
    html += "</tr>"

    elem.innerHTML = html;
  }

  // Parse a number in some base into a dictionary that describes what is going on.
  // 17
  // '17'
  // '14_5'
  // '19:5'  19_10 converted to base 5
  // returns:
  // { 'digits': "digits", base: base, value: num } 
  // where base is a number and value is the base10 numberic value
  var parseBaseNum = function(num) {
    var out = {};

    // handle num argument
    if (typeof num == 'number') {
      out.digits = String(num);
      out.base = 10;
    }
    // string with _  like '15_7'
    else if (typeof num == 'string' && num.includes('_')) {
      var parts = num.split('_');
      out.digits = parts[0];
      out.base = Number(parts[1]);
    }
    // string with :  like '20:4'
    else if (typeof num == 'string' && num.includes(':')) {
      var parts = num.split(':');
      var value = Number(parts[0]);
      out.base = Number(parts[1]);
      out.digits = valuetoBase(value, out.base);
    }
    else if (typeof num == 'string') {
      out.digits = num;
      out.base = 10;
    }
    else {
      console.log('Error num', num, 'must be a number or string');
      return;      
    }

    out.value = base10Value(out.digits, out.base);    
    return out;
  }

  // convert digits in base base to base 10
  var base10Value = function(digits, base) {
    var val = 0;

    // TODO - handle errors in this conversion
    for (var i = 0; i < digits.length; i++) {
      var power = digits.length - i - 1;

      var d = digits.charCodeAt(i);
      if (48 <= d && d <= 57)
        d -= 48;
      else
        d -= 55;
      if (d >= base) {
        var txt = "Error converting " + digits + ',' + base + ". Illegal digit";
        console.log(txt);
        alert(txt);
      }
      val += (base ** power) * d
    }
    return val;
  }


  // convert a base10 value into a base.
  // return result as a string
  var valuetoBase = function(value, base) {
    var out = '';

    if (typeof value != 'number') {
      console.log("Error, value", value, "must be a number");
      return 'err';
    }
    if (typeof base != 'number') {
      console.log("Error, base", base, "must be a number");
      return 'err';
    }

    var num = value;
    var cnt = 0;
    while (true) {
      var rem = num % base;
      var num = Math.floor(num / base);

      if (rem > 9)
          rem = String.fromCharCode(55 + rem);

      out = String(rem) + out
      if (num == 0)
          break;

      cnt += 1;
      if (cnt > 30) {
        console.log("Problem with valuetoBase:", value, base)
        return;
      }
    }
    return out;
  }


  // based on global variables gIsBlank, gShowSolutions, and gBlankLength
  // return either the input txt value, or a blank that replaces it.
  var blankify = function(txt) {
    if (!gIsBlank || gShowSolutions)
      return txt;

    var blankTxt = '_'.repeat(gBlankLength);
    return ' \\text{' + blankTxt + '}';
  }


  // print a number in mathjax format
  var printNumInBase = function(num, base) {
    var obj = parseBaseNum(num);

    // no base means base 10, but do not add any subscript
    if (typeof base == 'undefined')
      return blankify( String(obj.value) );

    // figure out which style to use for the base subscript
    var basetxt;
    if (gBaseFormat == 'simple')
      basetxt = '_{' + base + '}';
    else if (gBaseFormat == 'alpha')
      basetxt = '_{' + gNumberAlphas[base] + '}';
    else
      basetxt = '_{(' + base + ')}';

    return blankify( valuetoBase(obj.value, base) ) + basetxt;
  }

  var printString = function(str) {
    return blankify(str);
  }

  var printWithSubstitution = function(str, n) {
    return blankify( str.replace('$', n) );
  }

  var printLongAddition = function(numbers, base, sign) {
    var txt = '';
    var sum = 0;

    for (var i = 0; i < numbers.length; i++) {
      var value = parseBaseNum(numbers[i]).value;

      if (i == 0 || sign == '+')
        sum += value;
      else if (i != 0 && sign == '-')
        sum -= value;

      if (i < numbers.length - 1)
        txt += printNumInBase(value, base) + ' \\\\ ';        
      else
        txt += '\\underline{' + sign + ' \\quad ' + printNumInBase(value, base) + '} \\\\ ';
    };

    if (gShowSolutions)
      txt += printNumInBase(sum, base) + ' ';
    else if (base)
      txt +=  '{}_{(' + base + ')} ';
    else 
      txt += '{}'
    
    txt = '\\begin{align} ' + txt + ' \\end{align}';
    return txt;
  }

  var valueOfNum = function(num) {
    var obj = parseBaseNum(num);
    return obj.value;
  }


  var testModule = function() {
    console.log( "parseBaseNum" );
    console.log( parseBaseNum(17) );
    console.log( parseBaseNum(13) );
    console.log( parseBaseNum('17') );
    console.log( parseBaseNum('14_5') );
    console.log( parseBaseNum('23') );
    console.log( parseBaseNum('23_6') );


    console.log( "valuetoBase" );
    console.log( valuetoBase(50, 4));
    console.log( valuetoBase(50, 10));
    console.log( valuetoBase('50', 4));
    console.log( valuetoBase(0, 4));
    console.log( valuetoBase(50, 0));
    console.log( valuetoBase(50));
  }

  // global functions
  prn = printNumInBase;
  echo = printString;
  sub = printWithSubstitution;
  longadd = function(numbers, base) { return printLongAddition(numbers, base, '+'); }
  longsub = function(numbers, base) { return printLongAddition(numbers, base, '-'); }
  val = valueOfNum;

  return { init:init }
}()


