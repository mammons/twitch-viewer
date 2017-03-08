$(function () {
    //Generic list of streamers to start
    var streamerNameArray = ["Monstercat", "ESL_SC2", "OgamingSC2", "cretetion", "freecodecamp", "storbeck", "habathcx", "RobotCaleb", "noobs2ninjas", "jessicamak", "rzsavilla", "pwnatrator", "jackfrags", "twoangrygamers", "simuleios"]
    var streamerIdArray = [];
    var myHeaders = new Headers({
        'Client-ID': config.API_KEY,
        'Accept': 'application/vnd.twitchtv.v5+json'
    });
    var myInit = {
        method: 'GET',
        headers: myHeaders
    };

    getStreamerIDs(streamerNameArray, function (streamers) {
        for (var i = 0; i < streamers.users.length; i++) {
            streamerIdArray.push(streamers.users[i]._id);
        }
        streamerIdArray.forEach(function (stream) {
            getData(stream);
        });
    });

    //Event Listeners--------------------------

    //Handles the All, Inactive, and Active buttons to display those types of streamers
    $(".selector").on("click", function () {

        //Make the right button light up
        $(".selector").removeClass("active");
        $(this).addClass("active");

        //the id of the button clicked. either all, active, or inactive
        var whatTheUserWants = $(this).attr('id');

        if (whatTheUserWants === 'allStreamers') {
            $('.online, .offline').removeClass("hidden");
        }
        else if (whatTheUserWants === "activeStreamers") {
            $('.online').removeClass("hidden");
            $('.offline').addClass("hidden");
        }
        else {
            $('.online').addClass('hidden');
            $('.offline').removeClass('hidden');
        }
    })

    //adding a streamer using the search box
    $("#adder").click(event => {
        event.preventDefault();
        var inputVal = $("input").val();

        getStreamerIDs([inputVal.toString()], function (streamer) {
            var streamerID = streamer.users[0]._id;
            streamerIdArray.unshift(streamerID);
            getData(streamerID);
        });
        //clear input box
        $("input").val("");
    });

    //HELPER FUNCTIONS

    function buildURL(type, nameOrId) {
        if (type == "needsID") {
            return 'https://api.twitch.tv/kraken/users?login=' + nameOrId;
        } else {
            return 'https://api.twitch.tv/kraken/' + type + '/' + nameOrId;
        }
    }

    function getStreamerIDs(streamers, callback) {
        var idUrl = buildURL('needsID', streamers.join(','));

        fetch(idUrl, myInit)
            .then(response => {
                if (response.ok) { return response.json(); };
                throw new Error("network response not ok");
            })
            .then(callback)
            .catch(err => {
                console.error("Error in getting streamer ID: " + err);
            });
    }

    function retrieveStream(streamerID, callback) {
        var streamUrl = buildURL('streams', streamerID);

        fetch(streamUrl, myInit)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error("network response not ok");
            })
            .then(callback)
            .catch(err => {
                console.error("Error in retrieve stream: " + err);
            })
    }

    function getData(streamer) {

        //default stream values
        var stream = {
            name: streamer,
            status: "",
            logo: "http://s.jtvnw.net/jtv_user_pictures/hosted_images/GlitchIcon_purple.png",
            link: "#",
            viewers: "None (Offline)",
            followers: "",
            bannerColor: "#4CAF50",
            game: "Offline",
            statusClass: "offline"
        }

        //initially check for stream data
        retrieveStream(streamer, streamData => {

            //if streamer isn't CURRENTLY streaming, make another call to get the channel data
            if (streamData.stream === null) {

                var channelUrl = buildURL("channels", streamer);

                fetch(channelUrl, myInit)
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        throw new Error("network response not ok");
                    })
                    .then(channelData => {
                        stream.name = channelData.display_name;
                        stream.status = "Offline";
                        stream.logo = channelData.logo || "http://s.jtvnw.net/jtv_user_pictures/hosted_images/GlitchIcon_purple.png";
                        stream.link = channelData.url;
                        stream.followers = channelData.followers.toString();
                        populateDOMwith(stream);
                    });
            }
            else if (streamData.stream === undefined) {
                stream.status = "No Account Found";
                populateDOMwith(stream);
            }
            else {
                stream.name = streamData.stream.channel.display_name;
                stream.status = streamData.stream.channel.status;
                stream.logo = streamData.stream.channel.logo || "http://s.jtvnw.net/jtv_user_pictures/hosted_images/GlitchIcon_purple.png";
                stream.link = streamData.stream.channel.url;
                stream.viewers = streamData.stream.viewers.toString();
                stream.followers = streamData.stream.channel.followers.toString();
                stream.bannerColor = streamData.stream.channel.profile_banner_background_color || "#4CAF50";
                stream.game = streamData.stream.channel.game;
                stream.statusClass = "online";
                populateDOMwith(stream);
            }
        });
    }

    function populateDOMwith(stream) {
        var html = [
        "<li class='well well-sm streamsList__item " + stream.statusClass + "'>",
        "<a href='" + stream.link + "' target='_blank'>",
        "<div class='streamsList__content'>",
        "<div class='streamsList__content__image'>",
        "<img class='img img-rounded' src='" + stream.logo + "' alt='" + stream.name + "'></div>",
        "<div class='streamsList__content__text'>",
        "<h2 class='stream__title'>" + stream.name + "</h2>",
        "<h4 class='stream__game'>Playing: " + stream.game + "</h4>",
        "<h3 class='stream__status'>" + stream.status + "</h3>",
        "<p class='stream__viewers'>Current Viewers: " + stream.viewers + "  Followers: " + stream.followers,
        "</div></div></div></a></div></div>"].join("\n");

        if (stream.statusClass == "online") {
            $(".streamsList").prepend(html);
        } else {
            $(".streamsList").append(html);
        }

    }
});
