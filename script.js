function dataURIToId(dataUri) {
    const matches = dataUri.match("coremedia://article/([0-9]+)");
    return matches ? matches[1] || false : false;
}

function endpointFor(id) {
    return 'https://api.abc.net.au/terminus/api/v2/teasablecontent/coremedia/article/' + id + '?apikey=725c0f7ab3f54197bede3138afe583e9'
}

async function lookupTitle(id) {
    var cached = await chrome.storage.local.get(id);
    if(id in cached) {
        return cached[id];
    } else {
        var json = await fetch(endpointFor(id)).then((response) => response.json());

        // This is a teaser, find the actual id of the article
        if(json?.["target"]?.["id"]) {
            var targetid = json?.["target"]?.["id"];
            json = await fetch(endpointFor(targetid)).then((response) => response.json());
        }

        var longtitle = json["titleAlt"]["lg"];

        await chrome.storage.local.set({[id]: longtitle});

        return longtitle;
    }
}

setTimeout(() => {

var cards = document.querySelectorAll(
    "div[data-component=VolumeCard], " +
    "div[data-component=GenericCard], " +
    "div[data-component=ListCard], " +
    "li[data-component=TopStoriesCard], " +
    "div[data-component=ContentCard]"
    );

cards.forEach(async (card) => {
    // If both data-target-uri and data-uri are present, the former is
    // what we want.
    var dataUri = (card.attributes["data-target-uri"] || card.attributes["data-uri"]).value;
    var articleId = dataURIToId(dataUri);
    if(!articleId || isNaN(articleId)) {
        return;
    }

    var longtitle = await lookupTitle(articleId);

    var titleElement = card.querySelector(
        "h3[data-component=CardHeading] span[data-component=KeyboardFocus]"
    );

    // Sometimes the link tag is outside the h3, sometimes inside, so
    // go inside the link if it is present.
    var sublink = titleElement.querySelector("a[data-component=Link]");
    if(sublink)
        titleElement = sublink;

    titleElement.innerText = longtitle;
});

}, 500);
