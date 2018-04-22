const init = () => {
    const config = {};
    config.username = "justinfan12345"; // username
    config.oauth = "oauth:kappa"; // oauth
    config.channel = "mobilmobil"; // channel
    config.wsUri = "wss://irc-ws.chat.twitch.tv/"; //twitch irc server
    config.bots = ["Nightbot", "Moobot", "JIBOT"]; // Bots
    config.output_div_id = "output"; // <div id="output"></div>
    config.chat_line_limit = 300;
    config.DEBUG_MODE = false; // DEBUG_MODE && console.log("debug mod");

    const tw_ws = new TwitchWS(config);
};

window.addEventListener("load", init, false);