$.extend(Object.prototype, {
  clone: function() {
    return this.constructor(this);
  }
});

$.extend(String.prototype, {
  hasAtBeginning: function(myValue) {
    return this.indexOf(myValue) == 0;
  },
  hasAtEnd: function(myValue) {
    return this.lastIndexOf(myValue) == this.length - myValue.length;
  },
  chompLeft: function() {
    if(this.hasAtBeginning("\n")) {
      return this.replace("\n", "");
    }
    return this;
  },
  countOfAtBeginning: function(myValue) {
    var result = 0;
    var value = this.clone();
    while(value.hasAtBeginning(myValue)) {
      result++;
      value = value.replace(myValue, "");
    }
    return result;
  }
});

$.extend(HTMLTextAreaElement.prototype, {
  selection: function() {
    var result = null;
    if(typeof this.selectionStart == "number" && typeof this.selectionEnd == "number") {
      result = this.selectionStart;
    } else {
      var range = document.selection.createRange();
      if(range && range.parentElement() == this) {
        var len = this.value.length;
        var normalizedValue = this.value.replace(/\r\n/g, "\n");
        var textInputRange = this.createTextRange();
        textInputRange.moveToBookmark(range.getBookmark());
        var endRange = this.createTextRange();
        endRange.collapse(false);
        if(textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
          result = len;
        } else {
          result = -textInputRange.moveStart("character", -len);
          result += normalizedValue.slice(0, result).split("\n").length - 1;
        }
      }
    }
    return result;
  },
  insertAtBeginningOfCaretLine: function(myValue) {
    if(typeof this.selection() == "number") {
      var selectionPos = this.selection();
      var pos = this.value.substring(0, selectionPos).lastIndexOf("\n") + 1;
      var scrollTop = this.scrollTop;
      this.value = this.value.substring(0, pos) + myValue + this.value.substring(pos, this.value.length);
      this.focus();
      this.selectionStart = selectionPos + myValue.length;
      this.selectionEnd = selectionPos + myValue.length;
      this.scrollTop = scrollTop;
    }
  },
  removeFromBeginningOfCaretLine: function(myValue) {
    if(typeof this.selection() == "number") {
      var selectionPos = this.selection();
      var pos = this.value.substring(0, selectionPos).lastIndexOf("\n") + 1;
      var scrollTop = this.scrollTop;
      if(this.value.substring(pos, this.value.length).hasAtBeginning(myValue)) {
        this.value = this.value.substring(0, pos) + this.value.substring(pos, this.value.length).replace(myValue, "");
        this.focus();
        this.selectionStart = selectionPos - myValue.length;
        this.selectionEnd = selectionPos - myValue.length;
        this.scrollTop = scrollTop;
      }
    }
  },
  currentLine: function() {
    if(typeof this.selection() == "number") {
      var selectionPos = this.selection();
      var leftPos = this.value.substring(0, selectionPos).lastIndexOf("\n");
      var rightPos = this.value.substring(selectionPos, this.value.length).indexOf("\n") + selectionPos;
      var line = this.value.substring(leftPos, rightPos);
      return line;
    }
    return null;
  },
  parrentLine: function() {
    var linesBefore = this.value.split(this.currentLine())[0].split("\n");
    return linesBefore[linesBefore.length - 1];
  },
  childLine: function() {
    var linesAfter = this.value.split(this.currentLine())[1].split("\n");
    return linesAfter[1];
  },
  indentLevel: function(opts) {
    var options = $.extend({
      target: "this",
      indentTag: "<TAB>"
    }, opts);
    var line;
    if(options["target"] == "parent") {
      line = this.parrentLine();
    } else if(options["target"] == "child") {
      line = this.childLine();
    } else {
      line = this.currentLine();
    }
    if(typeof line == "string" && line != "") {
      line = line.chompLeft();
      return line.countOfAtBeginning(options["indentTag"]);
    }
    return 0;
  }
});

$.fn.extend({
  tasky: function(options) {

// VARIABLES
    var $target = $(this);
    var $options = $.extend({
      width: 200,
      height: 100,
      indentTag: "<TAB>",
      indentKeyCode: 9, // Tab
      clearKeyCode: 46, // Del
      modKey: "shiftKey"
    }, options);

// EVENTS
    $target.bind("indent:remove", function() {
      if(this.indentLevel({target: "this", indentTag: $options["indentTag"]}) >= this.indentLevel({target: "child", indentTag: $options["indentTag"]})) {
        this.removeFromBeginningOfCaretLine($options["indentTag"]);
      }
      return true;
    });
    $target.bind("indent:add", function() {
      if(this.indentLevel({target: "this", indentTag: $options["indentTag"]}) <= this.indentLevel({target: "parent", indentTag: $options["indentTag"]})) {
        this.insertAtBeginningOfCaretLine($options["indentTag"]);
      }
      return true;
    });

// KEY BIND
    $target.keydown(function(event) {
      if(event.keyCode == $options["indentKeyCode"] && event[$options["modKey"]] == true) {
        event.preventDefault();
        $target.trigger("indent:remove");
      } else if(event.keyCode == $options["indentKeyCode"] && event[$options["modKey"]] == false) {
        event.preventDefault();
        $target.trigger("indent:add");
      }
    });

// CSS
    $target.width($options["width"]);
    $target.height($options["height"]);
  }
});
