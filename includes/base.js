function addInlineImage(url, target) {
    var targetWidth = parseInt(window.getComputedStyle(target).width);
    var img = document.createElement("img");
    if (url.indexOf("http:") === -1) {
        url = "http:" + url;
    }
    img.src = url;
    var imageWidth = Math.min(targetWidth - 100, img.naturalWidth);
    img.width = imageWidth;
    img.style.marginLeft = ((targetWidth - imageWidth) / 2) + "px";
    /* opera.postError("TwitterInlineImages added this image inline: " + url +
                    " ------------------"); */
    target.dataset.imageAdded = true;
    target.appendChild(img);
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
                        // opera.postError("data-expanded-url updated to " + expandedUrl);
                        tryResolveImageUrl(
                            expandedUrl,
                            function(url) {
                                addInlineImage(url, target);
                            },
                            function() {
                                // opera.postError("Couldn't resolve image for " + expandedUrl);
                            });
                    }
                }, false);

                var url = String.prototype.toString.call(n.href);
                if (n.dataset.expandedUrl) {
                    url = n.dataset.expandedUrl;
                }
                tryResolveImageUrl(
                    url,
                    function(url) {
                        addInlineImage(url, target);
                    },
                    function() {
                        // opera.postError("I didn't find the image, waiting for changes in attributes");
                    });
            }
        }
    }, false);
}

window.addEventListener('load', function(event) {
    // 'WATCH' is only defined in the main document, not some iframe
    // created by Twitter
    if (window.WATCH !== undefined) {
        window.WATCH('boot', function() {
            if (window.using !== undefined) {
                window.using(">api_ready", function() {
                    // opera.postError("Calling the node handler");
                    newNodeHandler(window);
                });
            }
        });
    }
}, false);
