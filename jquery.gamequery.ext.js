/*
 * gameQuery.ext
 *
 * Copyright (c) 2010 Rob Britton
 * licensed under the MIT (MIT-LICENSE.txt)
 */
$.extend($, {gameQueryExt: {}});

/* QuadTree
 * A space-partitioning tree useful for efficient collision detection.
 */
$.gameQueryExt.QuadTree = function (width, height){
  this.width = width; this.height = height;

  this.root = null;
}
$.gameQueryExt.QuadTreeNode = function(x, y, width, height){
  this.x = x; this.y = y;
  this.width = width; this.height = height;

  this.child = true;
  this.objects = [];

  this.splitSize = 5;
}

$.gameQueryExt.QuadTreeNode.prototype.add = function(obj, x, y){
  if (this.child){
    if (this.objects.length == this.splitSize){
      this.split();
      this.add(obj, x, y);
    }else{
      this.objects.push({obj: obj, x: x, y: y});
    }
  }else{
    var cx = x - this.x;
    var cy = y - this.y;

    if (cx < this.width / 2){
      if (cy < this.height / 2){
        this.children.tl.add(obj, x, y);
      }else{
        this.children.bl.add(obj, x, y);
      }
    }else{
      if (cy < this.height / 2){
        this.children.tr.add(obj, x, y);
      }else{
        this.children.br.add(obj, x, y);
      }
    }
  }
}
$.gameQueryExt.QuadTreeNode.prototype.split = function(){
  this.child = false;
  this.children = {
    tl: new $.gameQueryExt.QuadTreeNode(this.x, this.y, this.width / 2, this.height / 2),
    tr: new $.gameQueryExt.QuadTreeNode(this.x + this.width / 2, this.y, this.width / 2, this.height / 2),
    bl: new $.gameQueryExt.QuadTreeNode(this.x, this.y + this.height / 2, this.width / 2, this.height / 2),
    br: new $.gameQueryExt.QuadTreeNode(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2),
  }

  for (var i = 0; i < this.objects.length; i++){
    var obj = this.objects[i];
    this.add(obj.obj, obj.x, obj.y);
  }
  delete this.objects;
}
$.gameQueryExt.QuadTreeNode.prototype.get = function(x, y, width, height){
  if (this.child){
    if (!$.gameQueryExt.rectOverlap(this.x, this.y, this.width, this.height, x, y, width, height)){
      return null;;
    }else{
      return $.map(this.objects, function(obj, i) { return obj.obj; });
    }
  }else{
    var ret = [];
    var next;

    for (var i in this.children){
      if ((next = this.children[i].get(x, y, width, height)) !== null)
      $.merge(ret, next);
    }
    return ret;
  }
}

$.gameQueryExt.QuadTree.prototype.add = function(obj, x, y){
  if (!this.root){
    this.root = new $.gameQueryExt.QuadTreeNode(0, 0, this.width, this.height);
  }
  this.root.add(obj, x, y);
}
$.gameQueryExt.QuadTree.prototype.get = function(x, y, width, height){
  if (!this.root)
    return [];
  return this.root.get(x, y, width, height);
}

$.gameQueryExt.rectOverlap = function(x1, y1, w1, h1, x2, y2, w2, h2){
  if ((x1 + w1 >= x2) &&
      (y1 + h1 >= y2) &&
      (x1 <= x2 + w2) &&
      (y1 <= y2 + h2))
    return true;
  return false;
}

$.gameQueryExt.keyDown = function(what){
  return $.gameQuery.keyTracker[$.gameQueryExt.keycodes[what]];
}

$.gameQueryExt.keycodes = {
  backspace:  8,
  tab:        9,
  enter:     13,
  shift:     16,
  ctrl:      17,
  alt:       18,
  pause:     19,
  caps:      20,
  escape:    27,
  space:     32,
  pageup:    33,
  pagedown:  34,
  end:       35,
  home:      36,
  left:      37,
  up:        38,
  right:     39,
  down:      40,
  insert:    45,
  del:       46
}

for (var i = 48; i <= 57; i++){
  $.gameQueryExt.keycodes[String.fromCharCode(i)] = i;
}
for (var i = 65; i <= 90; i++){
  $.gameQueryExt.keycodes[String.fromCharCode(i)] = i;
}
for (var i = 0; i <= 9; i++){
  $.gameQueryExt.keycodes["num" + i] = i + 96;
}
for (var i = 1; i <= 12; i++){
  $.gameQueryExt.keycodes["f" + i] = i + 111;
}

$.gameQueryExt.getTimeElapsed = function (){
  if ($.gameQueryExt.getTimeElapsed.lastFrame === undefined)
    $.gameQueryExt.getTimeElapsed.lastFrame = new Date();

  var currentTime = new Date();
  var gap = new Date();
  gap.setTime(currentTime.getTime() - $.gameQueryExt.getTimeElapsed.lastFrame.getTime());
  $.gameQueryExt.getTimeElapsed.lastFrame = currentTime;
  return gap.getMilliseconds();
}

/* View classes for handling scrolling backgrounds
 * 
 * @param viewport The jQuery element where the view is displayed
 * @param background The jQuery element to be scrolled around in the viewport
 */
function View(viewport, background, options){
  this.viewport = viewport;
  this.background = background;

  $.extend({
    width: background.width(),
    height: background.height()
  }, options);

  background.css(
    {
      backgroundRepeat: "repeat",
      backgroundPosition: "0px 0px",
      backgroundImage: "url(" + options.imageURL + ")",
      width: options.width + "px",
      height: options.height + "px"
    }
  );

  return background;
}


View.prototype.frame = function(timeStep){}

View.prototype.scroll = function(dx, dy){
  if (this.background === null){
    return;
  }
  var pos = this.background.position();
  var x = dx - pos.left;
  var y = dy - pos.top;
  this.anchor(x, y);
}

View.prototype.anchor = function(x, y){
  var position = this.background.position();

  if (x < 0)
    x = 0;
  else if (x + this.viewport.width() >= this.background.width())
    x = this.background.width() - this.viewport.width();

  if (y < 0)
    y = 0;
  else if (y + this.viewport.height() >= this.background.height())
    y = this.background.height() - this.viewport.height();

  var offset = this.background.offset();
  // need to floor it to prevent jittering
  this.background.offset({
    left: Math.floor(offset.left - position.left - x),
    top: Math.floor(offset.top - position.top - y)
  });
  return this.background;
}

function LockedView(target, viewport, background, options){
  View.call(this, viewport, background, options);
  this.target = target;
}
LockedView.prototype = View.prototype;

LockedView.prototype.frame = function(timeStep){
  var left = this.target.position().left;
  var top = this.target.position().top;
  this.anchor(left - Math.floor(this.viewport.width() / 2), top - Math.floor(this.viewport.height() / 2));
}


