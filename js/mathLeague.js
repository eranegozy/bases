// mathLeague.js

"use strict";

// global functions:
var prn;
var val;

var ml = function () {

  var gShowSolutions = false;

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
    processClass('series', processSeries);
    processClass('equals', processEquals);
    processClass('equation', processEquation);
    processClass('expression', processExpression);
    processClass('base-chart', processBaseChart);
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

  // convert data from "relaxed JSON string" into JSON
  var strToJSON = function(str) {
    if (str == undefined)
      return undefined;

    try {
      // this is to allow "relaxed JSON", where strings do not have to quoted.
      var fixedData = str.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
      var j = JSON.parse(fixedData);
      return j;
    }
    catch(err) {
      console.log("Error Parsing:", str);
      console.log(err);
    }
  }

  var attribsToDictionary = function(elem, attribs) {
    var out = {}
    for (var i = 0; i < attribs.length; i++) {
      var key = attribs[i];
      var item = elem.getAttribute(key);
      if (item != null)
        out[key] = item;
    };
    return out;
  }

  var evalExpression = function(exp) {
    if (exp == undefined || exp == '')
      return '';

    if (exp[0] == '!') {
      exp = exp.substring(1, exp.length)
      return Function("return " + exp)();
    }
    else
      return exp;
  }


  var processSeries = function(elem) {
    var j = strToJSON(elem.getAttribute("data"));
    if (j == undefined)
      return;

    // default values
    var hints = j.hints || []
    var blank = j.blank ? '_'.repeat(j.blank) : '____';
    var len = j.len || 1;
    var baseTxt = j.base ? '_{(' + j.base + ')} ': ' ';
    var txt = '';
    for (var n = 0; n < len; n++) {
      if (j.exp)
        var exp = j.exp.replace('n', n);
      if (j.ans)
        var ans = j.ans.replace('n', n);

      txt += '\\(' + evalExpression(exp);

      if (hints == 'all' || hints.includes(n) || gShowSolutions)
        txt += evalExpression(ans);
      else
        txt += ' \\text{' + blank + '}' + baseTxt;
      txt += '\\)';

      if (n < len - 1)
        txt += ', ';
    }
    
    elem.innerHTML = txt;
  }

  var processEquals = function(elem) {
    var j = strToJSON(elem.getAttribute("data"));
    if (j == undefined)
      return;
    
    var baseTxt = j.base ? '_{(' + j.base + ')} ': ' ';
    var blank = j.blank ? '_'.repeat(j.blank) : '____';

    var txt = '\\(' + evalExpression(j.exp) + ' = ';
    if (gShowSolutions)
      txt += evalExpression(j.ans);
    else
      txt += ' \\text{' + blank + '}' + baseTxt;
    txt += '\\)';
    elem.innerHTML = txt;
  }


  var processEquation = function(elem) {
    var j = attribsToDictionary(elem, ['exp', 'ans', 'base', 'blank']);

    var baseTxt = j.base ? '_{(' + j.base + ')} ': ' ';
    var blank = j.blank ? '_'.repeat(j.blank) : '____';

    var txt = '\\(' + evalExpression(j.exp) + ' = ';
    if (gShowSolutions)
      txt += evalExpression(j.ans);
    else
      txt += ' \\text{' + blank + '}' + baseTxt;
    txt += '\\)';
    elem.innerHTML = txt;
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
    return out;
  }

  var processExpression = function(elem) {
    var txt = elem.getAttribute("exp");
    var vars = elem.getAttribute("vars") || '';

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

          var ftxt = vars + " return " + functxt;
          try { 
            var result = new Function(ftxt)(); 
          }
          catch(err) {
            console.log("Error in funciton", ftxt);
            console.log(err);
          }

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
    console.log(html);
    elem.innerHTML = html;
  }

  // creates a baseX to base-10 solving chart.
  // configured by JSON with params:
  // num: "digits_B" - the number in some base format
  // top: "exponents" | "values" | "both" | "none"
  // bottom: "none" | "digits" | "products" | "answer"
  // 
  var processBaseChart = function(elem) {
    var j = strToJSON(elem.getAttribute("data"));
    if (j == undefined)
      return;

    var num = parseBaseNum(j.num);
    var len = num.digits.length;

    var top = '';
    var bottom = '';
    var answer = '';
    var sum = 0;

    for (var i = 0; i < len; i++) {
      var exp = len - i - 1;
      var val = num.base ** exp;
      var digit = num.digits[i];
      var prod = Number(digit) * val;
      sum += prod;

      // top part: exponent
      var exp_str = '&nbsp;<br>';
      if (j.top == 'exponents' || j.top == 'both' || gShowSolutions)
        var exp_str = '\\(' + num.base + '^' + exp + '\\) <br>'

      // top part: place value
      var val_str = '&nbsp;';
      if (j.top == 'values' || j.top == 'both' || gShowSolutions)
        var val_str = val;

      top += '<td>' + exp_str + val_str + '</td>';

      // bottom part: digit
      var digit_str = '&nbsp;<br>';
      if (j.bottom == 'digits' || j.bottom == 'products' || j.bottom == 'answer' || gShowSolutions)
        digit_str = digit + '<br>';

      // bottom part: product
      var product_str = '&nbsp;<br>';
      if (j.bottom == 'products' || j.bottom == 'answer' || gShowSolutions)
        product_str = '\\( ' + digit + ' \\times ' + val + ' = ' + prod + '\\)'

      bottom += '<td>' + digit_str + product_str + '</td>';

      // answer part:
      var answer_str = '';
      if (j.bottom == 'answer' || gShowSolutions) {
        var plus_sign = (i==0)? '' : '+';
        answer += '<td class="no-line"> \\(' + plus_sign + prod + '\\) </td>'
      }
    }

    if (answer != '')
      answer = '<tr>' + answer + '<td class="no-line"> \\(= ' + sum + '\\) </td>' + '</tr>';
    else
      answer = '<tr> <td class="no-line"> &nbsp; </td> </tr>';

    var html = '<tr>' + top + '</tr><tr>' + bottom + '</tr>' + answer;

    elem.innerHTML = html;
  }


  // Try to convert just about anything into a dictionary describing the number
  // options are (num, base)
  // (17)
  // (13, 4)  13 is converted to '13'
  // ('17')
  // ('14_5')
  // ('23', 4)
  // ('23', '4')
  // ('23_6', 4) error - two bases given
  // returns:
  // { 'digits': "digits", base: base, value: num } 
  // where base is a number and value is the base10 numberic value
  var parseBaseNum = function(num, base) {
    var out = {};

    // handle base argument
    if (typeof base == 'number') {
      out.base = base;
    }
    else if (typeof base == 'string') {
      out.base = Number(base);
    } 
    else if (typeof base == 'undefined') {
      out.base = 10;
    }
    else {
      console.log('Error base', base, 'must be a number or string or undefined');
      return;      
    }

    // handle num argument
    if (typeof num == 'number') {
      out.digits = String(num);
    }
    else if (typeof num == 'string') {
      var parts = num.split('_');
      if (parts.length == 1) {
        out.digits = num;
      }
      else if (parts.length >= 2) {
        out.digits = parts[0];
        out.base = Number(parts[1]);
      }
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


  var valueofNum = function(num, base) {
    var obj = parseBaseNum(num, base);
    return obj.value;    
  }

  // print a number in mathjax format
  var printNumInBase = function(num, base) {
    // console.log('printNumInBase', num, base);
    var obj = parseBaseNum(num);
    console.log(obj);

    if (typeof base == 'undefined')
      return String(obj.value);
    else
      return valuetoBase(obj.value, base) + '_{(' + base + ')}';
  }

  // convert a base10 number into base base.
  // return as string
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



  var testModule = function() {
    console.log( "parseBaseNum" );
    console.log( parseBaseNum(17) );
    console.log( parseBaseNum(13, 4) );
    console.log( parseBaseNum('17') );
    console.log( parseBaseNum('14_5') );
    console.log( parseBaseNum('23', 4) );
    console.log( parseBaseNum('23', '4') );
    console.log( parseBaseNum('23_6', 4) );
    console.log( parseBaseNum('23_6', '4') );
    console.log( parseBaseNum('23_6', 'hi') );


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
  val = valueofNum;

  return { init:init }
}()


