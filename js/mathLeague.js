// mathLeague.js

"use strict";

// global functions:
var prn;
var val;
var echo;
var sub;

var ml = function () {

  var gIsBlank = false;
  var gShowSolutions = false;
  var gDefaultBlankLength = 4
  var gBlankLength = gDefaultBlankLength;

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

          // handle _ decorator:
          if (functxt[0] =='_') {
            gIsBlank = true;
            functxt = functxt.substring(1);
          }

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
    var top = elem.getAttribute("top");
    var bottom = elem.getAttribute("bottom");

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
      if (top == 'exponents' || top == 'both' || gShowSolutions)
        var expStr = '\\(' + base + '^' + exp + '\\) <br>'

      // top part: place value
      var valStr = '&nbsp;';
      if (top == 'values' || top == 'both' || gShowSolutions)
        var valStr = val;

      topRowTxt += '<td>' + expStr + valStr + '</td>';

      // bottom part: digit
      var digitStr = '&nbsp;<br>';
      if (bottom == 'digits' || bottom == 'products' || bottom == 'answer' || gShowSolutions)
        digitStr = digit + '<br>';

      // bottom part: product
      var productStr = '&nbsp;<br>';
      if (bottom == 'products' || bottom == 'answer' || gShowSolutions)
        productStr = '\\( ' + digit + ' \\times ' + val + ' = ' + prod + '\\)'

      bottomRowTxt += '<td>' + digitStr + productStr + '</td>';

      // answer part:
      var answerStr = '';
      if (bottom == 'answer' || gShowSolutions) {
        var plusSign = (i==0)? '' : '+';
        answer += '<td class="no-line"> \\(' + plusSign + prod + '\\) </td>'
      }
    }

    if (answer != '')
      answer = '<tr>' + answer + '<td class="no-line"> \\(= ' + sum + '\\) </td>' + '</tr>';
    else
      answer = '<tr> <td class="no-line"> &nbsp; </td> </tr>';

    var html = '<tr>' + topRowTxt + '</tr><tr>' + bottomRowTxt + '</tr>' + answer;

    elem.innerHTML = html;
  }


  // Parse a number in some base into a dictionary that describes what is going on.
  // 17
  // '17'
  // '14_5'
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
    else if (typeof num == 'string') {
      var parts = num.split('_');
      if (parts.length == 1) {
        out.digits = num;
        out.base = 10;
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
  // return a blank space with an optional base subscript
  // or return "" if the space should not be blank (ie, should have the answer)
  var createBlankText = function(base) {
    if (!gIsBlank || gShowSolutions)
      return "";

    var baseTxt = base ? '_{(' + base + ')} ': ' ';
    var blankTxt = '_'.repeat(gBlankLength);

    return ' \\text{' + blankTxt + '}' + baseTxt;
  }


  // print a number in mathjax format
  var printNumInBase = function(num, base) {
    var blank = createBlankText(base);
    if (blank)
      return blank;

    var obj = parseBaseNum(num);
    if (typeof base == 'undefined')
      return String(obj.value);
    else
      return valuetoBase(obj.value, base) + '_{(' + base + ')}';
  }

  var printString = function(str) {
    var blank = createBlankText();
    if (blank)
      return blank;

    return str;
  }

  var printWithSubstitution = function(str, n) {
    var blank = createBlankText();
    if (blank)
      return blank;

    return str.replace('$', n);
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
  val = valueofNum;

  return { init:init }
}()


