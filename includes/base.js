function addInlineImage(url, target) {
    var targetWidth = parseInt(window.getComputedStyle(target).width);
    var img = document.createElement("img");
    if (url.indexOf("http:") === -1) {
        url = "http:" + url;
    }
    img.src = url;
    img.width = targetWidth - 100;
    img.style.marginLeft = "50px";
    /* opera.postError("TwitterInlineImages added this image inline: " + url +
                    " ------------------"); */
    target.dataset.imageAdded = true;
    target.appendChild(img);
}

function tryResolveImageUrl(url, fSuccess, fFailure) {
    if (url.match(/\.jpg$/) || url.match(/\.png$/) || url.match(/\.gif$/)) {
        fSuccess(url);
    } else {
        window.twttr.media.resolveImageUrl(url, 300, {
            success: fSuccess,
            error: fFailure || function() {},
        });
    }
}

window.addEventListener('load', function() {
    window.addEventListener('DOMNodeInserted', function(event) {
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
}, false);
