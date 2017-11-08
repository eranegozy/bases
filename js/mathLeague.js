// mathLeague.js

"use strict";

var ml = function () {

  var gShowSolutions = false;

  var init = function() {

    window.onload = function() {
      document.addEventListener("click", function() {
        gShowSolutions = ! gShowSolutions;
        console.log("Show Solutions:", gShowSolutions);
        updateContent();
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
      });
    }

    updateContent();
  }


  var processClass = function(name, func) {
    var els = document.getElementsByClassName(name);
    for (var i = 0; i < els.length; i++)
      func(els[i]);
  }


  var updateContent = function() {
    processClass('student-info', setupStudentInfo);
    processClass('solution', processSolution);
    processClass('base-chart', processBaseChart);
    processClass('series', processSeries);
    processClass('equals', processEquals);
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

  var processSeries = function(elem) {
    var data = elem.getAttribute("data");
    if (data == undefined)
      return;

    // this is to allow "relaxed JSON", where strings do not have to quoted.
    var fixedData = data.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');

    var j = JSON.parse(fixedData);
    var len = j.len;
    var ansFunc = Function("n", "return " + j.ans);

    var txt = "";
    for (var n = 0; n < len; n++) {
      var ans = ansFunc(n);
      if (j.exp) 
        txt += j.exp.replace('n', n);
      if (gShowSolutions)
        txt += String(ans);
      else
        txt += '_____';

      if (n < len - 1)
        txt += ', ';
    };
    elem.innerHTML = txt;
  }

  // creates a baseX to base-10 solving chart.
  // configured by JSON with params:
  // num: "digits_B" - the number in some base format
  // top: "exponents" | "values" | "both" | "none"
  // bottom: "none" | "digits" | "products" | "answer"
  // 
  var processBaseChart = function(elem) {
    var data = elem.getAttribute("data");
    console.log('base-chart', data);
    if (data == undefined)
      return;

    // this is to allow "relaxed JSON", where strings do not have to quoted.
    var fixedData = data.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');

    var j = JSON.parse(fixedData);
    console.log(j.base, j.len);

    var number = j.num.split('_');

    var digits = number[0];
    var len = digits.length;
    var base = Number(number[1]);

    var top = '';
    var bottom = '';
    var answer = '';
    var sum = 0;

    for (var i = 0; i < len; i++) {
      var exp = len - i - 1;
      var val = base ** exp;
      var digit = digits[i];
      var prod = Number(digit) * val;
      sum += prod;

      // top part: exponent
      var exp_str = '&nbsp;<br>';
      if (j.top == 'exponents' || j.top == 'both')
        var exp_str = '\\(' + base + '^' + exp + '\\) <br>'

      // top part: place value
      var val_str = '&nbsp;';
      if (j.top == 'values' || j.top == 'both')
        var val_str = val;

      top += '<td>' + exp_str + val_str + '</td>';

      // bottom part: digit
      var digit_str = '&nbsp;<br>';
      if (j.bottom == 'digits' || j.bottom == 'products' || j.bottom == 'answer')
        digit_str = digit + '<br>';

      // bottom part: product
      var product_str = '&nbsp;<br>';
      if (j.bottom == 'products' || j.bottom == 'answer')
        product_str = '\\( ' + digit + ' \\times ' + val + ' = ' + prod + '\\)'

      bottom += '<td>' + digit_str + product_str + '</td>';

      // answer part:
      var answer_str = '';
      if (j.bottom == 'answer') {
        var plus_sign = (i==0)? '' : '+';
        answer += '<td class="no-line"> \\(' + plus_sign + prod + '\\) </td>'
      }
    }

    if (answer != '')
      answer = '<tr>' + answer + '<td class="no-line"> \\(= ' + sum + '\\) </td>' + '</tr>';

    var html = '<tr>' + top + '</tr><tr>' + bottom + '</tr>' + answer;

    elem.innerHTML = html;
  }


  var evalExpression = function(exp) {
    if (exp == undefined)
      return '';

    if (exp[0] == '!') {
      exp = exp.substring(1, exp.length)
      return Function("return " + exp)();
    }
    else
      return exp;
  }

  var processEquals = function(elem) {
    var data = elem.getAttribute("data");
    if (data == undefined)
      return;

    // this is to allow "relaxed JSON", where strings do not have to quoted.
    var fixedData = data.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');    
    var j = JSON.parse(fixedData);
    
    var txt = '\\(' + evalExpression(j.exp) + ' = ';
    if (gShowSolutions)
      txt += evalExpression(j.ans);
    else
      txt += '\\text{__________}';
    txt += '\\)';
    elem.innerHTML = txt;
  }

  // convert digits in base base to base 10
  var b10 = function(digits, base) {
    if (typeof digits === 'number') {
      digits = String(digits);
    }
    var val = 0;

    // TODO - handle errors in this conversion
    for (var i = 0; i < digits.length; i++) {
      var power = digits.length - i - 1;

      var d = digits.charCodeAt(i);
      if (48 <= d && d <= 57)
        d -= 48;
      else
        d -= 55;
      val += (base ** power) * d
    }
    return val;
  }


  var as_ml = function(num, base) {
    var txt = as(num, base);
    return txt + '_{(' + base + ')}';
  }

  // convert a base10 number into base base.
  var as = function(num, base) {
    var out = '';

    while (true) {
      var rem = num % base;
      var num = Math.floor(num / base);

      if (rem > 9)
          rem = String.fromCharCode(55 + rem);

      out = String(rem) + out
      if (num == 0)
          break;
    }
    return out;
  }


  // multiply 2 numbers
  var mult = function(a, b) {
    return N(a.value * b.value, 10);
  }

  // factory to create a number
  var N = function(digits, base) {
    return new Num(digits, base);
  }

  // number class
  var Num = function(digits, base) {
    this.value = b10(digits, base);
    console.log(digits, base, '=', this.value);
  }

  // convert to the given base and return as string
  Num.prototype.base = function(base) {
    console.log('base', base);
    console.log('value', this.value);
    return as(this.value, base);
  }

  return { init:init, N:N, mult:mult, b10:b10, as:as, as_ml:as_ml }
}()

var N = ml.N;
var mult = ml.mult;
var b10 = ml.b10;
var as = ml.as;
var as_ml = ml.as_ml;


