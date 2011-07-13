function addInlineImage(url, target) {
    var targetWidth = parseInt(window.getComputedStyle(target).width);
    var img = document.createElement("img");
    img.src = url;
    img.width = targetWidth - 100;
    img.style.marginLeft = "50px";
    // opera.postError("TwitterInlineImages added this image inline: " + url);
    target.appendChild(img);
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
                var url = String.prototype.toString.call(nodes[i].href);
                if (nodes[i].dataset.expandedUrl) {
                    url = nodes[i].dataset.expandedUrl;
                }
                window.twttr.media.resolveImageUrl(url, 300, {
                    success: function(imageUrl) {
                        var finalUrl = imageUrl;
                        if (finalUrl.indexOf("http:") === -1) {
                            // opera.postError("I get a URL without protocol???? " + finalUrl);
                            finalUrl = "http:" + finalUrl;
                        }
                        addInlineImage(finalUrl, target);
                    },
                    error: function() {
                        if (url.match(/\.jpg$/) || url.match(/\.png$/) ||
                                url.match(/\.gif$/)) {
                            addInlineImage(url, target);
                        }
                    }
                })
            }
        }
    }, false);
}, false);
