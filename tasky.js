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
  insertIntoPosition: function(pos, myValue) {
    var scrollTop = this.scrollTop;
    this.value = this.value.substring(0, pos) + myValue + this.value.substring(pos, this.value.length);
    this.focus();
    this.scrollTop = scrollTop;
  },
  removeFromPosition: function(pos, myValue) {
    var scrollTop = this.scrollTop;
    this.value = this.value.substring(0, pos) + this.value.substring(pos + myValue.length, this.value.length);
    this.focus();
    this.scrollTop = scrollTop;
  },
  insertAtBeginningOfCaretLine: function(myValue) {
    if(typeof this.selection() == "number") {
      var selectionPos = this.selection();
      var pos = this.value.substring(0, selectionPos).lastIndexOf("\n") + 1;
      this.insertIntoPosition(pos, myValue);
      this.selectionStart = selectionPos + myValue.length;
      this.selectionEnd = selectionPos + myValue.length;
    }
  },
  removeFromBeginningOfCaretLine: function(myValue) {
    if(typeof this.selection() == "number") {
      var selectionPos = this.selection();
      var pos = this.value.substring(0, selectionPos).lastIndexOf("\n") + 1;
      if(this.value.substring(pos, this.value.length).hasAtBeginning(myValue)) {
        this.removeFromPosition(pos, myValue);
        this.selectionStart = selectionPos - myValue.length;
        this.selectionEnd = selectionPos - myValue.length;
      }
    }
  },
  insertAtEndOfCaretLine: function(myValue) {
    if(typeof this.selection() == "number") {
      var selectionPos = this.selection();
      var pos = this.value.substring(selectionPos, this.value.length).indexOf("\n") + this.value.substring(0, selectionPos).length;
      this.insertIntoPosition(pos, myValue);
      this.selectionStart = selectionPos;
      this.selectionEnd = selectionPos;
    }
  },
  removeFromEndOfCaretLine: function(myValue) {
    if(typeof this.selection() == "number") {
      var selectionPos = this.selection();
      var pos = this.value.substring(selectionPos, this.value.length).indexOf("\n") + this.value.substring(0, selectionPos).length - 1;
      var scrollTop = this.scrollTop;
      if(this.value.substring(pos, this.value.length).hasAtBeginning(myValue)) {
        this.removeFromPosition(pos, myValue);
        this.selectionStart = selectionPos;
        this.selectionEnd = selectionPos;
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
      indentTag: "\u00bb"
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
      return line.chompLeft().countOfAtBeginning(options["indentTag"]);
    }
    return 0;
  }
});

$.fn.extend({
  tasky: function(options) {

// VARIABLES
    var $target = $(this);
    var $options = $.extend({
      indentTag: "\u00bb",
      doneTag: "\u2713",
      indentKeyCode: 9, // Tab
      doneKeyCode: 13,  // Enter
      clearKeyCode: 46, // Del
      modKey: "shiftKey"
    }, options);

// EVENTS
    $target.bind("indent:remove", function() {
      if(this.indentLevel({target: "this", indentTag: $options["indentTag"]}) >= this.indentLevel({target: "child", indentTag: $options["indentTag"]})) {
        this.removeFromBeginningOfCaretLine($options["indentTag"]);
      }
      if(this.currentLine().hasAtEnd($options["doneTag"]) && !this.currentLine().chompLeft().hasAtBeginning($options["indentTag"])) {
        this.removeFromEndOfCaretLine($options["doneTag"]);
      }
      return true;
    });
    $target.bind("indent:add", function() {
      if(this.indentLevel({target: "this", indentTag: $options["indentTag"]}) <= this.indentLevel({target: "parent", indentTag: $options["indentTag"]})) {
        this.insertAtBeginningOfCaretLine($options["indentTag"]);
      }
      return true;
    });
    $target.bind("indent:do", function() {
      if(!this.currentLine().hasAtEnd($options["doneTag"]) && this.currentLine().chompLeft().hasAtBeginning($options["indentTag"])) {
        this.insertAtEndOfCaretLine($options["doneTag"]);
      }
      return true;
    });

// KEY BIND
    $target.keydown(function(event) {
      if(this.value != "") {
        if(event.keyCode == $options["indentKeyCode"] && event[$options["modKey"]] == true) {
          event.preventDefault();
          $target.trigger("indent:remove");
        } else if(event.keyCode == $options["indentKeyCode"] && event[$options["modKey"]] == false) {
          event.preventDefault();
          $target.trigger("indent:add");
        } else if(event.keyCode == $options["doneKeyCode"] && event[$options["modKey"]] == true) {
          event.preventDefault();
          $target.trigger("indent:do");
        }
      }
    });

// CSS
    $target.addClass("tasky-tasks");
  }
});
