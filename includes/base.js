var debug            = false;
var watchImageRegExp = /tsqi/;

function debug(str, url) {
    if (debug && (!url || url.match(watchImageRegExp))) {
        opera.postError(str);
    }
}

function addInlineImage(url, target) {
    var targetWidth = parseInt(window.getComputedStyle(target).width);
    var img = document.createElement("img");
    if (url.indexOf("http:") === -1) {
        url = "http:" + url;
    }
    img.src = url;
    debug("Creating img element for " + url, url);
    img.addEventListener('load', function() {
        var imageWidth = Math.min(targetWidth - 100, img.naturalWidth);
        img.width = imageWidth;
        img.style.marginLeft = ((targetWidth - imageWidth) / 2) + "px";
        debug("TwitterInlineImages added this image inline: " + url +
                  " with width " + imageWidth + " and margin " +
                  img.style.marginLeft + " ------------------",
              url);
        target.dataset.imageAdded = true;
        target.appendChild(img);
    }, false);
}

function tryResolveImageUrl(url, fSuccess, fFailure) {
    if (url.match(/\.jpg$/) || url.match(/\.png$/) || url.match(/\.gif$/)) {
        fSuccess(url);
    } else {
        if (window.twttr !== undefined && window.twttr.media !== undefined) {
            window.twttr.media.resolveImageUrl(url, 300, {
                success: fSuccess,
                error: fFailure || function() {},
            });
        } else {
            opera.postError("ERROR: window.twttr.media is not defined");
        }
    }
}

function resolveImages(target) {
    var nodes = target.getElementsByClassName("twitter-timeline-link");
    for (var i = 0, l = nodes.length; i < l; i += 1) {
        var n = nodes[i];

        // Watch for changes in the expanded URL before we
        // check the value, to avoid race conditions
        n.addEventListener('DOMAttrModified',function(event) {
            if (event.target.dataset.imageAdded)
                return;
            if (event.attrName === 'data-expanded-url') {
                var expandedUrl = event.newValue;
                debug("data-expanded-url updated to " + expandedUrl, expandedUrl);
                tryResolveImageUrl(
                    expandedUrl,
                    function(url) {
                        addInlineImage(url, target);
                    },
                    function() {
                        debug("Couldn't resolve image for " + expandedUrl, expandedUrl);
                    });
            }
        }, false);

        var url = String.prototype.toString.call(n.href);
        debug("I peep into a link to " + url, url);
        if (n.dataset.expandedUrl) {
            debug("Expanded URL is " + n.dataset.expandedUrl, url);
            url = n.dataset.expandedUrl;
        }
        tryResolveImageUrl(
            url,
            function(url) {
                addInlineImage(url, target);
            },
            function() {
                debug("I didn't find the image in " + url + ", waiting for changes in attributes", url);
            });
    }
}

function newNodeHandler(w) {
    w.addEventListener('DOMNodeInserted', function(event) {
        var target = event.target;

        if (target.dataset && target.dataset.itemType === "tweet") {
            if (target.dataset.expandImagesDone === "ready") {
                return;
            }
            target.dataset.expandImagesDone = "ready";

            if (typeof target.getElementsByClassName !== 'function') {
                return;
            }

            resolveImages(target);
        }
    }, false);
}

window.addEventListener('load', function(event) {
    // 'WATCH' is only defined in the main document, not some iframe
    // created by Twitter
    if (window.WATCH !== undefined) {
        window.WATCH('boot', function() {
            if (window.using !== undefined) {
                window.using("bundle/phoenix-core", function() {
                    newNodeHandler(window);
                    var nodes = window.document.getElementsByClassName("stream-item");
                    for (var i = 0, l = nodes.length; i < l; i += 1) {
                        resolveImages(nodes[i]);
                    }
                });
            }
        });
    }
}, false);
